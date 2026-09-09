from __future__ import annotations

from marshmallow import Schema, fields


class UserSchema(Schema):
    id = fields.Str(attribute="id_str")
    email = fields.Email()
    created_at = fields.DateTime()
    updated_at = fields.DateTime(allow_none=True)


class RoleSchema(Schema):
    id = fields.Str(attribute="id_str")
    role_name = fields.Str()
    description = fields.Str(allow_none=True)


class DocumentSchema(Schema):
    id = fields.Str(attribute="id_str")
    filename = fields.Str()
    document_url = fields.Str()
    uploaded_by = fields.Str(attribute="uploaded_by_str", allow_none=True)
    uploaded_at = fields.DateTime()
    status = fields.Str()


class DocumentParseRunSchema(Schema):
    id = fields.Str(attribute="id_str")
    document_id = fields.Str()
    started_at = fields.DateTime()
    finished_at = fields.DateTime(allow_none=True)
    result = fields.Str()
    message = fields.Str(allow_none=True)


class TransactionSchema(Schema):
    id_transaksi = fields.Int()
    transaction_date = fields.Date(allow_none=True)
    product_name = fields.Str(allow_none=True)
    category = fields.Str(allow_none=True)
    sales_quantity = fields.Int(allow_none=True)
    unit_price = fields.Decimal(allow_none=True, as_string=True)
    total_sales = fields.Decimal(allow_none=True, as_string=True)
    city = fields.Str(allow_none=True)
    salesperson = fields.Str(allow_none=True)
    payment_status = fields.Str(allow_none=True)
    payment_method = fields.Str(allow_none=True)
    document_id = fields.Str(allow_none=True)
    salesperson_user_id = fields.Str(allow_none=True)


class ChatMessageAttachmentSchema(Schema):
    id = fields.Str(attribute="id_str")
    document_id = fields.Str()


class ChatMessageSchema(Schema):
    id = fields.Str(attribute="id_str")
    session_id = fields.Str()
    sender_type = fields.Str()
    sender_user_id = fields.Str(allow_none=True)
    content = fields.Str()
    document_url = fields.Str(allow_none=True)
    image_url = fields.Str(allow_none=True)
    created_at = fields.DateTime()
    attachments = fields.List(fields.Nested(ChatMessageAttachmentSchema))


class ChatSessionSchema(Schema):
    id = fields.Str(attribute="id_str")
    owner_user_id = fields.Str()
    title = fields.Str()
    created_at = fields.DateTime()
    updated_at = fields.DateTime(allow_none=True)
    messages = fields.List(fields.Nested(ChatMessageSchema))


class AuditLogSchema(Schema):
    id = fields.Str(attribute="id_str")
    created_at = fields.DateTime()
    actor_user_id = fields.Str(allow_none=True)
    description = fields.Str()


__all__ = [
    "AuditLogSchema",
    "ChatMessageAttachmentSchema",
    "ChatMessageSchema",
    "ChatSessionSchema",
    "DocumentParseRunSchema",
    "DocumentSchema",
    "RoleSchema",
    "TransactionSchema",
    "UserSchema",
]
