"""Create tables and seed demo data (mirrors the frontend seed).

Usage:  python seed.py
All demo accounts use password: demo1234
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


def run():
    with app.app_context():
        db.drop_all()
        db.create_all()

        def user(uid, role, name, email, **kw):
            u = User(id=uid, role=role, name=name, email=email, **kw)
            u.set_password("demo1234")
            db.session.add(u)
            return u

        user("usr_admin", "admin", "Platform Admin", "admin@sharebite.demo", phone="+91 98000 00001")
        user("usr_donor1", "donor", "Rohit Sharma", "donor@sharebite.demo",
             org_name="Spice Garden Restaurant", donor_type="restaurant",
             address="12 MG Road, Indiranagar, Bengaluru 560038", phone="+91 98000 00002")
        user("usr_donor2", "donor", "Meera Iyer", "hostel@sharebite.demo",
             org_name="Green Valley Hostel", donor_type="hostel",
             address="4th Cross, Yelahanka New Town, Bengaluru 560064", phone="+91 98000 00003")
        user("usr_ngo1", "ngo", "Kavita Rao", "ngo@sharebite.demo",
             org_name="Annapurna Foundation", verified=True, registration_number="KA/NGO/2019/04412",
             address="22 Service Road, Koramangala, Bengaluru 560034", phone="+91 98000 00004")
        user("usr_ngo2", "ngo", "Suresh Patil", "hands@sharebite.demo",
             org_name="Helping Hands Trust", verified=True, registration_number="KA/NGO/2021/01187",
             address="8 Lake View Layout, Hebbal, Bengaluru 560024", phone="+91 98000 00005")
        user("usr_ngo3", "ngo", "Divya Menon", "care@sharebite.demo",
             org_name="Care Collective", verified=False, registration_number="KA/NGO/2024/00932",
             address="31 Church Street, Shivajinagar, Bengaluru 560051", phone="+91 98000 00006")
        user("usr_vol1", "volunteer", "Arjun Mehta", "volunteer@sharebite.demo",
             area="Indiranagar / Koramangala", vehicle="Two-wheeler with insulated bag", phone="+91 98000 00007")
        user("usr_vol2", "volunteer", "Priya Nair", "priya@sharebite.demo",
             area="Yelahanka / Hebbal", vehicle="Car", phone="+91 98000 00008")
        db.session.flush()

        img = lambda i: f"https://images.unsplash.com/photo-{i}?w=800&q=80&auto=format&fit=crop"
        imgs = [
            "1546069901-ba9599a7e63c", "1504674900247-0877df9cc836", "1512621776951-a57141f2eefd",
            "1567620905732-2d1ec7ab7445", "1490645935967-10de6ba17061", "1498837167922-ddd27525d352",
            "1476224203421-9ac39bcb3327", "1484723091739-30a097e8f929",
        ]

        def donation(did, donor, name, cat, qty, unit, status, created_h, img_i,
                     ngo=None, vol=None, storage="hot", diet="veg"):
            d = Donation(
                id=did, donor_id=donor, food_name=name, category=cat, diet=diet,
                quantity=qty, unit=unit, prepared_at=hours_ago(created_h + 1),
                available_until=hours_ahead(4) if status == "pending" else hours_ago(created_h - 3),
                storage=storage, pickup_address=User.query.get(donor).address,
                image_url=img(imgs[img_i]), safety_declared=True, status=status,
                accepted_by=ngo, volunteer_id=vol, rejected_by=[],
                created_at=hours_ago(created_h), updated_at=hours_ago(max(created_h - 2, 0)),
            )
            db.session.add(d)
            db.session.flush()
            db.session.add(DonationEvent(donation_id=did, status="pending",
                                         at=hours_ago(created_h), by=donor, note="Donation registered"))
            return d

        # Pending
        donation("don_1001", "usr_donor1", "Veg Biryani & Raita", "cooked_meals", 45, "meals", "pending", 1.5, 0)
        donation("don_1002", "usr_donor2", "Chapati, Dal & Sabzi", "cooked_meals", 60, "meals", "pending", 1, 2)
        donation("don_1003", "usr_donor1", "Assorted Bread & Bakery", "bakery", 8, "kg", "pending", 3, 7, storage="room_temp")

        # Accepted (task open)
        d = donation("don_1004", "usr_donor2", "Fresh Fruit Boxes", "fruits_vegetables", 12, "kg", "accepted", 5, 5, ngo="usr_ngo2", storage="room_temp")
        db.session.add(DonationEvent(donation_id=d.id, status="accepted", at=hours_ago(4), by="usr_ngo2", note="Accepted"))
        t = CollectionTask(id="task_2004", donation_id=d.id, status="open",
                           pickup_address=d.pickup_address, delivery_address=User.query.get("usr_ngo2").address,
                           created_at=hours_ago(4))
        db.session.add(t); db.session.flush(); d.task_id = t.id
        db.session.add(TaskEvent(task_id=t.id, status="open", at=hours_ago(4), by="usr_ngo2", note="Task created"))

        # Completed history
        history = [
            ("don_1008", "usr_donor1", "usr_ngo1", "usr_vol1", "South Indian Breakfast", 80, 24),
            ("don_1009", "usr_donor2", "usr_ngo2", "usr_vol2", "Rajma Chawal", 55, 48),
            ("don_1010", "usr_donor1", "usr_ngo1", "usr_vol1", "Sandwiches & Wraps", 40, 96),
            ("don_1011", "usr_donor2", "usr_ngo1", "usr_vol2", "Rice, Sambar & Poriyal", 70, 144),
        ]
        for i, (did, donor, ngo, vol, name, qty, h) in enumerate(history):
            d = donation(did, donor, name, "cooked_meals", qty, "meals", "completed", h + 2, i % 8, ngo=ngo, vol=vol)
            tid = f"task_{3000 + i}"
            d.task_id = tid
            for st, off, by in [("accepted", h + 1.5, ngo), ("volunteer_assigned", h + 1, vol),
                                ("picked_up", h, vol), ("delivered", h - 1, vol), ("completed", h - 2, ngo)]:
                db.session.add(DonationEvent(donation_id=did, status=st, at=hours_ago(off), by=by, note=st))
            t = CollectionTask(id=tid, donation_id=did, status="completed", volunteer_id=vol,
                               pickup_address=d.pickup_address, delivery_address=User.query.get(ngo).address,
                               created_at=hours_ago(h + 1.5), updated_at=hours_ago(h - 2))
            db.session.add(t)

        db.session.add(Notification(user_id="usr_ngo1", title="New donation available",
                                    body="Spice Garden Restaurant listed 45 meals of Veg Biryani & Raita.",
                                    donation_id="don_1001", created_at=hours_ago(1.5)))
        db.session.commit()
        print("✅ Database seeded. Demo login password: demo1234")


if __name__ == "__main__":
    run()