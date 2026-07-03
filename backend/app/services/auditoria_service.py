import logging
from sqlalchemy.ext.asyncio import AsyncSession
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
    Esta função não realiza o `commit()`, para que o log seja salvo na mesma transação
    da operação que o chamou. Assim, se a operação principal falhar e der rollback,
    o log de sucesso também não será gravado falsamente.
    """
    try:
        log = AuditoriaLog(
            usuario_email=usuario_email,
            acao=acao,
            entidade=entidade,
            entidade_id=str(entidade_id) if entidade_id else None,
            detalhes=detalhes
        )
        db.add(log)
        # Atenção: não dar commit() aqui intencionalmente.
    except Exception as e:
        # Se falhar ao registrar auditoria, apenas loga no terminal, mas idealmente 
        # não deve quebrar a funcionalidade principal do usuário.
        logger.error(f"Falha ao registrar log de auditoria: {e}")
