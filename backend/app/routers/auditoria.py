from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_admin
from app.database import get_db
from app.models.auditoria import AuditoriaLog
from app.schemas.auditoria import AuditoriaLogResponse

router = APIRouter(
    prefix="/api/auditoria",
    tags=["Auditoria"],
    dependencies=[Depends(require_admin)]
)

@router.get("/", response_model=list[AuditoriaLogResponse])
async def list_logs(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100
):
    """
    Lista o histórico de logs de auditoria do sistema.
    Acesso restrito apenas a Administradores.
    """
    stmt = select(AuditoriaLog).offset(skip).limit(limit).order_by(AuditoriaLog.data_hora.desc())
    result = await db.execute(stmt)
    return result.scalars().all()
