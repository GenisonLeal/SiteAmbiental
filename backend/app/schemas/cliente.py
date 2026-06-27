"""
Schemas Pydantic para a entidade Cliente.
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ── Schemas de Cliente ────────────────────────────────────────────────────────
class ClienteBase(BaseModel):
    """Campos comuns aos schemas de cliente."""
    nome: str = Field(..., max_length=150)
    cpf_cnpj: str = Field(..., max_length=20)
    telefone: str = Field(..., max_length=20)
    email: EmailStr | None = None
    endereco: str | None = None
    cidade: str | None = Field(None, max_length=100)


class ClienteCreate(ClienteBase):
    """
    Schema para CRIAÇÃO. Não exige ID nem campos de auditoria, 
    pois eles são gerados automaticamente pelo banco.
    """
    pass


class ClienteUpdate(BaseModel):
    """
    Schema para ATUALIZAÇÃO. Todos os campos são opcionais,
    permitindo enviar apenas o que se deseja alterar (PATCH).
    """
    nome: str | None = Field(None, max_length=150)
    cpf_cnpj: str | None = Field(None, max_length=20)
    telefone: str | None = Field(None, max_length=20)
    email: EmailStr | None = None
    endereco: str | None = None
    cidade: str | None = Field(None, max_length=100)


class ClienteResponse(ClienteBase):
    """
    Schema de RESPOSTA. O que o frontend vai receber após
    criar, atualizar ou listar um cliente.
    """
    id: UUID
    criado_em: datetime
    atualizado_em: datetime

    # Permite ler dados diretamente do Model do SQLAlchemy
    model_config = ConfigDict(from_attributes=True)
