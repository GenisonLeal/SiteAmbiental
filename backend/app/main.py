"""
Ponto de entrada principal da API (FastAPI).
Configura a inicialização do app, middlewares (CORS) e rotas globais.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.limiter import limiter

# ── Configuração da Aplicação ─────────────────────────────────────────────────
app = FastAPI(
    title="Protecta Dedetização API",
    description="API para gestão do painel administrativo da Protecta",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Configuração do CORS ──────────────────────────────────────────────────────
# O CORS permite que o frontend (ex: React em localhost:5173) faça
# requisições para esta API (que rodará em localhost:8000).
# Sem isso, o navegador bloqueia as chamadas por segurança.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),  # Lê a lista do .env
    allow_credentials=True,
    allow_methods=["*"],  # Permite GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],  # Permite envio de tokens JWT no cabeçalho
)


# ── Rota Global (Health Check) ────────────────────────────────────────────────
@app.get("/", tags=["Status"])
async def root():
    """
    Health Check simples para confirmar que a API está online.
    """
    return {
        "status": "online",
        "api": "Protecta Dedetização",
        "docs_url": "/docs"  # Onde fica a documentação interativa (Swagger)
    }

# Quando implementarmos as rotas de clientes, usuários, etc.,
# usaremos app.include_router(clientes.router) aqui.

from app.routers import auth, clientes, cobrancas, contato, servicos, usuarios, visitas

app.include_router(auth.router)
app.include_router(clientes.router)
app.include_router(servicos.router)
app.include_router(visitas.router)
app.include_router(cobrancas.router)
app.include_router(usuarios.router)
app.include_router(contato.router)
