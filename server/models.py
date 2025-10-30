from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import declarative_mixin, relationship

from .extensions import db
from .utils.uuid import UUIDType, uuid_to_bytes


class ModuleName(enum.Enum):
    documents = "documents"
    transactions = "transactions"


class SenderType(enum.Enum):
    user = "user"
    bot = "bot"


@declarative_mixin
class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)


@declarative_mixin
class UUIDPrimaryKeyMixin:
    id = Column(UUIDType, primary_key=True, default=uuid.uuid4)

    @property
    def id_str(self) -> str:
        value = self.id
        if isinstance(value, bytes):
            return str(uuid.UUID(bytes=value))
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(value)


class User(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    __tablename__ = "users"

    email = Column(String(255), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    deleted_at = Column(DateTime)

    roles = relationship("Role", secondary="user_roles", back_populates="users")
    role_links = relationship("UserRole", back_populates="user")
    permission_overrides = relationship("UserPermissionOverride", back_populates="user")


class Role(UUIDPrimaryKeyMixin, db.Model):
    __tablename__ = "roles"

    role_name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255))

    permissions = relationship("RolePermission", back_populates="role")
    users = relationship("User", secondary="user_roles", back_populates="roles")


class UserRole(db.Model):
    __tablename__ = "user_roles"

    user_id = Column(UUIDType, ForeignKey("users.id"), primary_key=True)
    role_id = Column(UUIDType, ForeignKey("roles.id"), primary_key=True)
    granted_by = Column(UUIDType, ForeignKey("users.id"))
    granted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", foreign_keys=[user_id], back_populates="role_links")
    role = relationship("Role", foreign_keys=[role_id])


class RolePermission(db.Model):
    __tablename__ = "role_permissions"

    role_id = Column(UUIDType, ForeignKey("roles.id"), primary_key=True)
    module_name = Column(Enum(ModuleName), primary_key=True)
    is_create = Column(Boolean, default=False, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    is_update = Column(Boolean, default=False, nullable=False)
    is_delete = Column(Boolean, default=False, nullable=False)

    role = relationship("Role", back_populates="permissions")


class UserPermissionOverride(db.Model):
    __tablename__ = "user_permission_overrides"

    user_id = Column(UUIDType, ForeignKey("users.id"), primary_key=True)
    module_name = Column(Enum(ModuleName), primary_key=True)
    is_create = Column(Boolean, default=False, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    is_update = Column(Boolean, default=False, nullable=False)
    is_delete = Column(Boolean, default=False, nullable=False)
    set_by = Column(UUIDType, ForeignKey("users.id"))
    set_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", foreign_keys=[user_id], back_populates="permission_overrides")


class DocumentStatus(enum.Enum):
    uploaded = "uploaded"
    processing = "processing"
    processed = "processed"
    failed = "failed"


class Document(UUIDPrimaryKeyMixin, db.Model):
    __tablename__ = "documents"

    filename = Column(String(255), nullable=False)
    document_url = Column(String(1024), nullable=False)
    uploaded_by = Column(UUIDType, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(Enum(DocumentStatus), default=DocumentStatus.uploaded, nullable=False)

    parse_runs = relationship("DocumentParseRun", back_populates="document", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="document")

    @property
    def uploaded_by_str(self) -> str | None:
        value = self.uploaded_by
        if value is None:
            return None
        if isinstance(value, bytes):
            return str(uuid.UUID(bytes=value))
        if isinstance(value, uuid.UUID):
            return str(value)
        return str(value)


class DocumentParseResult(enum.Enum):
    success = "success"
    partial = "partial"
    failed = "failed"


class DocumentParseRun(UUIDPrimaryKeyMixin, db.Model):
    __tablename__ = "document_parse_runs"

    document_id = Column(UUIDType, ForeignKey("documents.id"), nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    finished_at = Column(DateTime)
    result = Column(Enum(DocumentParseResult), default=DocumentParseResult.success, nullable=False)
    message = Column(Text)

    document = relationship("Document", back_populates="parse_runs")


class Transaction(db.Model):
    __tablename__ = "transactions"

    id_transaksi = Column(Integer, primary_key=True, autoincrement=True)
    transaction_date = Column(Date)
    product_name = Column(String(100))
    category = Column(String(100))
    sales_quantity = Column(Integer)
    unit_price = Column(Numeric(15, 2))
    total_sales = Column(Numeric(15, 2))
    city = Column(String(100))
    salesperson = Column(String(100))
    payment_status = Column(String(50))
    payment_method = Column(String(50))
    document_id = Column(UUIDType, ForeignKey("documents.id"))
    salesperson_user_id = Column(UUIDType, ForeignKey("users.id"))

    document = relationship("Document", back_populates="transactions")


class ChatSession(UUIDPrimaryKeyMixin, TimestampMixin, db.Model):
    __tablename__ = "chat_sessions"

    owner_user_id = Column(UUIDType, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)

    owner = relationship("User")
    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )


class ChatMessage(UUIDPrimaryKeyMixin, db.Model):
    __tablename__ = "chat_messages"

    session_id = Column(UUIDType, ForeignKey("chat_sessions.id"), nullable=False)
    sender_type = Column(Enum(SenderType), nullable=False)
    sender_user_id = Column(UUIDType, ForeignKey("users.id"))
    content = Column(Text, nullable=False)
    document_url = Column(String(1024))
    image_url = Column(String(1024))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("ChatSession", back_populates="messages")
    attachments = relationship("ChatMessageAttachment", back_populates="message", cascade="all, delete-orphan")


class ChatMessageAttachment(UUIDPrimaryKeyMixin, db.Model):
    __tablename__ = "chat_message_attachments"

    message_id = Column(UUIDType, ForeignKey("chat_messages.id"), nullable=False)
    document_id = Column(UUIDType, ForeignKey("documents.id"), nullable=False)

    message = relationship("ChatMessage", back_populates="attachments")
    document = relationship("Document")


class AuditLog(UUIDPrimaryKeyMixin, db.Model):
    __tablename__ = "audit_logs"

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    actor_user_id = Column(UUIDType, ForeignKey("users.id"))
    description = Column(Text, nullable=False)

    actor = relationship("User")


__all__ = [
    "AuditLog",
    "ChatMessage",
    "ChatMessageAttachment",
    "ChatSession",
    "Document",
    "DocumentParseResult",
    "DocumentParseRun",
    "DocumentStatus",
    "ModuleName",
    "Role",
    "RolePermission",
    "SenderType",
    "Transaction",
    "User",
    "UserPermissionOverride",
    "UserRole",
]
