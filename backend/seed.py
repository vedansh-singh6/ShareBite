"""Idempotent seed script for ShareBite demo accounts and realistic data.

Usage: python seed.py
Demo accounts:
  Admin      admin@sharebite.demo      Admin@123
  Donor      donor@sharebite.demo      Donor@123
  NGO        ngo@sharebite.demo        Ngo@123
  Volunteer  volunteer@sharebite.demo  Volunteer@123

Safe to run repeatedly: existing users/records are not overwritten or duplicated.
"""
from datetime import datetime, timedelta, timezone
from app import create_app
from extensions import db
from models import User, Donation, DonationEvent, CollectionTask, TaskEvent, Notification

app = create_app()
NOW = datetime.now(timezone.utc)


def hours_ago(h):
    return NOW - timedelta(hours=h)


def hours_ahead(h):
    return NOW + timedelta(hours=h)


def get_or_create_user(uid, role, name, email, password, update_password=False, **kw):
    existing = User.query.filter_by(email=email).first()
    if existing:
        # For demo accounts, keep credentials in sync with the seed definition.
        if update_password:
            existing.set_password(password)
            existing.name = name
            for k, v in kw.items():
                if hasattr(existing, k):
                    setattr(existing, k, v)
        return existing, False
    u = User(id=uid, role=role, name=name, email=email, **kw)
    u.set_password(password)
    db.session.add(u)
    db.session.flush()
    return u, True


