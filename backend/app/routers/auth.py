"""
Rotas de Autenticação (Login e Perfil).
"""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.security import (
    create_access_token, 
    verify_password,
    create_password_reset_token,
    verify_password_reset_token,
    get_password_hash
)
from app.database import get_db
from app.limiter import limiter
from app.models.usuario import Usuario
from app.schemas.usuario import Token, UsuarioResponse, ForgotPasswordRequest, ResetPasswordRequest
from app.services.email_service import send_password_reset_email

# Cria o roteador para a tag "Auth" no Swagger
router = APIRouter(prefix="/api/auth", tags=["Autenticação"])


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
async def login(
    request: Request,
    response: Response,
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


@router.post("/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Recebe um e-mail. Se o usuário existir, gera um token e envia o link de redefinição.
    Sempre retorna sucesso (200) para evitar enumeração de e-mails.
    """
    stmt = select(Usuario).where(Usuario.email == body.email)
    result = await db.execute(stmt)
    usuario = result.scalar_one_or_none()

    if usuario and usuario.ativo:
        token = create_password_reset_token(email=usuario.email)
        # O link do frontend (em produção, o ideal é pegar do .env)
        # Assumindo Vite rodando na 5173
        reset_link = f"http://localhost:5173/reset-password?token={token}"
        
        # Envia e-mail de fato
        send_password_reset_email(usuario.email, reset_link)

    return {"message": "Se o e-mail existir, um link de redefinição foi enviado."}


@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Recebe o token de redefinição e a nova senha. Atualiza a senha do usuário.
    """
    email = verify_password_reset_token(request.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado."
        )

    stmt = select(Usuario).where(Usuario.email == email)
    result = await db.execute(stmt)
    usuario = result.scalar_one_or_none()

    if not usuario or not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado ou inativo."
        )

    # Hash the new password
    usuario.senha_hash = get_password_hash(request.nova_senha)
    await db.commit()

    return {"message": "Senha alterada com sucesso!"}
