"""Business logic for the donation workflow — mirrors the frontend service layer.

Status pipeline:
  pending → accepted → volunteer_assigned → picked_up → delivered → completed
plus rejected (per-NGO decline) and cancelled (donor withdrawal).
"""
from datetime import datetime, timezone, timedelta
from extensions import db
from models import Donation, DonationEvent, CollectionTask, TaskEvent, Notification, User


class WorkflowError(Exception):
    pass


def _now():
    return datetime.now(timezone.utc)


def _parse(value):
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(str(value).replace("Z", "+00:00"))


def _parse_coord(value):
    if value is None or value == "":
        return None
    try:
        v = float(value)
    except (TypeError, ValueError):
        return None
    return v


def notify(user_ids, title, body, donation_id=None):
    for uid in user_ids if isinstance(user_ids, (list, tuple)) else [user_ids]:
        if uid:
            db.session.add(Notification(user_id=uid, title=title, body=body, donation_id=donation_id))


def _donation_event(donation, status, by, note):
    donation.status = status
    donation.updated_at = _now()
    db.session.add(DonationEvent(donation_id=donation.id, status=status, by=by, note=note))


def _task_event(task, status, by, note):
    task.status = status
    task.updated_at = _now()
    db.session.add(TaskEvent(task_id=task.id, status=status, by=by, note=note))


def _ngo_ids():
    return [u.id for u in User.query.filter_by(role="ngo", active=True).all()]


def _volunteer_ids():
    return [u.id for u in User.query.filter_by(role="volunteer", active=True).all()]


def create_donation(payload, donor):
    if not payload.get("safetyDeclared"):
        raise WorkflowError("You must confirm the food safety declaration.")
    prepared = _parse(payload["preparedAt"])
    available = _parse(payload["availableUntil"])
    if available <= prepared:
        raise WorkflowError('"Available until" must be after the preparation time.')

    donation = Donation(
        donor_id=donor.id,
        food_name=payload["foodName"].strip(),
        category=payload["category"],
        diet=payload["diet"],
        quantity=float(payload["quantity"]),
        unit=payload["unit"],
        prepared_at=prepared,
        available_until=available,
        storage=payload["storage"],
        pickup_address=payload["pickupAddress"].strip(),
        pickup_latitude=_parse_coord(payload.get("pickupLatitude")),
        pickup_longitude=_parse_coord(payload.get("pickupLongitude")),
        instructions=(payload.get("instructions") or "").strip(),
        image_url=payload.get("imageUrl") or "",
        safety_declared=True,
        status="pending",
        rejected_by=[],
    )
    db.session.add(donation)
    db.session.flush()
    db.session.add(DonationEvent(donation_id=donation.id, status="pending",
                                 by=donor.id, note="Donation registered"))
    # Notify only suitable (matching) NGOs when coordinates are available.
    target_ngos = []
    if _valid_coord(donation.pickup_latitude, donation.pickup_longitude):
        try:
            matches = nearby_ngos(donation.pickup_latitude, donation.pickup_longitude,
                                  radius_km=100.0, category=donation.category,
                                  quantity=donation.quantity)
            target_ngos = [m["ngo"]["id"] for m in matches]
        except WorkflowError:
            target_ngos = []
    if not target_ngos:
        target_ngos = [u.id for u in User.query.filter_by(role="ngo", active=True, verified=True).all()]
    notify(target_ngos, "New donation available",
           f"{donor.org_name or donor.name} listed {donation.quantity:g} {donation.unit} of {donation.food_name}.",
           donation.id)
    db.session.commit()
    return donation


def accept_donation(donation_id, ngo):
    donation = Donation.query.get(donation_id)
    if not donation:
        raise WorkflowError("Donation not found.")
    if donation.status != "pending":
        raise WorkflowError("This donation is no longer available.")
    if donation.available_until.replace(tzinfo=timezone.utc) <= _now():
        raise WorkflowError("This donation has expired.")
    if ngo.id in (donation.rejected_by or []):
        raise WorkflowError("You have already declined this donation.")
    if not ngo.verified:
        raise WorkflowError("Your NGO must be verified by an admin before accepting donations.")

    _donation_event(donation, "accepted", ngo.id, f"Accepted by {ngo.org_name}")
    donation.accepted_by = ngo.id

    dist = haversine_km(donation.pickup_latitude, donation.pickup_longitude,
                        ngo.latitude, ngo.longitude) or 0.0
    task = CollectionTask(
        donation_id=donation.id, status="open",
        declined_by=[], distance_km=dist,
        pickup_address=donation.pickup_address, delivery_address=ngo.address,
    )
    db.session.add(task)
    db.session.flush()
    donation.task_id = task.id
    db.session.add(TaskEvent(task_id=task.id, status="open", by=ngo.id,
                             note="Task created when NGO accepted"))

    notify(donation.donor_id, "Donation accepted",
           f"{ngo.org_name} accepted \"{donation.food_name}\".", donation.id)
    # Notify eligible (nearby) volunteers when coordinates are available.
    target_vols = []
    if _valid_coord(donation.pickup_latitude, donation.pickup_longitude):
        for v in User.query.filter_by(role="volunteer", active=True).all():
            if not _valid_coord(v.latitude, v.longitude):
                target_vols.append(v.id)
                continue
            dist = haversine_km(donation.pickup_latitude, donation.pickup_longitude, v.latitude, v.longitude)
            if dist is not None and dist <= 30.0:
                target_vols.append(v.id)
    if not target_vols:
        target_vols = _volunteer_ids()
    notify(target_vols, "New collection task nearby",
           f"{donation.food_name} — pickup at {donation.pickup_address.split(',')[0]}, delivery to {ngo.org_name}.",
           donation.id)
    db.session.commit()
    return donation


def reject_donation(donation_id, ngo):
    donation = Donation.query.get(donation_id)
    if not donation:
        raise WorkflowError("Donation not found.")
    if donation.status != "pending":
        raise WorkflowError("Only pending donations can be declined.")
    rejected = list(donation.rejected_by or [])
    rejected.append(ngo.id)
    donation.rejected_by = rejected
    donation.updated_at = _now()
    notify(donation.donor_id, "Donation declined",
           f"{ngo.org_name} declined \"{donation.food_name}\". It remains visible to other NGOs.",
           donation.id)
    db.session.commit()
    return donation


def cancel_donation(donation_id, donor):
    donation = Donation.query.get(donation_id)
    if not donation:
        raise WorkflowError("Donation not found.")
    if donation.donor_id != donor.id:
        raise WorkflowError("You can only cancel your own donations.")
    if donation.status not in ("pending", "accepted", "volunteer_assigned"):
        raise WorkflowError("This donation can no longer be cancelled (food already picked up).")
    _donation_event(donation, "cancelled", donor.id, "Cancelled by donor")
    if donation.task_id:
        task = CollectionTask.query.get(donation.task_id)
        if task and task.status not in ("completed", "cancelled"):
            _task_event(task, "cancelled", donor.id, "Donation cancelled")
    notify([donation.accepted_by, donation.volunteer_id], "Donation cancelled",
           f"{donor.org_name or donor.name} cancelled \"{donation.food_name}\".", donation.id)
    db.session.commit()
    return donation


def confirm_receipt(donation_id, ngo):
    donation = Donation.query.get(donation_id)
    if not donation:
        raise WorkflowError("Donation not found.")
    if donation.accepted_by != ngo.id:
        raise WorkflowError("Only the accepting NGO can confirm receipt.")
    if donation.status != "delivered":
        raise WorkflowError("Receipt can only be confirmed after delivery.")
    _donation_event(donation, "completed", ngo.id, "NGO confirmed receipt")
    if donation.task_id:
        task = CollectionTask.query.get(donation.task_id)
        if task:
            _task_event(task, "completed", ngo.id, "NGO confirmed receipt")
    notify([donation.donor_id, donation.volunteer_id], "Donation completed",
           f"{ngo.org_name} confirmed receipt of \"{donation.food_name}\".", donation.id)
    db.session.commit()
    return donation


