"""Donation endpoints mirroring the frontend donationService."""
from flask import Blueprint, request, jsonify, g
from models import Donation
from auth import auth_required, role_required
import services as svc

bp = Blueprint("donations", __name__, url_prefix="/api/donations")


def _err(e):
    return jsonify({"error": str(e)}), 400


@bp.get("")
@auth_required
def list_donations():
    q = Donation.query
    role = g.user.role
    if role == "donor":
        q = q.filter_by(donor_id=g.user.id)
    elif role == "ngo":
        scope = request.args.get("scope")
        if scope == "accepted":
            q = q.filter_by(accepted_by=g.user.id)
        elif scope == "available":
            from datetime import datetime, timezone
            q = q.filter_by(status="pending").filter(
                Donation.available_until > datetime.now(timezone.utc)
            )
    rows = q.order_by(Donation.created_at.desc()).all()
    result = [d.to_dict() for d in rows]
    if role == "ngo" and request.args.get("scope") == "available":
        result = [d for d in result if g.user.id not in (d["rejectedBy"] or [])]
    return jsonify(result)


@bp.get("/<donation_id>")
@auth_required
def get_donation(donation_id):
    d = Donation.query.get(donation_id)
    if not d:
        return jsonify({"error": "Donation not found."}), 404
    return jsonify(d.to_dict())


@bp.post("")
@role_required("donor")
def create():
    try:
        d = svc.create_donation(request.get_json(silent=True) or {}, g.user)
        return jsonify(d.to_dict()), 201
    except svc.WorkflowError as e:
        return _err(e)
    except (KeyError, ValueError) as e:
        return jsonify({"error": f"Invalid donation payload: {e}"}), 400


@bp.post("/<donation_id>/accept")
@role_required("ngo")
def accept(donation_id):
    try:
        return jsonify(svc.accept_donation(donation_id, g.user).to_dict())
    except svc.WorkflowError as e:
        return _err(e)


@bp.post("/<donation_id>/reject")
@role_required("ngo")
def reject(donation_id):
    try:
        return jsonify(svc.reject_donation(donation_id, g.user).to_dict())
    except svc.WorkflowError as e:
        return _err(e)


@bp.post("/<donation_id>/cancel")
@role_required("donor")
def cancel(donation_id):
    try:
        return jsonify(svc.cancel_donation(donation_id, g.user).to_dict())
    except svc.WorkflowError as e:
        return _err(e)


@bp.post("/<donation_id>/confirm-receipt")
@role_required("ngo")
def confirm_receipt(donation_id):
    try:
        return jsonify(svc.confirm_receipt(donation_id, g.user).to_dict())
    except svc.WorkflowError as e:
        return _err(e)


@bp.get("/<donation_id>/matches")
@auth_required
def matches(donation_id):
    donation = Donation.query.get(donation_id)
    if not donation:
        return jsonify({"error": "Donation not found."}), 404
    # Only donor owner, NGOs, or admin can view matches
    if g.user.role == "donor" and donation.donor_id != g.user.id:
        return jsonify({"error": "You do not have permission."}), 403
    try:
        return jsonify(svc.match_ngos_for_donation(donation))
    except svc.WorkflowError as e:
        return _err(e)