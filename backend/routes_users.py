"""User management + NGO verification (admin) and profile updates."""
from flask import Blueprint, request, jsonify, g
from extensions import db
from models import User
from auth import auth_required, role_required
import services as svc

bp = Blueprint("users", __name__, url_prefix="/api/users")


@bp.get("")
@role_required("admin")
def list_users():
    rows = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in rows])


@bp.get("/<user_id>")
@auth_required
def get_user(user_id):
    u = User.query.get(user_id)
    if not u:
        return jsonify({"error": "User not found."}), 404
    return jsonify(u.to_dict())


@bp.patch("/me")
@auth_required
def update_me():
    data = request.get_json(silent=True) or {}
    allowed = {"name", "phone", "address", "orgName", "area", "vehicle", "donorType",
               "latitude", "longitude", "serviceRadiusKm", "acceptedCategories",
               "minQuantity", "maxQuantity"}
    mapping = {"orgName": "org_name", "donorType": "donor_type",
               "serviceRadiusKm": "service_radius_km",
               "acceptedCategories": "accepted_categories",
               "minQuantity": "min_quantity", "maxQuantity": "max_quantity"}
    for key, value in data.items():
        if key in allowed:
            setattr(g.user, mapping.get(key, key), value)
    db.session.commit()
    return jsonify({"user": g.user.to_dict()})


@bp.post("/<user_id>/verify")
@role_required("admin")
def verify(user_id):
    ngo = User.query.filter_by(id=user_id, role="ngo").first()
    if not ngo:
        return jsonify({"error": "NGO not found."}), 404
    verified = bool((request.get_json(silent=True) or {}).get("verified", True))
    ngo.verified = verified
    svc.notify(
        ngo.id,
        "NGO verified" if verified else "Verification revoked",
        "Your organisation is verified. You can now accept donations."
        if verified else "Your verification was revoked by the admin.",
    )
    db.session.commit()
    return jsonify(ngo.to_dict())


@bp.post("/<user_id>/active")
@role_required("admin")
def set_active(user_id):
    u = User.query.get(user_id)
    if not u:
        return jsonify({"error": "User not found."}), 404
    if u.role == "admin":
        return jsonify({"error": "Admin accounts cannot be deactivated."}), 400
    u.active = bool((request.get_json(silent=True) or {}).get("active", True))
    db.session.commit()
    return jsonify(u.to_dict())