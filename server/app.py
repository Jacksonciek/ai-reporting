from __future__ import annotations

from datetime import timedelta

from flask import Flask, request
from flask_cors import CORS
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from .config import load_config
from .extensions import bcrypt, db, jwt, migrate
from .models import AuditLog, ModuleName, Role, RolePermission, User
from .routes import auth as auth_routes
from .routes import chat as chat_routes
from .routes import documents as document_routes
from .routes import logs as log_routes
from .routes import transactions as transaction_routes
from .utils.uuid import uuid_to_bytes


def create_app() -> Flask:
    config = load_config()
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = config.database.uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = config.secret_key
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=8)
    app.config["UPLOAD_FOLDER"] = config.upload_dir

    CORS(app, supports_credentials=True)

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(auth_routes.bp)
    app.register_blueprint(chat_routes.bp)
    app.register_blueprint(document_routes.bp)
    app.register_blueprint(transaction_routes.bp)
    app.register_blueprint(log_routes.bp)

    @app.before_request
    def attach_user():
        if request.endpoint and request.endpoint.startswith("static"):
            return
        try:
            verify_jwt_in_request(optional=True)
        except Exception:
            request.user = None  # type: ignore[attr-defined]
            return
        identity = get_jwt_identity()
        if identity:
            user = User.query.get(uuid_to_bytes(identity))
        else:
            user = None
        request.user = user  # type: ignore[attr-defined]

    @app.shell_context_processor
    def make_shell_context():
        return {"db": db, "User": User, "Role": Role, "ModuleName": ModuleName}

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @jwt.user_identity_loader
    def user_identity_lookup(user_id):  # type: ignore[override]
        return user_id

    @jwt.additional_claims_loader
    def add_claims(identity):  # type: ignore[override]
        user = User.query.get(uuid_to_bytes(identity))
        if not user:
            return {}
        roles = [role.role_name for role in user.roles]
        return {"roles": roles}

    with app.app_context():
        _ensure_seed_data()

    return app


def _ensure_seed_data():
    if not Role.query.filter_by(role_name="admin").first():
        admin_role = Role(role_name="admin", description="Administrator")
        db.session.add(admin_role)
        db.session.flush()

        for module in ModuleName:
            perm = RolePermission(
                role_id=admin_role.id,
                module_name=module,
                is_create=True,
                is_read=True,
                is_update=True,
                is_delete=True,
            )
            db.session.add(perm)
        db.session.commit()
