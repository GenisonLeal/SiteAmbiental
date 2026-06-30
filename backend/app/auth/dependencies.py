"""
Dependências de segurança para o FastAPI.
Funções injetadas nas rotas para validar o JWT e obter o usuário logado.
"""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.usuario import RoleUsuario, Usuario

# Informa ao FastAPI qual rota o frontend deve usar para enviar usuário/senha e obter o token.
# O Swagger UI (documentação) usa isso para o botão "Authorize".
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> Usuario:
    """
    Decodifica o token JWT enviado no cabeçalho Authorization.
    Verifica se não expirou, extrai o e-mail (sub) e busca o usuário no banco.
    Se o usuário não existir ou estiver desativado, lança erro HTTP 401.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou token expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decodifica o payload usando nossa secret_key
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[settings.algorithm]
        )
        email: str | None = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Busca o usuário no banco pelo e-mail
    stmt = select(Usuario).where(Usuario.email == email)
    result = await db.execute(stmt)
    usuario = result.scalar_one_or_none()

    if usuario is None:
        raise credentials_exception

    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo. Contate o administrador.",
        )

    return usuario


async def require_admin(
    current_user: Annotated[Usuario, Depends(get_current_user)]
) -> Usuario:
    """
    Dependência extra para rotas exclusivas de administradores.
    Exemplo: criar novos usuários, acessar relatórios financeiros globais.
    """
    if current_user.role != RoleUsuario.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Requer privilégios de administrador.",
        )
    return current_user


async def require_internal_user(
    current_user: Annotated[Usuario, Depends(get_current_user)]
) -> Usuario:
    """
    Permite acesso a Administradores, Atendentes e Técnicos.
    Bloqueia Clientes de realizar operações que afetam o sistema interno.
    """
    if current_user.role == RoleUsuario.cliente:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a funcionários da empresa.",
        )
    return current_user


async def require_admin_or_atendente(
    current_user: Annotated[Usuario, Depends(get_current_user)]
) -> Usuario:
    """
    Permite acesso apenas para Administradores e Atendentes (ex: criar clientes e finanças).
    Bloqueia Técnicos e Clientes.
    """
    if current_user.role not in [RoleUsuario.admin, RoleUsuario.atendente]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Esta operação exige privilégios administrativos ou de atendimento.",
        )
    return current_user
