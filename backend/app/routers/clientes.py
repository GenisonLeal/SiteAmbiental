"""
Rotas para gestão de Clientes (CRUD).
"""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.auth.dependencies import get_current_user, require_admin_or_atendente
from app.auth.security import get_password_hash
from app.database import get_db
from app.models.cliente import Cliente
from app.models.usuario import Usuario, RoleUsuario
from app.schemas.cliente import ClienteCreate, ClienteResponse, ClienteUpdate
from app.services.auditoria_service import registrar_log

router = APIRouter(
    prefix="/api/clientes",
    tags=["Clientes"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin_or_atendente)])
async def create_cliente(
    cliente_in: ClienteCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Cria um novo cliente."""
    stmt = select(Cliente).where(Cliente.cpf_cnpj == cliente_in.cpf_cnpj)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um cliente com este CPF/CNPJ"
        )
    
    novo_cliente = Cliente(**cliente_in.model_dump())
    db.add(novo_cliente)
    await registrar_log(db, current_user.email, "CREATE", "Cliente", detalhes={"nome": novo_cliente.nome, "cpf_cnpj": novo_cliente.cpf_cnpj})
    await db.commit()
    await db.refresh(novo_cliente)
    return novo_cliente


@router.get("/", response_model=list[ClienteResponse], dependencies=[Depends(require_admin_or_atendente)])
async def list_clientes(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100
):
    """Lista todos os clientes com paginação (somente admin/atendente)."""
    stmt = select(Cliente).offset(skip).limit(limit).order_by(Cliente.criado_em.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{cliente_id}", response_model=ClienteResponse)
async def get_cliente(
    cliente_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Busca um cliente específico pelo ID."""
    cliente = await db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    # Proteção de Titularidade (IDOR)
    if current_user.role == RoleUsuario.cliente:
        if cliente.usuario_id != current_user.id:
            raise HTTPException(status_code=403, detail="Acesso negado a dados de outro cliente.")

    return cliente


@router.patch("/{cliente_id}", response_model=ClienteResponse, dependencies=[Depends(require_admin_or_atendente)])
async def update_cliente(
    cliente_id: UUID,
    cliente_in: ClienteUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Atualiza dados de um cliente."""
    cliente = await db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    update_data = cliente_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cliente, key, value)

    await registrar_log(db, current_user.email, "UPDATE", "Cliente", cliente_id, detalhes=update_data)
    await db.commit()
    await db.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin_or_atendente)])
async def delete_cliente(
    cliente_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Deleta um cliente."""
    cliente = await db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    if cliente.usuario_id:
        usuario = await db.get(Usuario, cliente.usuario_id)
        if usuario:
            await db.delete(usuario)

    await db.delete(cliente)
    await registrar_log(db, current_user.email, "DELETE", "Cliente", cliente_id, detalhes={"nome": cliente.nome})
    await db.commit()


from pydantic import BaseModel, Field, field_validator
from app.schemas.usuario import validar_senha_forte

class AcessoCreate(BaseModel):
    senha: str = Field(..., max_length=100)
    
    @field_validator('senha')
    @classmethod
    def validate_password(cls, v: str) -> str:
        return validar_senha_forte(v)

@router.post("/{cliente_id}/gerar-acesso", dependencies=[Depends(require_admin_or_atendente)])
async def gerar_acesso_cliente(
    cliente_id: UUID,
    acesso_in: AcessoCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Gera ou atualiza a senha de acesso web para um cliente específico."""
    cliente = await db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    if not cliente.email:
        raise HTTPException(status_code=400, detail="Cliente não possui e-mail cadastrado")

    if cliente.usuario_id:
        usuario = await db.get(Usuario, cliente.usuario_id)
        usuario.senha_hash = get_password_hash(acesso_in.senha)
    else:
        novo_usuario = Usuario(
            nome=cliente.nome,
            email=cliente.email,
            senha_hash=get_password_hash(acesso_in.senha),
            role=RoleUsuario.cliente,
            ativo=True
        )
        db.add(novo_usuario)
        await db.commit()
        await db.refresh(novo_usuario)
        
        cliente.usuario_id = novo_usuario.id

    await registrar_log(db, current_user.email, "UPDATE", "Acesso Cliente", cliente_id, detalhes={"email": cliente.email, "acao": "Gerou acesso"})
    await db.commit()
    return {"message": "Acesso gerado com sucesso", "email": cliente.email}
