"""Auth endpoints: /api/auth/register, /login, /me."""
from flask import Blueprint, request, jsonify, g
from extensions import db
from models import User
from auth import make_token, auth_required

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    required = ["name", "email", "password", "role"]
    if any(not data.get(k) for k in required):
        return jsonify({"error": "name, email, password and role are required."}), 400
    if data["role"] not in ("donor", "ngo", "volunteer"):
        return jsonify({"error": "Role must be donor, ngo or volunteer."}), 400
    if len(data["password"]) < 8:
        return jsonify({"error": "Password must be at least 8 characters."}), 400
    if User.query.filter(db.func.lower(User.email) == data["email"].lower()).first():
        return jsonify({"error": "An account with this email already exists."}), 409

    user = User(
        role=data["role"],
        name=data["name"].strip(),
        email=data["email"].strip().lower(),
        phone=data.get("phone", ""),
        address=data.get("address", ""),
        org_name=data.get("orgName", ""),
        donor_type=data.get("donorType", ""),
        registration_number=data.get("registrationNumber", ""),
        area=data.get("area", ""),
        vehicle=data.get("vehicle", ""),
        verified=False,
    )
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return jsonify({"token": make_token(user), "user": user.to_dict()}), 201


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    user = User.query.filter(db.func.lower(User.email) == (data.get("email") or "").lower()).first()
    if not user or not user.check_password(data.get("password", "")):
        return jsonify({"error": "Invalid email or password."}), 401
    if not user.active:
        return jsonify({"error": "This account has been deactivated."}), 403
    return jsonify({"token": make_token(user), "user": user.to_dict()})


@bp.get("/me")
@auth_required
def me():
    return jsonify({"user": g.user.to_dict()})