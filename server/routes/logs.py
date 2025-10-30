from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from ..models import AuditLog
from ..schemas import AuditLogSchema

bp = Blueprint("logs", __name__, url_prefix="/api/logs")

log_schema = AuditLogSchema()


@bp.get("")
@jwt_required()
def list_logs():
    user = request.user  # type: ignore[attr-defined]
    if not user or not any(role.role_name == "admin" for role in user.roles):
        return jsonify({"message": "Forbidden"}), 403
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(500).all()
    return jsonify(log_schema.dump(logs, many=True))
