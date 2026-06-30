"""
Schemas Pydantic para a entidade Usuário e para Tokens de Autenticação.
"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.usuario import RoleUsuario


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
    nova_senha: str = Field(..., min_length=8, max_length=100, pattern=r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$')


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
    senha: str = Field(..., min_length=8, max_length=100, pattern=r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$')


class UsuarioUpdate(BaseModel):
    """Schema para ATUALIZAÇÃO de usuário (todos os campos opcionais)."""
    nome: str | None = Field(None, max_length=150)
    email: EmailStr | None = None
    role: RoleUsuario | None = None
    ativo: bool | None = None
    senha: str | None = Field(None, min_length=8, max_length=100, pattern=r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$')


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
