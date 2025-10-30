from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class DatabaseConfig:
    uri: str


@dataclass
class OpenAIConfig:
    api_key: str | None
    model: str = "gpt-5-mini"
    temperature: float = 0.2


@dataclass
class AppConfig:
    secret_key: str
    database: DatabaseConfig
    openai: OpenAIConfig
    upload_dir: str
    vector_dir: str
    environment: str


DEFAULT_DB_URI = "mysql+pymysql://root@localhost:3306/ai_reporting"


def load_config() -> AppConfig:
    secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")
    db_uri = os.getenv("DATABASE_URL", DEFAULT_DB_URI)
    openai_key = os.getenv("OPENAI_API_KEY")
    upload_dir = os.getenv("UPLOAD_DIR", os.path.join(os.getcwd(), "uploads"))
    vector_dir = os.getenv("VECTOR_DIR", os.path.join(os.getcwd(), "vectorstore"))
    environment = os.getenv("FLASK_ENV", "development")

    return AppConfig(
        secret_key=secret_key,
        database=DatabaseConfig(uri=db_uri),
        openai=OpenAIConfig(api_key=openai_key),
        upload_dir=upload_dir,
        vector_dir=vector_dir,
        environment=environment,
    )
