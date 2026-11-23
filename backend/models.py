"""SQLAlchemy models mirroring the frontend data architecture.

Relationships:
  User (role: donor|ngo|volunteer|admin)
    ├─ Donation.donor_id        (donor owns donations)
    ├─ Donation.accepted_by     (NGO accepts)
    ├─ Donation.volunteer_id    (volunteer collects)
    └─ CollectionTask.volunteer_id
  Donation 1──1 CollectionTask
  Notification.user_id
"""
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db


def utcnow():
    return datetime.now(timezone.utc)


def gen_id(prefix):
    import uuid
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(40), primary_key=True, default=lambda: gen_id("usr"))
    role = db.Column(db.String(20), nullable=False, index=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(160), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(30), default="")
    address = db.Column(db.String(300), default="")
    active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    # Donor fields
    org_name = db.Column(db.String(160), default="")
    donor_type = db.Column(db.String(30), default="")
    # NGO fields
    registration_number = db.Column(db.String(60), default="")
    verified = db.Column(db.Boolean, default=False)
    # Volunteer fields
    area = db.Column(db.String(120), default="")
    vehicle = db.Column(db.String(120), default="")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "role": self.role,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "active": self.active,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "orgName": self.org_name,
            "donorType": self.donor_type,
            "registrationNumber": self.registration_number,
            "verified": self.verified,
            "area": self.area,
            "vehicle": self.vehicle,
        }


class Donation(db.Model):
    __tablename__ = "donations"

    id = db.Column(db.String(40), primary_key=True, default=lambda: gen_id("don"))
    donor_id = db.Column(db.String(40), db.ForeignKey("users.id"), nullable=False, index=True)
    food_name = db.Column(db.String(160), nullable=False)
    category = db.Column(db.String(40), nullable=False)
    diet = db.Column(db.String(10), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    prepared_at = db.Column(db.DateTime, nullable=False)
    available_until = db.Column(db.DateTime, nullable=False)
    storage = db.Column(db.String(20), nullable=False)
    pickup_address = db.Column(db.String(300), nullable=False)
    instructions = db.Column(db.Text, default="")
    image_url = db.Column(db.Text, default="")
    safety_declared = db.Column(db.Boolean, default=False)

    status = db.Column(db.String(30), default="pending", nullable=False, index=True)
    accepted_by = db.Column(db.String(40), db.ForeignKey("users.id"), nullable=True)
    volunteer_id = db.Column(db.String(40), db.ForeignKey("users.id"), nullable=True)
    task_id = db.Column(db.String(40), nullable=True)
    rejected_by = db.Column(db.JSON, default=list)  # list of NGO ids that declined

    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    timeline = db.relationship(
        "DonationEvent", backref="donation", cascade="all, delete-orphan",
        order_by="DonationEvent.at",
    )
    task = db.relationship("CollectionTask", backref="donation", uselist=False,
                           foreign_keys="CollectionTask.donation_id")

    def to_dict(self):
        return {
            "id": self.id,
            "donorId": self.donor_id,
            "foodName": self.food_name,
            "category": self.category,
            "diet": self.diet,
            "quantity": self.quantity,
            "unit": self.unit,
            "preparedAt": self.prepared_at.isoformat() if self.prepared_at else None,
            "availableUntil": self.available_until.isoformat() if self.available_until else None,
            "storage": self.storage,
            "pickupAddress": self.pickup_address,
            "instructions": self.instructions,
            "imageUrl": self.image_url,
            "safetyDeclared": self.safety_declared,
            "status": self.status,
            "acceptedBy": self.accepted_by,
            "volunteerId": self.volunteer_id,
            "taskId": self.task_id,
            "rejectedBy": self.rejected_by or [],
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "timeline": [e.to_dict() for e in self.timeline],
        }


class DonationEvent(db.Model):
    __tablename__ = "donation_events"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    donation_id = db.Column(db.String(40), db.ForeignKey("donations.id"), nullable=False, index=True)
    status = db.Column(db.String(30), nullable=False)
    at = db.Column(db.DateTime, default=utcnow)
    by = db.Column(db.String(40), nullable=True)
    note = db.Column(db.String(300), default="")

    def to_dict(self):
        return {
            "status": self.status,
            "at": self.at.isoformat() if self.at else None,
            "by": self.by,
            "note": self.note,
        }


class CollectionTask(db.Model):
    __tablename__ = "collection_tasks"

    id = db.Column(db.String(40), primary_key=True, default=lambda: gen_id("task"))
    donation_id = db.Column(db.String(40), db.ForeignKey("donations.id"), nullable=False, index=True)
    status = db.Column(db.String(30), default="open", nullable=False, index=True)
    volunteer_id = db.Column(db.String(40), db.ForeignKey("users.id"), nullable=True)
    pickup_address = db.Column(db.String(300), default="")
    delivery_address = db.Column(db.String(300), default="")
    created_at = db.Column(db.DateTime, default=utcnow)
    updated_at = db.Column(db.DateTime, default=utcnow, onupdate=utcnow)

    events = db.relationship("TaskEvent", backref="task", cascade="all, delete-orphan",
                             order_by="TaskEvent.at")

    def to_dict(self):
        return {
            "id": self.id,
            "donationId": self.donation_id,
            "status": self.status,
            "volunteerId": self.volunteer_id,
            "pickupAddress": self.pickup_address,
            "deliveryAddress": self.delivery_address,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "timeline": [e.to_dict() for e in self.events],
        }


class TaskEvent(db.Model):
    __tablename__ = "task_events"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    task_id = db.Column(db.String(40), db.ForeignKey("collection_tasks.id"), nullable=False, index=True)
    status = db.Column(db.String(30), nullable=False)
    at = db.Column(db.DateTime, default=utcnow)
    by = db.Column(db.String(40), nullable=True)
    note = db.Column(db.String(300), default="")

    def to_dict(self):
        return {"status": self.status, "at": self.at.isoformat() if self.at else None,
                "by": self.by, "note": self.note}


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.String(40), primary_key=True, default=lambda: gen_id("ntf"))
    user_id = db.Column(db.String(40), db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(160), nullable=False)
    body = db.Column(db.String(400), default="")
    donation_id = db.Column(db.String(40), nullable=True)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "userId": self.user_id,
            "title": self.title,
            "body": self.body,
            "donationId": self.donation_id,
            "read": self.read,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }