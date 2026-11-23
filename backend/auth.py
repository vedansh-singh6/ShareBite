"""JWT auth helpers + role guards for the Flask API."""
from datetime import datetime, timedelta, timezone
from functools import wraps
import jwt
from flask import request, jsonify, current_app, g
from models import User


def make_token(user):
    payload = {
        "sub": user.id,
        "role": user.role,
        "exp": datetime.now(timezone.utc)
        + timedelta(hours=current_app.config["JWT_EXPIRY_HOURS"]),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")


def decode_token(token):
    return jwt.decode(token, current_app.config["JWT_SECRET"], algorithms=["HS256"])


def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify({"error": "Authentication required."}), 401
        try:
            payload = decode_token(header[7:])
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Session expired. Please log in again."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token."}), 401
        user = User.query.get(payload["sub"])
        if not user or not user.active:
            return jsonify({"error": "Account not found or deactivated."}), 401
        g.user = user
        return fn(*args, **kwargs)
    return wrapper


def role_required(*roles):
    def decorator(fn):
        @wraps(fn)
        @auth_required
        def wrapper(*args, **kwargs):
            if g.user.role not in roles:
                return jsonify({"error": "You do not have permission for this action."}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator