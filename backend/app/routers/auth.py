"""
Rotas de Autenticação (Login e Perfil).
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.security import create_access_token, verify_password
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import Token, UsuarioResponse

# Cria o roteador para a tag "Auth" no Swagger
router = APIRouter(prefix="/api/auth", tags=["Autenticação"])


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Recebe as credenciais (e-mail e senha) e devolve um Token JWT se estiverem corretas.
    Nota: OAuth2 usa os campos 'username' e 'password' por padrão, então o
    frontend enviará o e-mail no campo 'username'.
    """
    # 1. Busca o usuário no banco pelo e-mail
    stmt = select(Usuario).where(Usuario.email == form_data.username)
    result = await db.execute(stmt)
    usuario = result.scalar_one_or_none()

    # 2. Se o usuário não existir, bloqueia
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Se existir, verifica se a senha bate com o hash salvo no banco
    if not verify_password(form_data.password, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # 4. Verifica se a conta está ativa
    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo. Contate o administrador.",
        )

    # 5. Se tudo deu certo, cria o token JWT carregando o e-mail no 'sub'
    access_token = create_access_token(data={"sub": usuario.email})
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UsuarioResponse)
async def read_users_me(
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """
    Retorna os dados do usuário que está atualmente logado.
    A dependência `get_current_user` faz todo o trabalho de ler o token 
    do cabeçalho, validar e buscar no banco de dados.
    """
    # Como o get_current_user já fez todo o trabalho pesado, 
    # nós apenas retornamos o objeto. O `response_model=UsuarioResponse` 
    # garantirá que a senha não seja enviada de volta!
    return current_user
