from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AuditoriaLogResponse(BaseModel):
    id: int
    usuario_email: str
    acao: str
    entidade: str
    entidade_id: int | None = None
    detalhes: dict | None = None
    data_hora: datetime

    model_config = ConfigDict(from_attributes=True)
