from __future__ import annotations

from ..extensions import db
from ..models import AuditLog
from ..utils.uuid import uuid_to_bytes


def log_action(description: str, actor_id: str | None = None, *, commit: bool = False) -> None:
    """Persist an audit log entry.

    The helper defaults to flushing the new log entry so it participates in the
    surrounding transaction. Pass ``commit=True`` when the caller specifically
    needs an immediate commit (rare in this codebase).
    """

    log = AuditLog(description=description, actor_user_id=uuid_to_bytes(actor_id) if actor_id else None)
    db.session.add(log)
    if commit:
        db.session.commit()
    else:
        db.session.flush()
