from slowapi import Limiter
from slowapi.util import get_remote_address
from app.config import settings

# Instancia o Rate Limiter utilizando o IP remoto do usuário como chave
# e salvando o histórico de contagem no Redis para performance e distribuição.
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.redis_url,
    headers_enabled=True # Retorna cabeçalhos HTTP com o limite restante (X-RateLimit-Limit, etc)
)
