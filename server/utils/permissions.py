from __future__ import annotations

from typing import Optional

from flask import abort

from ..models import ModuleName, RolePermission, User, UserPermissionOverride, UserRole
from ..extensions import db


class PermissionError(Exception):
    pass


def has_permission(user: User, module: ModuleName, action: str) -> bool:
    if user is None:
        return False

    override: Optional[UserPermissionOverride] = next(
        (o for o in user.permission_overrides if o.module_name == module),
        None,
    )
    if override:
        return getattr(override, f"is_{action}")

    role_links: list[UserRole] = user.role_links
    if not role_links:
        return False

    for link in role_links:
        perm: Optional[RolePermission] = next(
            (p for p in link.role.permissions if p.module_name == module),
            None,
        )
        if perm and getattr(perm, f"is_{action}"):
            return True
    return False


def require_permission(user: User, module: ModuleName, action: str) -> None:
    if not has_permission(user, module, action):
        abort(403, description="Insufficient permissions")
