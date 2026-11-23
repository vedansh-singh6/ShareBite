"""Notification endpoints for the authenticated user."""
from flask import Blueprint, jsonify, g
from extensions import db
from models import Notification
from auth import auth_required

bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@bp.get("")
@auth_required
def list_notifications():
    rows = (
        Notification.query.filter_by(user_id=g.user.id)
        .order_by(Notification.created_at.desc())
        .limit(50)
        .all()
    )
    return jsonify([n.to_dict() for n in rows])


@bp.post("/<notification_id>/read")
@auth_required
def mark_read(notification_id):
    n = Notification.query.filter_by(id=notification_id, user_id=g.user.id).first()
    if n:
        n.read = True
        db.session.commit()
    return jsonify({"ok": True})


@bp.post("/read-all")
@auth_required
def mark_all_read():
    Notification.query.filter_by(user_id=g.user.id, read=False).update({"read": True})
    db.session.commit()
    return jsonify({"ok": True})