# ---- Volunteer task workflow ------------------------------------------------

def accept_task(task_id, volunteer):
    # Lock the row to prevent two volunteers claiming the same task.
    task = CollectionTask.query.with_for_update().get(task_id)
    if not task:
        raise WorkflowError("Collection task not found.")
    if volunteer.id in (task.declined_by or []):
        raise WorkflowError("You have already declined this task.")
    if task.status != "open":
        raise WorkflowError("This task has already been taken by another volunteer.")
    donation = Donation.query.get(task.donation_id)
    if not donation or donation.status != "accepted":
        raise WorkflowError("This donation is no longer awaiting collection.")
    task.volunteer_id = volunteer.id
    _task_event(task, "assigned", volunteer.id, f"{volunteer.name} accepted the task")
    donation.volunteer_id = volunteer.id
    _donation_event(donation, "volunteer_assigned", volunteer.id,
                    f"{volunteer.name} accepted the collection task")
    notify([donation.accepted_by, donation.donor_id], "Volunteer assigned",
           f"{volunteer.name} will collect \"{donation.food_name}\".",
           donation.id)
    db.session.commit()
    return task


def decline_task(task_id, volunteer):
    task = CollectionTask.query.get(task_id)
    if not task:
        raise WorkflowError("Collection task not found.")
    if task.status != "open":
        raise WorkflowError("This task is no longer open.")
    declined = list(task.declined_by or [])
    if volunteer.id not in declined:
        declined.append(volunteer.id)
        task.declined_by = declined
        task.updated_at = _now()
        db.session.commit()
    return task


# Valid task status transitions (role enforced by callers).
TASK_TRANSITIONS = {
    "open": {"assigned"},
    "assigned": {"cancelled"},
    "picked_up": {"delivered", "cancelled"},
    "delivered": {},
}


def update_task_status(task_id, volunteer, new_status):
    task = CollectionTask.query.get(task_id)
    if not task:
        raise WorkflowError("Collection task not found.")
    if task.volunteer_id != volunteer.id:
        raise WorkflowError("This is not your task.")
    if new_status not in TASK_TRANSITIONS.get(task.status, set()):
        raise WorkflowError(f"Cannot move task from {task.status} to {new_status}.")
    donation = Donation.query.get(task.donation_id)
    if new_status == "picked_up":
        _task_event(task, "picked_up", volunteer.id, "Pickup confirmed at donor location")
        _donation_event(donation, "picked_up", volunteer.id, "Pickup confirmed at donor location")
        notify([donation.donor_id, donation.accepted_by], "Food picked up",
               f"{volunteer.name} collected \"{donation.food_name}\".", donation.id)
    elif new_status == "delivered":
        ngo = User.query.get(donation.accepted_by)
        ngo_name = ngo.org_name if ngo else "the NGO"
        _task_event(task, "delivered", volunteer.id, f"Delivered to {ngo_name}")
        _donation_event(donation, "delivered", volunteer.id, f"Delivered to {ngo_name}")
        notify(donation.accepted_by, "Delivery awaiting confirmation",
               f"\"{donation.food_name}\" was delivered. Please confirm receipt.", donation.id)
        notify(donation.donor_id, "Your donation was delivered",
               f"\"{donation.food_name}\" reached {ngo_name}.", donation.id)
    elif new_status == "cancelled":
        _task_event(task, "cancelled", volunteer.id, "Cancelled by volunteer")
        _donation_event(donation, "cancelled", volunteer.id, "Cancelled by volunteer")
    db.session.commit()
    return task


