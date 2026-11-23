"""Collection task endpoints mirroring the frontend taskService."""
from flask import Blueprint, jsonify, g
from models import CollectionTask
from auth import auth_required, role_required
import services as svc

bp = Blueprint("tasks", __name__, url_prefix="/api/tasks")


def _err(e):
    return jsonify({"error": str(e)}), 400


@bp.get("")
@auth_required
def list_tasks():
    q = CollectionTask.query
    if g.user.role == "volunteer":
        scope = request_scope()
        if scope == "mine":
            q = q.filter_by(volunteer_id=g.user.id)
        elif scope == "open":
            q = q.filter_by(status="open")
    rows = q.order_by(CollectionTask.created_at.desc()).all()
    return jsonify([t.to_dict() for t in rows])


def request_scope():
    from flask import request
    return request.args.get("scope")


@bp.post("/<task_id>/accept")
@role_required("volunteer")
def accept(task_id):
    try:
        return jsonify(svc.accept_task(task_id, g.user).to_dict())
    except svc.WorkflowError as e:
        return _err(e)


@bp.post("/<task_id>/pickup")
@role_required("volunteer")
def pickup(task_id):
    try:
        return jsonify(svc.confirm_pickup(task_id, g.user).to_dict())
    except svc.WorkflowError as e:
        return _err(e)


@bp.post("/<task_id>/deliver")
@role_required("volunteer")
def deliver(task_id):
    try:
        return jsonify(svc.confirm_delivery(task_id, g.user).to_dict())
    except svc.WorkflowError as e:
        return _err(e)