"""
Rotas para gestão de Usuários (CRUD Restrito a Administradores).
"""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import require_admin, require_admin_or_atendente
from app.auth.security import get_password_hash
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.services.auditoria_service import registrar_log

# Removemos a dependência global do router para podermos liberar
# acesso de leitura (GET) para Atendentes também.
router = APIRouter(
    prefix="/api/usuarios",
    tags=["Usuários"]
)


@router.post("/", response_model=UsuarioResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_usuario(
    usuario_in: UsuarioCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[Usuario, Depends(require_admin)]
):
    """Cria um novo usuário (Técnico, Atendente ou outro Admin)."""
    # 1. Verifica se já existe alguém com esse e-mail
    stmt = select(Usuario).where(Usuario.email == usuario_in.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um usuário cadastrado com este e-mail"
        )

    # 2. Transforma a senha em puro texto no hash irreversível bcrypt
    senha_hash = get_password_hash(usuario_in.senha)
    
    # 3. Cria a entidade descartando a senha pura e salvando o hash
    novo_usuario = Usuario(
        nome=usuario_in.nome,
        email=usuario_in.email,
        senha_hash=senha_hash,
        role=usuario_in.role,
        ativo=usuario_in.ativo
    )

    db.add(novo_usuario)
    await registrar_log(db, current_admin.email, "CREATE", "Usuário", detalhes={"nome": novo_usuario.nome, "email": novo_usuario.email, "role": novo_usuario.role})
    await db.commit()
    await db.refresh(novo_usuario)
    return novo_usuario


@router.get("/", response_model=list[UsuarioResponse], dependencies=[Depends(require_admin_or_atendente)])
async def list_usuarios(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100
):
    """Lista todos os usuários da empresa."""
    stmt = select(Usuario).offset(skip).limit(limit).order_by(Usuario.nome)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{usuario_id}", response_model=UsuarioResponse, dependencies=[Depends(require_admin_or_atendente)])
async def get_usuario(
    usuario_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Busca detalhes de um usuário específico."""
    usuario = await db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return usuario


@router.patch("/{usuario_id}", response_model=UsuarioResponse, dependencies=[Depends(require_admin)])
async def update_usuario(
    usuario_id: UUID,
    usuario_in: UsuarioUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[Usuario, Depends(require_admin)]
):
    """Atualiza dados de um usuário (Ex: desativar acesso, trocar senha, mudar cargo)."""
    usuario = await db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    update_data = usuario_in.model_dump(exclude_unset=True)
    
    # Se uma nova senha for enviada no payload, criamos o hash antes de salvar
    if "senha" in update_data:
        nova_senha_hash = get_password_hash(update_data.pop("senha"))
        usuario.senha_hash = nova_senha_hash

    for key, value in update_data.items():
        setattr(usuario, key, value)

    log_detalhes = {k: v for k, v in update_data.items() if k != "senha"}
    await registrar_log(db, current_admin.email, "UPDATE", "Usuário", usuario_id, detalhes=log_detalhes)
    await db.commit()
    await db.refresh(usuario)
    return usuario


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
async def delete_usuario(
    usuario_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_admin: Annotated[Usuario, Depends(require_admin)]
):
    """
    Desativa a conta de um usuário (Soft Delete).
    Jamais apagamos do banco para não corromper o histórico das Visitas
    associadas a este usuário.
    """
    usuario = await db.get(Usuario, usuario_id)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    usuario.ativo = False
    await registrar_log(db, current_admin.email, "SOFT_DELETE", "Usuário", usuario_id, detalhes={"nome": usuario.nome})
    await db.commit()