def confirm_pickup(task_id, volunteer):
    task = CollectionTask.query.get(task_id)
    if not task:
        raise WorkflowError("Collection task not found.")
    if task.volunteer_id != volunteer.id:
        raise WorkflowError("This is not your task.")
    if task.status != "assigned":
        raise WorkflowError("Pickup can only be confirmed for assigned tasks.")
    donation = Donation.query.get(task.donation_id)
    _task_event(task, "picked_up", volunteer.id, "Pickup confirmed at donor location")
    _donation_event(donation, "picked_up", volunteer.id, "Pickup confirmed at donor location")
    notify([donation.donor_id, donation.accepted_by], "Food picked up",
           f"{volunteer.name} collected \"{donation.food_name}\".", donation.id)
    db.session.commit()
    return task


def confirm_delivery(task_id, volunteer):
    task = CollectionTask.query.get(task_id)
    if not task:
        raise WorkflowError("Collection task not found.")
    if task.volunteer_id != volunteer.id:
        raise WorkflowError("This is not your task.")
    if task.status != "picked_up":
        raise WorkflowError("Delivery can only be confirmed after pickup.")
    donation = Donation.query.get(task.donation_id)
    ngo = User.query.get(donation.accepted_by)
    ngo_name = ngo.org_name if ngo else "the NGO"
    _task_event(task, "delivered", volunteer.id, f"Delivered to {ngo_name}")
    _donation_event(donation, "delivered", volunteer.id, f"Delivered to {ngo_name}")
    notify(donation.accepted_by, "Delivery awaiting confirmation",
           f"\"{donation.food_name}\" was delivered. Please confirm receipt.",
           donation.id)

    notify(donation.donor_id, "Your donation was delivered",
           f"\"{donation.food_name}\" reached {ngo_name}.", donation.id)
    db.session.commit()
    return task


# ---- Location-based NGO matching (Phase 2 Module 1) -------------------------

import math


def haversine_km(lat1, lon1, lat2, lon2):
    """Great-circle distance in kilometres between two lat/long points."""
    if None in (lat1, lon1, lat2, lon2):
        return None
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(2 * R * math.asin(math.sqrt(a)), 2)


def _valid_coord(lat, lon):
    return (lat is not None and lon is not None
            and -90 <= lat <= 90 and -180 <= lon <= 180)


def nearby_ngos(lat, lon, radius_km=25.0, category=None, quantity=0.0):
    """Return verified, active NGOs within radius, optionally filtered by
    accepted category and quantity range. Each entry includes distance + reasons."""
    if not _valid_coord(lat, lon):
        raise WorkflowError("Invalid location coordinates.")
    if radius_km is None or radius_km <= 0 or radius_km > 500:
        raise WorkflowError("Service radius must be between 1 and 500 km.")
    ngos = User.query.filter_by(role="ngo", active=True, verified=True).all()
    results = []
    for ngo in ngos:
        if not _valid_coord(ngo.latitude, ngo.longitude):
            continue
        dist = haversine_km(lat, lon, ngo.latitude, ngo.longitude)
        if dist is None or dist > (ngo.service_radius_km or radius_km) or dist > radius_km:
            continue
        reasons = [f"Within {dist} km service area"]
        # category filter
        accepted = ngo.accepted_categories or []
        if category and accepted and category not in accepted:
            continue
        if category and category in accepted:
            reasons.append(f"Accepts {category.replace('_', ' ')}")
        # quantity filter
        if quantity and ngo.min_quantity and quantity < ngo.min_quantity:
            continue
        if quantity and ngo.max_quantity and ngo.max_quantity > 0 and quantity > ngo.max_quantity:
            continue
        if quantity:
            reasons.append("Quantity fits requirements")
        results.append({
            "ngo": ngo.to_dict(),
            "distanceKm": dist,
            "reasons": reasons,
        })
    results.sort(key=lambda r: r["distanceKm"])
    return results


def match_ngos_for_donation(donation):
    """Recommended NGOs for a specific donation (pending or any status)."""
    if not _valid_coord(donation.pickup_latitude, donation.pickup_longitude):
        raise WorkflowError("Donation has no valid pickup coordinates.")
    return nearby_ngos(
        donation.pickup_latitude, donation.pickup_longitude,
        radius_km=100.0, category=donation.category, quantity=donation.quantity,
    )