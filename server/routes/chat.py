from __future__ import annotations

from datetime import datetime
from typing import List

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from ..config import load_config
from ..extensions import db
from ..models import ChatMessage, ChatSession, SenderType, Document, DocumentStatus
from ..schemas import ChatMessageSchema, ChatSessionSchema
from ..services.ai import AIChatService
from ..services.documents import DocumentService
from ..utils.uuid import uuid_to_bytes

bp = Blueprint("chat", __name__, url_prefix="/api/conversation_chatbots")

session_schema = ChatSessionSchema()
message_schema = ChatMessageSchema()


def _parse_document_ids(raw_ids: List[str]) -> List[bytes]:
    parsed: List[bytes] = []
    for raw in raw_ids:
        try:
            parsed_id = uuid_to_bytes(raw)
        except (ValueError, TypeError) as exc:  # pragma: no cover - defensive guard
            raise ValueError(f"Invalid document id: {raw}") from exc
        if parsed_id is None:
            raise ValueError(f"Invalid document id: {raw}")
        parsed.append(parsed_id)
    return parsed


def _load_context_documents(document_ids: List[str]) -> List[Document]:
    base_query = Document.query.filter(Document.status == DocumentStatus.processed)
    if not document_ids:
        return base_query.all()

    parsed_ids = _parse_document_ids(document_ids)
    if not parsed_ids:
        return base_query.all()

    documents = base_query.filter(Document.id.in_(parsed_ids)).all()
    if documents:
        return documents
    return base_query.all()


def _history_payload(messages: List[ChatMessage]) -> List[dict[str, str]]:
    payload: List[dict[str, str]] = []
    for msg in messages:
        role = "assistant" if msg.sender_type == SenderType.bot else "user"
        payload.append({"role": role, "content": msg.content})
    return payload


@bp.post("")
@jwt_required()
def create_chat():
    user_id_str = get_jwt_identity()
    user_id = uuid_to_bytes(user_id_str)
    data = request.get_json() or {}
    title = data.get("title") or "Percakapan Baru"
    message = data.get("message")
    document_ids = data.get("document_ids", [])
    if not isinstance(document_ids, list):
        return jsonify({"message": "document_ids must be a list"}), 400

    session = ChatSession(owner_user_id=user_id, title=title)
    db.session.add(session)
    db.session.flush()

    if message:
        user_message = ChatMessage(
            session=session,
            sender_type=SenderType.user,
            sender_user_id=user_id,
            content=message,
        )
        db.session.add(user_message)

    response_payload = None
    if message:
        config = load_config()
        document_service = DocumentService(config)
        ai = AIChatService(config)
        try:
            documents = _load_context_documents(document_ids)
        except ValueError as exc:
            db.session.rollback()
            return jsonify({"message": str(exc)}), 400

        context_docs = document_service.build_context(documents)
        response_payload = ai.generate(message, [], context_docs)

        bot_message = ChatMessage(
            session=session,
            sender_type=SenderType.bot,
            content=response_payload["answer"],
        )
        db.session.add(bot_message)
        session.updated_at = datetime.utcnow()

    db.session.commit()

    result = session_schema.dump(session)
    if response_payload:
        result["ai_response"] = response_payload
    return jsonify(result), 201


@bp.get("")
@jwt_required()
def list_chats():
    user_id = uuid_to_bytes(get_jwt_identity())
    sessions = ChatSession.query.filter_by(owner_user_id=user_id).order_by(ChatSession.created_at.desc()).all()
    return jsonify(session_schema.dump(sessions, many=True))


@bp.get("/latest")
@jwt_required()
def latest_chat():
    user_id = uuid_to_bytes(get_jwt_identity())
    session = ChatSession.query.filter_by(owner_user_id=user_id).order_by(ChatSession.created_at.desc()).first()
    if not session:
        return jsonify({"message": "No chat found"}), 404
    return jsonify(session_schema.dump(session))


@bp.get("/<session_id>")
@jwt_required()
def get_chat(session_id: str):
    session = ChatSession.query.get(uuid_to_bytes(session_id))
    if not session:
        return jsonify({"message": "Chat not found"}), 404
    if session.owner_user_id != uuid_to_bytes(get_jwt_identity()):
        return jsonify({"message": "Forbidden"}), 403
    return jsonify(session_schema.dump(session))


@bp.post("/<session_id>/messages")
@jwt_required()
def send_message(session_id: str):
    session = ChatSession.query.get(uuid_to_bytes(session_id))
    if not session:
        return jsonify({"message": "Chat not found"}), 404
    if session.owner_user_id != uuid_to_bytes(get_jwt_identity()):
        return jsonify({"message": "Forbidden"}), 403

    data = request.get_json() or {}
    message = data.get("message")
    document_ids = data.get("document_ids", [])
    if not isinstance(document_ids, list):
        return jsonify({"message": "document_ids must be a list"}), 400
    if not message:
        return jsonify({"message": "Message is required"}), 400

    user_id = uuid_to_bytes(get_jwt_identity())
    history_messages = _history_payload(list(session.messages))
    user_message = ChatMessage(
        session=session,
        sender_type=SenderType.user,
        sender_user_id=user_id,
        content=message,
    )
    db.session.add(user_message)

    config = load_config()
    document_service = DocumentService(config)
    ai = AIChatService(config)
    try:
        documents = _load_context_documents(document_ids)
    except ValueError as exc:
        db.session.rollback()
        return jsonify({"message": str(exc)}), 400

    context_docs = document_service.build_context(documents)
    response_payload = ai.generate(message, history_messages, context_docs)

    bot_message = ChatMessage(
        session=session,
        sender_type=SenderType.bot,
        content=response_payload["answer"],
    )
    db.session.add(bot_message)
    session.updated_at = datetime.utcnow()
    db.session.commit()

    result = message_schema.dump([user_message, bot_message], many=True)
    return jsonify({"messages": result, "ai_response": response_payload})
