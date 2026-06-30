"""
Schemas Pydantic para a entidade Usuário e para Tokens de Autenticação.
"""
from datetime import datetime
from uuid import UUID

import re
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.usuario import RoleUsuario

def validar_senha_forte(v: str | None) -> str | None:
    if v is None:
        return v
    if len(v) < 8:
        raise ValueError("A senha deve ter pelo menos 8 caracteres.")
    if not re.search(r'[A-Z]', v):
        raise ValueError("A senha deve ter pelo menos uma letra maiúscula.")
    if not re.search(r'[a-z]', v):
        raise ValueError("A senha deve ter pelo menos uma letra minúscula.")
    if not re.search(r'\d', v):
        raise ValueError("A senha deve ter pelo menos um número.")
    if not re.search(r'[@$!%*?&]', v):
        raise ValueError("A senha deve ter pelo menos um caractere especial (@$!%*?&).")
    return v

# ── Schemas de Token ──────────────────────────────────────────────────────────
class Token(BaseModel):
    """Retorno padrão do endpoint de login."""
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    """Dados extraídos (decodificados) do JWT."""
    sub: str | None = None


class ForgotPasswordRequest(BaseModel):
    """Schema para solicitação de link de redefinição de senha."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Schema para alteração efetiva de senha recebendo o token."""
    token: str
    nova_senha: str = Field(..., max_length=100)

    @field_validator('nova_senha')
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validar_senha_forte(v)


# ── Schemas de Usuário ────────────────────────────────────────────────────────
class UsuarioBase(BaseModel):
    """Campos base compartilhados entre os schemas de usuário."""
    nome: str = Field(..., max_length=150)
    email: EmailStr
    role: RoleUsuario = RoleUsuario.atendente
    ativo: bool = True


class UsuarioCreate(UsuarioBase):
    """Schema para CRIAÇÃO de usuário (recebido do frontend)."""
    # A senha é recebida em texto puro e depois criptografada no banco
    senha: str = Field(..., max_length=100)

    @field_validator('senha')
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validar_senha_forte(v)


class UsuarioUpdate(BaseModel):
    """Schema para ATUALIZAÇÃO de usuário (todos os campos opcionais)."""
    nome: str | None = Field(None, max_length=150)
    email: EmailStr | None = None
    role: RoleUsuario | None = None
    ativo: bool | None = None
    senha: str | None = Field(None, max_length=100)

    @field_validator('senha')
    @classmethod
    def validate_password(cls, v: str | None) -> str | None:
        return validar_senha_forte(v)


class UsuarioResponse(UsuarioBase):
    """
    Schema para RETORNO de usuário (enviado ao frontend).
    Note que a 'senha' ou 'senha_hash' NÃO existem aqui por segurança.
    """
    id: UUID
    criado_em: datetime
    atualizado_em: datetime

    # Permite que o Pydantic leia dados de objetos ORM do SQLAlchemy
    model_config = ConfigDict(from_attributes=True)
