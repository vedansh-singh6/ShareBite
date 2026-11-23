"""NGO discovery + location-based matching endpoints (Phase 2 Module 1)."""
from flask import Blueprint, request, jsonify, g
from models import User, Donation
from auth import auth_required, role_required
import services as svc

bp = Blueprint("ngos", __name__, url_prefix="/api/ngos")


def _err(e):
    return jsonify({"error": str(e)}), 400


@bp.get("/nearby")
@auth_required
def nearby():
    try:
        lat = request.args.get("lat", type=float)
        lon = request.args.get("lon", type=float)
        radius = request.args.get("radius", default=25.0, type=float)
        category = request.args.get("category")
        quantity = request.args.get("quantity", default=0.0, type=float)
        if lat is None or lon is None:
            return jsonify({"error": "lat and lon query params are required."}), 400
        results = svc.nearby_ngos(lat, lon, radius, category, quantity)
        return jsonify(results)
    except svc.WorkflowError as e:
        return _err(e)
    except (TypeError, ValueError) as e:
        return jsonify({"error": f"Invalid query params: {e}"}), 400


@bp.get("/<ngo_id>")
@auth_required
def get_ngo(ngo_id):
    ngo = User.query.filter_by(id=ngo_id, role="ngo").first()
    if not ngo:
        return jsonify({"error": "NGO not found."}), 404
    # Do not expose precise coordinates to non-admin/non-self users.
    data = ngo.to_dict()
    if g.user.role != "admin" and g.user.id != ngo.id:
        data.pop("latitude", None)
        data.pop("longitude", None)
    return jsonify(data)