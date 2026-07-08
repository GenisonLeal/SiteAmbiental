import logging
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.encoders import jsonable_encoder
from app.models.auditoria import AuditoriaLog

logger = logging.getLogger(__name__)

async def registrar_log(
    db: AsyncSession,
    usuario_email: str,
    acao: str,
    entidade: str,
    entidade_id: str | None = None,
    detalhes: dict | None = None
) -> None:
    """
    Função utilitária para registrar logs de auditoria no banco de dados.
    """
    try:
        log = AuditoriaLog(
            usuario_email=usuario_email,
            acao=acao,
            entidade=entidade,
            entidade_id=str(entidade_id) if entidade_id else None,
            detalhes=jsonable_encoder(detalhes) if detalhes else None
        )
        db.add(log)
    except Exception as e:
        logger.error(f"Falha ao registrar log de auditoria: {e}")
