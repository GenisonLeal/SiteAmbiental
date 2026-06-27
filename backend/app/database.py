"""
Configuração da conexão com o banco de dados PostgreSQL.
Utiliza SQLAlchemy assíncrono com asyncpg como driver.
"""
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

# ── Engine assíncrono ─────────────────────────────────────────────────────────
engine = create_async_engine(
    settings.database_url,
    echo=False,        # True para logar SQLs em desenvolvimento
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verifica conexões antes de usar (evita conexões mortas)
)

# ── Fábrica de sessões ────────────────────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Permite acessar atributos após commit sem nova query
)


# ── Base declarativa compartilhada por todos os models ───────────────────────
class Base(DeclarativeBase):
    pass


# ── Dependency para injeção de sessão nas rotas ───────────────────────────────
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Provedor de sessão de banco de dados para usar como dependency do FastAPI.

    Uso:
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
