from __future__ import annotations

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required

from ..models import ModuleName, Transaction
from ..schemas import TransactionSchema
from ..utils.permissions import require_permission

bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")

transaction_schema = TransactionSchema()


@bp.get("")
@jwt_required()
def list_transactions():
    user = request.user  # type: ignore[attr-defined]
    require_permission(user, ModuleName.transactions, "read")

    transactions = Transaction.query.order_by(Transaction.transaction_date.desc().nullslast()).all()
    return jsonify(transaction_schema.dump(transactions, many=True))
