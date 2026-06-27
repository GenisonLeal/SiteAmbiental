"""
Tarefas assíncronas do Celery.
São funções que rodam em segundo plano sem prender a API.
"""
import asyncio
from datetime import datetime, timedelta

from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.models.visita import StatusVisita, Visita
from app.worker.celery_app import celery_app


async def _buscar_visitas_com_garantia_vencendo() -> list[Visita]:
    """
    Busca no banco de dados (de forma assíncrona) as visitas concluídas
    cuja data_realizada foi há quase 6 meses (ex: 175 dias atrás).
    """
    agora = datetime.now()
    # Pega as visitas de aproximadamente 5 meses e meio atrás
    data_alvo_inicio = agora - timedelta(days=175)
    data_alvo_fim = agora - timedelta(days=174)

    async with AsyncSessionLocal() as session:
        stmt = (
            select(Visita)
            .where(Visita.status == StatusVisita.concluida)
            .where(Visita.data_realizada >= data_alvo_inicio)
            .where(Visita.data_realizada < data_alvo_fim)
        )
        result = await session.execute(stmt)
        return list(result.scalars().all())


@celery_app.task(name="app.worker.tasks.verificar_garantias_vencendo")
def verificar_garantias_vencendo():
    """
    Tarefa agendada: Roda todos os dias de manhã.
    Como o Celery roda de forma Síncrona, e nosso banco de dados é Assíncrono,
    nós usamos asyncio.run() para criar uma ponte entre os dois mundos.
    """
    print("⏰ [CELERY] Iniciando verificação diária de garantias vencendo...")
    
    # 1. Puxa os dados do banco
    visitas = asyncio.run(_buscar_visitas_com_garantia_vencendo())
    
    if not visitas:
        print("⏰ [CELERY] Nenhuma garantia perto de vencer hoje.")
        return "Nenhuma garantia vencendo."

    # 2. Faz o processamento (ex: Disparar e-mail de alerta pro dono da Protecta)
    for visita in visitas:
        print(f"⚠️ [CELERY] ALERTA: A garantia da OS {visita.numero_os} está quase vencendo! Hora de retornar o contato com o cliente.")
        # Opcional: Integrar com a função de e-mail que criamos antes!
    
    return f"Encontradas {len(visitas)} garantias vencendo."


@celery_app.task(name="app.worker.tasks.disparar_email_async")
def disparar_email_async(nome: str, email: str, telefone: str | None, mensagem: str):
    """
    Exemplo de tarefa delegada sob demanda: 
    Ao invés da API parar para enviar o e-mail, ela delega para cá.
    """
    from app.services.email_service import send_contact_email
    print(f"📧 [CELERY] Enviando e-mail em background de {nome}...")
    send_contact_email(nome, email, telefone, mensagem)
    print("📧 [CELERY] E-mail enviado com sucesso!")
    return "E-mail enviado."