def run():
    with app.app_context():
        db.create_all()

        # ---- Demo users (idempotent) ---------------------------------------
        admin, _ = get_or_create_user(
            "usr_admin", "admin", "ShareBite Admin", "admin@sharebite.demo", "Admin@123",
            update_password=True, phone="+91 98000 00001",
        )
        donor, _ = get_or_create_user(
            "usr_donor", "donor", "Rahul Sharma", "donor@sharebite.demo", "Donor@123",
            update_password=True, org_name="Rahul's Kitchen", donor_type="restaurant",
            address="12 MG Road, Indiranagar, Bengaluru 560038", phone="+91 98000 00002",
            latitude=12.9784, longitude=77.6408,
        )
        ngo, _ = get_or_create_user(
            "usr_ngo", "ngo", "Helping Hands NGO", "ngo@sharebite.demo", "Ngo@123",
            update_password=True, org_name="Helping Hands NGO", verified=True, registration_number="KA/NGO/2024/00001",
            address="22 Service Road, Koramangala, Bengaluru 560034", phone="+91 98000 00004",
            latitude=12.9352, longitude=77.6245, service_radius_km=25.0,
            accepted_categories=[], min_quantity=0.0, max_quantity=0.0,
        )
        volunteer, _ = get_or_create_user(
            "usr_volunteer", "volunteer", "Arjun Kumar", "volunteer@sharebite.demo", "Volunteer@123",
            update_password=True, area="Indiranagar / Koramangala", vehicle="Two-wheeler with insulated bag",
            phone="+91 98000 00007", latitude=12.9500, longitude=77.6300,
        )
        db.session.flush()

        # ---- Helper to create a donation if not exists ----------------------
        def ensure_donation(did, **kw):
            existing = Donation.query.get(did)
            if existing:
                return existing, False
            d = Donation(id=did, **kw)
            db.session.add(d)
            db.session.flush()
            db.session.add(DonationEvent(donation_id=did, status=kw["status"],
                                         at=kw.get("created_at", hours_ago(1)), by=kw["donor_id"],
                                         note="Donation registered"))
            return d, True

        # 1. Available (pending)
        d1, _ = ensure_donation(
            "don_demo_1", donor_id=donor.id, food_name="Veg Biryani & Raita",
            category="cooked_meals", diet="veg", quantity=40, unit="meals",
            prepared_at=hours_ago(2), available_until=hours_ahead(4), storage="hot",
            pickup_address=donor.address, pickup_latitude=donor.latitude, pickup_longitude=donor.longitude,
            instructions="Packed in insulated containers.", image_url="", safety_declared=True,
            status="pending", rejected_by=[], created_at=hours_ago(1.5), updated_at=hours_ago(1.5),
        )

        # 2. Accepted by NGO
        d2, _ = ensure_donation(
            "don_demo_2", donor_id=donor.id, food_name="Fresh Fruit Boxes",
            category="fruits_vegetables", diet="veg", quantity=15, unit="kg",
            prepared_at=hours_ago(5), available_until=hours_ahead(12), storage="room_temp",
            pickup_address=donor.address, pickup_latitude=donor.latitude, pickup_longitude=donor.longitude,
            instructions="Crates near office.", image_url="", safety_declared=True,
            status="accepted", accepted_by=ngo.id, rejected_by=[],
            created_at=hours_ago(5), updated_at=hours_ago(4),
        )
        if d2.task_id is None:
            t = CollectionTask(id="task_demo_2", donation_id=d2.id, status="open",
                               declined_by=[], distance_km=0.0,
                               pickup_address=d2.pickup_address, delivery_address=ngo.address,
                               created_at=hours_ago(4))
            db.session.add(t)
            db.session.flush()
            d2.task_id = t.id
            db.session.add(DonationEvent(donation_id=d2.id, status="accepted", at=hours_ago(4),
                                         by=ngo.id, note="Accepted by Helping Hands NGO"))
            db.session.add(TaskEvent(task_id=t.id, status="open", at=hours_ago(4), by=ngo.id,
                                     note="Task created when NGO accepted"))

        # 3. Volunteer assigned
        d3, _ = ensure_donation(
            "don_demo_3", donor_id=donor.id, food_name="Bread & Bakery Items",
            category="bakery", diet="veg", quantity=8, unit="kg",
            prepared_at=hours_ago(6), available_until=hours_ahead(10), storage="room_temp",
            pickup_address=donor.address, pickup_latitude=donor.latitude, pickup_longitude=donor.longitude,
            instructions="Sealed packs.", image_url="", safety_declared=True,
            status="volunteer_assigned", accepted_by=ngo.id, volunteer_id=volunteer.id,
            rejected_by=[], created_at=hours_ago(6), updated_at=hours_ago(2),
        )
        if d3.task_id is None:
            t = CollectionTask(id="task_demo_3", donation_id=d3.id, status="assigned",
                               volunteer_id=volunteer.id, declined_by=[], distance_km=0.0,
                               pickup_address=d3.pickup_address, delivery_address=ngo.address,
                               created_at=hours_ago(5), updated_at=hours_ago(2))
            db.session.add(t)
            db.session.flush()
            d3.task_id = t.id
            for st, off, by in [("accepted", 5.5, ngo.id), ("volunteer_assigned", 2, volunteer.id)]:
                db.session.add(DonationEvent(donation_id=d3.id, status=st, at=hours_ago(off), by=by, note=st))
            db.session.add(TaskEvent(task_id=t.id, status="open", at=hours_ago(5), by=ngo.id, note="Task created"))
            db.session.add(TaskEvent(task_id=t.id, status="assigned", at=hours_ago(2), by=volunteer.id, note="Volunteer accepted"))

        # 4. Picked up
        d4, _ = ensure_donation(
            "don_demo_4", donor_id=donor.id, food_name="Rice & Dal (Hostel Surplus)",
            category="cooked_meals", diet="veg", quantity=60, unit="meals",
            prepared_at=hours_ago(3), available_until=hours_ahead(3), storage="hot",
            pickup_address=donor.address, pickup_latitude=donor.latitude, pickup_longitude=donor.longitude,
            instructions="Collect from mess back entrance.", image_url="", safety_declared=True,
            status="picked_up", accepted_by=ngo.id, volunteer_id=volunteer.id,
            rejected_by=[], created_at=hours_ago(3), updated_at=hours_ago(0.5),
        )
        if d4.task_id is None:
            t = CollectionTask(id="task_demo_4", donation_id=d4.id, status="picked_up",
                               volunteer_id=volunteer.id, declined_by=[], distance_km=0.0,
                               pickup_address=d4.pickup_address, delivery_address=ngo.address,
                               created_at=hours_ago(2.5), updated_at=hours_ago(0.5))
            db.session.add(t)
            db.session.flush()
            d4.task_id = t.id
            for st, off, by in [("accepted", 2.8, ngo.id), ("volunteer_assigned", 2.5, volunteer.id),
                                ("picked_up", 0.5, volunteer.id)]:
                db.session.add(DonationEvent(donation_id=d4.id, status=st, at=hours_ago(off), by=by, note=st))
            db.session.add(TaskEvent(task_id=t.id, status="open", at=hours_ago(2.8), by=ngo.id, note="Task created"))
            db.session.add(TaskEvent(task_id=t.id, status="assigned", at=hours_ago(2.5), by=volunteer.id, note="Volunteer accepted"))
            db.session.add(TaskEvent(task_id=t.id, status="picked_up", at=hours_ago(0.5), by=volunteer.id, note="Pickup confirmed"))

        # 5. Completed
        d5, _ = ensure_donation(
            "don_demo_5", donor_id=donor.id, food_name="Packaged Snacks & Biscuits",
            category="packaged", diet="veg", quantity=25, unit="packs",
            prepared_at=hours_ago(24), available_until=hours_ago(20), storage="room_temp",
            pickup_address=donor.address, pickup_latitude=donor.latitude, pickup_longitude=donor.longitude,
            instructions="Sealed boxes.", image_url="", safety_declared=True,
            status="completed", accepted_by=ngo.id, volunteer_id=volunteer.id,
            rejected_by=[], created_at=hours_ago(24), updated_at=hours_ago(22),
        )
        if d5.task_id is None:
            t = CollectionTask(id="task_demo_5", donation_id=d5.id, status="completed",
                               volunteer_id=volunteer.id, declined_by=[], distance_km=0.0,
                               pickup_address=d5.pickup_address, delivery_address=ngo.address,
                               created_at=hours_ago(23), updated_at=hours_ago(22))
            db.session.add(t)
            db.session.flush()
            d5.task_id = t.id
            for st, off, by in [("accepted", 23.5, ngo.id), ("volunteer_assigned", 23, volunteer.id),
                                ("picked_up", 22.5, volunteer.id), ("delivered", 22.2, volunteer.id),
                                ("completed", 22, ngo.id)]:
                db.session.add(DonationEvent(donation_id=d5.id, status=st, at=hours_ago(off), by=by, note=st))
            db.session.add(TaskEvent(task_id=t.id, status="completed", at=hours_ago(22), by=ngo.id, note="NGO confirmed receipt"))

        # 6. Expired (pending, past deadline)
        d6, _ = ensure_donation(
            "don_demo_6", donor_id=donor.id, food_name="Milk Packets (Expired)",
            category="dairy", diet="veg", quantity=10, unit="litres",
            prepared_at=hours_ago(12), available_until=hours_ago(8), storage="refrigerated",
            pickup_address=donor.address, pickup_latitude=donor.latitude, pickup_longitude=donor.longitude,
            instructions="Keep chilled.", image_url="", safety_declared=True,
            status="pending", rejected_by=[], created_at=hours_ago(12), updated_at=hours_ago(12),
        )

        db.session.commit()
        print("Database seeded. Demo login password: see credentials.")


if __name__ == "__main__":
    run()