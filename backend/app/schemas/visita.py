"""
Schemas Pydantic para a entidade Visita (Ordem de Serviço).
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.visita import StatusVisita


# ── Schemas de Visita ─────────────────────────────────────────────────────────
class VisitaBase(BaseModel):
    """Campos comuns aos schemas de visita."""
    cliente_id: UUID
    servico_id: UUID
    tecnico_id: UUID | None = None
    data_agendada: datetime
    data_realizada: datetime | None = None
    status: StatusVisita = StatusVisita.agendada
    observacoes: str | None = None


class VisitaCreate(VisitaBase):
    """Schema para CRIAÇÃO. Recebe os IDs dos relacionamentos."""
    pass


class VisitaUpdate(BaseModel):
    """Schema para ATUALIZAÇÃO (PATCH). Todos os campos opcionais."""
    tecnico_id: UUID | None = None
    data_agendada: datetime | None = None
    data_realizada: datetime | None = None
    status: StatusVisita | None = None
    observacoes: str | None = None


class VisitaResponse(VisitaBase):
    """Schema de RESPOSTA."""
    id: UUID
    certificado_url: str | None = None
    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(from_attributes=True)
