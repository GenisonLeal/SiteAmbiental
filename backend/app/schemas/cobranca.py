"""
Schemas Pydantic para a entidade Cobrança.
"""
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.cobranca import StatusCobranca


# ── Schemas de Cobrança ───────────────────────────────────────────────────────
class CobrancaBase(BaseModel):
    """Campos comuns aos schemas de cobrança."""
    visita_id: UUID
    valor: Decimal = Field(..., max_digits=10, decimal_places=2)
    data_vencimento: date
    data_pagamento: date | None = None
    status: StatusCobranca = StatusCobranca.pendente
    forma_pagamento: str | None = Field(None, max_length=50)


class CobrancaCreate(CobrancaBase):
    """Schema para CRIAÇÃO. Exige o ID da visita associada."""
    pass


class CobrancaUpdate(BaseModel):
    """Schema para ATUALIZAÇÃO (PATCH). Todos os campos opcionais."""
    valor: Decimal | None = Field(None, max_digits=10, decimal_places=2)
    data_vencimento: date | None = None
    data_pagamento: date | None = None
    status: StatusCobranca | None = None
    forma_pagamento: str | None = Field(None, max_length=50)


class CobrancaResponse(CobrancaBase):
    """Schema de RESPOSTA."""
    id: UUID
    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(from_attributes=True)
