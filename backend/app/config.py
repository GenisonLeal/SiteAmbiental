"""
Configurações centralizadas da aplicação.
Todas as variáveis são lidas do arquivo .env via Pydantic Settings.
"""
import json
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Banco de Dados ────────────────────────────────────
    database_url: str

    # ── Segurança JWT ─────────────────────────────────────
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # ── E-mail SMTP ───────────────────────────────────────
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str
    email_from_name: str = "Protecta Dedetização"

    # ── Supabase ──────────────────────────────────────────
    supabase_url: str
    supabase_key: str

    # ── Celery / Redis ────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── CORS ──────────────────────────────────────────────
    cors_origins: list[str] = ["http://localhost:5173"]

    def parse_cors_origins(self) -> list[str]:
        """
        Suporte para CORS_ORIGINS como string JSON ou lista Python.
        Útil quando a variável de ambiente é definida como string no cloud.
        """
        if isinstance(self.cors_origins, str):
            return json.loads(self.cors_origins)
        return self.cors_origins


# Instância única reutilizada em toda a aplicação (padrão Singleton)
settings = Settings()
