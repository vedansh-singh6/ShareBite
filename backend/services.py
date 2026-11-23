"""Business logic for the donation workflow — mirrors the frontend service layer.

Status pipeline:
  pending → accepted → volunteer_assigned → picked_up → delivered → completed
plus rejected (per-NGO decline) and cancelled (donor withdrawal).
"""
from datetime import datetime, timezone
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
    notify(_ngo_ids(), "New donation available",
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

    task = CollectionTask(
        donation_id=donation.id, status="open",
        pickup_address=donation.pickup_address, delivery_address=ngo.address,
    )
    db.session.add(task)
    db.session.flush()
    donation.task_id = task.id
    db.session.add(TaskEvent(task_id=task.id, status="open", by=ngo.id,
                             note="Task created when NGO accepted"))

    notify(donation.donor_id, "Donation accepted",
           f"{ngo.org_name} accepted \"{donation.food_name}\".", donation.id)
    notify(_volunteer_ids(), "New collection task nearby",
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
    task = CollectionTask.query.get(task_id)
    if not task:
        raise WorkflowError("Collection task not found.")
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
           f"{volunteer.name} will collect \"{donation.food_name}\".", donation.id)
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
           f"\"{donation.food_name}\" was delivered. Please confirm receipt.", donation.id)
    notify(donation.donor_id, "Your donation was delivered",
           f"\"{donation.food_name}\" reached {ngo_name}.", donation.id)
    db.session.commit()
    return task