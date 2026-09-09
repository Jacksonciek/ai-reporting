from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import Iterable, Optional

import pandas as pd
import pdfplumber

from ..config import AppConfig
from ..extensions import db
from ..utils.logs import log_action
from ..models import (
    Document,
    DocumentParseResult,
    DocumentParseRun,
    DocumentStatus,
    Transaction,
)
from ..utils.uuid import uuid_to_bytes


SUPPORTED_MIME = {
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/pdf",
}


class DocumentService:
    def __init__(self, config: AppConfig):
        self.config = config
        os.makedirs(config.upload_dir, exist_ok=True)

    def _save_file(self, file_storage) -> str:
        filename = f"{uuid.uuid4()}_{file_storage.filename}"
        path = os.path.join(self.config.upload_dir, filename)
        file_storage.save(path)
        return path

    def _parse_pdf(self, path: str) -> str:
        with pdfplumber.open(path) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        return "\n".join(pages)

    def _parse_tabular(self, path: str) -> pd.DataFrame:
        if path.endswith(".csv"):
            return pd.read_csv(path)
        return pd.read_excel(path)

    def _persist_transactions(self, df: pd.DataFrame, document: Document) -> int:
        count = 0
        for _, row in df.iterrows():
            transaction = Transaction(
                transaction_date=row.get("tanggal") or row.get("transaction_date"),
                product_name=row.get("nama_produk") or row.get("product_name"),
                category=row.get("kategori") or row.get("category"),
                sales_quantity=row.get("jumlah_terjual") or row.get("sales_quantity"),
                unit_price=row.get("harga_satuan") or row.get("unit_price"),
                total_sales=row.get("total_penjualan") or row.get("total_sales"),
                city=row.get("kota") or row.get("city"),
                salesperson=row.get("salesperson"),
                payment_status=row.get("status_pembayaran") or row.get("payment_status"),
                payment_method=row.get("metode_pembayaran") or row.get("payment_method"),
                document=document,
            )
            db.session.add(transaction)
            count += 1
        return count

    def upload(self, file_storage, user_id: Optional[str]) -> Document:
        log_action(f"Document upload started: {file_storage.filename}", user_id)
        document = Document(
            filename=file_storage.filename,
            document_url="",
            uploaded_by=uuid_to_bytes(user_id) if user_id else None,
            status=DocumentStatus.processing,
        )
        db.session.add(document)
        db.session.flush()

        run = DocumentParseRun(
            document=document,
            result=DocumentParseResult.success,
        )
        db.session.add(run)
        db.session.flush()

        try:
            path = self._save_file(file_storage)
            document.document_url = path
            content = ""
            transactions_created = 0

            if file_storage.mimetype == "application/pdf" or path.endswith(".pdf"):
                content = self._parse_pdf(path)
            else:
                df = self._parse_tabular(path)
                transactions_created = self._persist_transactions(df, document)
                content = df.to_csv(index=False)

            document.status = DocumentStatus.processed
            log_action(
                f"Document {document.filename} processed successfully (records={transactions_created})",
                user_id,
            )
            run.message = f"Parsed successfully. Transactions created: {transactions_created}"
        except Exception as exc:  # noqa: BLE001
            document.status = DocumentStatus.failed
            run.result = DocumentParseResult.failed
            log_action(f"Document {document.filename} failed: {exc}", user_id)
            run.message = str(exc)
        finally:
            run.finished_at = datetime.utcnow()
            db.session.commit()

        return document

    def rename(self, document: Document, new_name: str, actor_id: Optional[str] = None) -> Document:
        original_name = document.filename
        document.filename = new_name
        log_action(f"Document {document.id_str} renamed from {original_name} to {new_name}", actor_id)
        db.session.commit()
        return document

    def delete(self, document: Document, actor_id: Optional[str] = None) -> None:
        path = document.document_url
        log_action(f"Document {document.id_str} deleted", actor_id)
        db.session.delete(document)
        db.session.commit()
        if path and os.path.exists(path):
            os.remove(path)

    def build_context(self, documents: Iterable[Document]) -> list[dict]:
        context = []
        for doc in documents:
            if doc.document_url and os.path.exists(doc.document_url):
                if doc.document_url.endswith(".pdf"):
                    text = self._parse_pdf(doc.document_url)
                else:
                    df = self._parse_tabular(doc.document_url)
                    text = df.to_csv(index=False)
            else:
                text = ""
            context.append(
                {
                    "content": text,
                    "metadata": {
                        "document_id": doc.id_str,
                        "filename": doc.filename,
                    },
                }
            )
        return context
