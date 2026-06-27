"""
Configuração do aplicativo Celery.
O Celery vai ler e gravar tarefas no Redis.
"""
from celery import Celery
from celery.schedules import crontab

from app.config import settings

# Inicializa o Celery com o nome 'worker' e aponta o Broker (onde a fila fica) 
# e o Backend (onde o resultado das tarefas fica) para o Redis.
celery_app = Celery(
    "worker",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.worker.tasks"]  # Diz ao Celery onde procurar as tarefas
)

# Configurações adicionais
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=False,
)

# ── Celery Beat (Agendador de Tarefas) ────────────────────────────────────────
# Aqui nós dizemos ao Celery para rodar certas tarefas automaticamente
# em dias ou horários específicos, como se fosse um "Alarme".
celery_app.conf.beat_schedule = {
    "verificar-garantias-todo-dia-as-8h": {
        "task": "app.worker.tasks.verificar_garantias_vencendo",
        # Configurado para rodar todos os dias às 08:00 da manhã
        "schedule": crontab(hour=8, minute=0),
    },
}
