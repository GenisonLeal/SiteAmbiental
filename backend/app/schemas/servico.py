"""
Schemas Pydantic para a entidade Serviço.
"""
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ── Schemas de Serviço ────────────────────────────────────────────────────────
class ServicoBase(BaseModel):
    """Campos comuns aos schemas de serviço."""
    nome: str = Field(..., max_length=150)
    descricao: str | None = None
    preco_base: Decimal = Field(..., max_digits=10, decimal_places=2)
    ativo: bool = True


class ServicoCreate(ServicoBase):
    """Schema para CRIAÇÃO."""
    pass


class ServicoUpdate(BaseModel):
    """Schema para ATUALIZAÇÃO (PATCH)."""
    nome: str | None = Field(None, max_length=150)
    descricao: str | None = None
    preco_base: Decimal | None = Field(None, max_digits=10, decimal_places=2)
    ativo: bool | None = None


class ServicoResponse(ServicoBase):
    """Schema de RESPOSTA."""
    id: UUID
    criado_em: datetime
    atualizado_em: datetime

    model_config = ConfigDict(from_attributes=True)
