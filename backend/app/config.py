"""
Configurações centralizadas da aplicação.
Todas as variáveis são lidas do arquivo .env via Pydantic Settings.
A aplicação falha ao iniciar caso alguma variável obrigatória esteja ausente.
"""
import json

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Classe de configurações.
    # Configuração Pydantic para carregar do arquivo .env e
    valida os tipos (ex: porta como int, origens como list).
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,  # DATABASE_URL == database_url
    )

    # ── Banco de Dados ────────────────────────────────────────────────────────
    database_url: str

    # ── Segurança JWT ─────────────────────────────────────────────────────────
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7

    # ── E-mail SMTP ───────────────────────────────────────────────────────────
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str
    smtp_password: str
    email_from_name: str = "Protecta Dedetização"

    # ── Supabase ──────────────────────────────────────────────────────────────
    supabase_url: str = ""
    supabase_key: str = ""

    # ── Celery / Redis ────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379/0"

    # ── Object Storage / S3 ───────────────────────────────────────────────────
    s3_endpoint_url: str = ""
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_bucket_name: str = ""
    s3_region: str = "sa-east-1"

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Recebido como string JSON do .env e convertido para lista
    cors_origins: str = '["http://localhost:5173"]'

    def get_cors_origins(self) -> list[str]:
        """
        Converte a string JSON de CORS_ORIGINS para uma lista Python.

        Exemplo no .env:
            CORS_ORIGINS=["http://localhost:5173","https://meusite.vercel.app"]
        """
        return json.loads(self.cors_origins)


# ── Instância única (Singleton) ───────────────────────────────────────────────
# Criada uma única vez ao importar o módulo.
# Demais arquivos importam este objeto diretamente:
#   from app.config import settings
settings = Settings()
