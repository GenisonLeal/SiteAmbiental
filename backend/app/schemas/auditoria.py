from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class AuditoriaLogResponse(BaseModel):
    id: UUID
    usuario_email: str
    acao: str
    entidade: str
    entidade_id: str | None = None
    detalhes: dict | None = None
    data_hora: datetime

    model_config = ConfigDict(from_attributes=True)
