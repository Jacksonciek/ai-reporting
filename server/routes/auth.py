from __future__ import annotations


from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required

from ..extensions import bcrypt, db
from ..models import Role, User, UserRole
from ..schemas import UserSchema
from ..utils.uuid import uuid_to_bytes

bp = Blueprint("auth", __name__, url_prefix="/api/auth")

user_schema = UserSchema()


@bp.post("/register")
def register():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    role_name = data.get("role", "user")

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already registered"}), 409

    hashed = bcrypt.generate_password_hash(password).decode("utf-8")
    user = User(email=email, password=hashed)
    db.session.add(user)
    db.session.flush()

    role = Role.query.filter_by(role_name=role_name).first()
    if not role:
        role = Role(role_name=role_name, description=f"Auto-created role {role_name}")
        db.session.add(role)
        db.session.flush()

    link = UserRole(user_id=user.id, role_id=role.id)
    db.session.add(link)
    db.session.commit()

    token = create_access_token(identity=user.id_str)
    role_names = [role.role_name for role in user.roles]
    return jsonify({"token": token, "user": {**user_schema.dump(user), "roles": role_names}}), 201


@bp.post("/login")
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"message": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.check_password_hash(user.password, password):
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_access_token(identity=user.id_str)
    role_names = [role.role_name for role in user.roles]
    return jsonify({"token": token, "user": {**user_schema.dump(user), "roles": role_names}})


@bp.get("/me")
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(uuid_to_bytes(user_id))
    if not user:
        return jsonify({"message": "User not found"}), 404
    role_names = [role.role_name for role in user.roles]
    payload = {**user_schema.dump(user), "roles": role_names}
    return jsonify(payload)
