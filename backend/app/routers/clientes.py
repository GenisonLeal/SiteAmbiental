"""
Rotas para gestão de Clientes (CRUD).
"""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.cliente import Cliente
from app.models.usuario import Usuario
from app.schemas.cliente import ClienteCreate, ClienteResponse, ClienteUpdate

# O prefixo se aplica a todas as rotas deste arquivo
# A dependência "get_current_user" aqui bloqueia TODAS as rotas deste arquivo
# para usuários não logados.
router = APIRouter(
    prefix="/api/clientes",
    tags=["Clientes"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=ClienteResponse, status_code=status.HTTP_201_CREATED)
async def create_cliente(
    cliente_in: ClienteCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Cria um novo cliente."""
    # 1. Verifica se já existe um cliente com este CPF/CNPJ
    stmt = select(Cliente).where(Cliente.cpf_cnpj == cliente_in.cpf_cnpj)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um cliente com este CPF/CNPJ"
        )
    
    # 2. Converte o schema (Pydantic) para o model (SQLAlchemy)
    novo_cliente = Cliente(**cliente_in.model_dump())
    db.add(novo_cliente)
    await db.commit()
    await db.refresh(novo_cliente)
    return novo_cliente


@router.get("/", response_model=list[ClienteResponse])
async def list_clientes(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100
):
    """Lista todos os clientes com paginação."""
    stmt = select(Cliente).offset(skip).limit(limit).order_by(Cliente.criado_em.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{cliente_id}", response_model=ClienteResponse)
async def get_cliente(
    cliente_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Busca um cliente específico pelo ID."""
    cliente = await db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente


@router.patch("/{cliente_id}", response_model=ClienteResponse)
async def update_cliente(
    cliente_id: UUID,
    cliente_in: ClienteUpdate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Atualiza dados de um cliente."""
    cliente = await db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    # Atualiza apenas os campos que vieram no body da requisição
    update_data = cliente_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cliente, key, value)

    await db.commit()
    await db.refresh(cliente)
    return cliente


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cliente(
    cliente_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Deleta um cliente."""
    cliente = await db.get(Cliente, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    await db.delete(cliente)
    await db.commit()
