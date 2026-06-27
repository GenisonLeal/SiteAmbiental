"""
Schema Pydantic para o formulário de contato do site público.
Não possui Model do SQLAlchemy pois não salvamos no banco, apenas enviamos por e-mail.
"""
from pydantic import BaseModel, EmailStr, Field


class ContatoRequest(BaseModel):
    """Schema para validação dos dados recebidos do site público."""
    nome: str = Field(..., max_length=150)
    email: EmailStr
    telefone: str | None = Field(None, max_length=20)
    mensagem: str = Field(..., min_length=10, max_length=1000)
