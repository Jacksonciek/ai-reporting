from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..config import load_config
from ..extensions import db
from ..models import Document, ModuleName
from ..schemas import DocumentSchema
from ..services.documents import DocumentService, SUPPORTED_MIME
from ..utils.permissions import require_permission
from ..utils.uuid import uuid_to_bytes

bp = Blueprint("documents", __name__, url_prefix="/api/documents")

document_schema = DocumentSchema()


def _get_service() -> DocumentService:
    return DocumentService(load_config())


@bp.post("")
@jwt_required()
def upload_document():
    user = request.user  # type: ignore[attr-defined]
    require_permission(user, ModuleName.documents, "create")

    if "file" not in request.files:
        return jsonify({"message": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "Empty filename"}), 400
    if file.mimetype not in SUPPORTED_MIME and not any(file.filename.lower().endswith(ext) for ext in [".csv", ".xls", ".xlsx", ".pdf"]):
        return jsonify({"message": "Unsupported file type"}), 400

    service = _get_service()
    document = service.upload(file, get_jwt_identity())

    return jsonify(document_schema.dump(document)), 201


@bp.get("")
@jwt_required()
def list_documents():
    documents = Document.query.order_by(Document.uploaded_at.desc()).all()
    return jsonify(document_schema.dump(documents, many=True))


@bp.get("/<doc_id>")
@jwt_required()
def get_document(doc_id: str):
    document = Document.query.get(uuid_to_bytes(doc_id))
    if not document:
        return jsonify({"message": "Document not found"}), 404
    return jsonify(document_schema.dump(document))


@bp.patch("/<doc_id>")
@jwt_required()
def update_document(doc_id: str):
    user = request.user  # type: ignore[attr-defined]
    require_permission(user, ModuleName.documents, "update")

    document = Document.query.get(uuid_to_bytes(doc_id))
    if not document:
        return jsonify({"message": "Document not found"}), 404

    data = request.get_json() or {}
    new_name = (data.get("filename") or "").strip()
    if not new_name:
        return jsonify({"message": "Filename is required"}), 400

    service = _get_service()
    service.rename(document, new_name, get_jwt_identity())
    return jsonify(document_schema.dump(document))


@bp.delete("/<doc_id>")
@jwt_required()
def delete_document(doc_id: str):
    user = request.user  # type: ignore[attr-defined]
    require_permission(user, ModuleName.documents, "delete")

    document = Document.query.get(uuid_to_bytes(doc_id))
    if not document:
        return jsonify({"message": "Document not found"}), 404

    service = _get_service()
    service.delete(document, get_jwt_identity())
    return "", 204
