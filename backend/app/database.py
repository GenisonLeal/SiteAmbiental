"""
Configuração da conexão com o banco de dados PostgreSQL.
Utiliza SQLAlchemy assíncrono com asyncpg como driver.
"""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# ── Engine ────────────────────────────────────────────────────────────────────
# O engine gerencia o pool de conexões com o banco.
# pool_size: conexões mantidas abertas permanentemente
# max_overflow: conexões extras permitidas em pico de uso
# pool_pre_ping: testa a conexão antes de usar (evita "conexão morta" após idle)
engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

# ── Fábrica de sessões ────────────────────────────────────────────────────────
# Cada requisição recebe sua própria sessão — isolamento entre requisições.
# expire_on_commit=False: permite acessar atributos do objeto após o commit
# sem disparar uma nova query ao banco.
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── Base declarativa ──────────────────────────────────────────────────────────
# Todos os models herdarão desta classe.
# O SQLAlchemy usa essa herança para descobrir quais tabelas criar/migrar.
class Base(DeclarativeBase):
    pass


# ── Dependency de sessão ──────────────────────────────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Provedor de sessão para injeção de dependência nas rotas FastAPI.

    Garante que:
    - Cada requisição usa sua própria sessão
    - Em caso de sucesso: commit automático
    - Em caso de erro: rollback automático

    Uso nas rotas:
        from sqlalchemy.ext.asyncio import AsyncSession
        from fastapi import Depends
        from app.database import get_db

        @router.get("/exemplo")
        async def rota(db: AsyncSession = Depends(get_db)):
            ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
