from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy.dialects.mysql import BINARY
from sqlalchemy.types import TypeDecorator


def uuid_to_bytes(value: str | uuid.UUID | None) -> Optional[bytes]:
    if value is None:
        return None
    if isinstance(value, uuid.UUID):
        return value.bytes
    return uuid.UUID(str(value)).bytes


def bytes_to_uuid(value: bytes | None) -> Optional[str]:
    if value is None:
        return None
    return str(uuid.UUID(bytes=value))


class UUIDType(TypeDecorator):
    impl = BINARY(16)

    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, bytes):
            return value
        return uuid_to_bytes(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        return bytes_to_uuid(value)
