"""
Rotas para gestão de Serviços (CRUD).
"""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user, require_internal_user
from app.database import get_db
from app.models.servico import Servico
from app.schemas.servico import ServicoCreate, ServicoResponse, ServicoUpdate

router = APIRouter(
    prefix="/api/servicos",
    tags=["Serviços"],
    dependencies=[Depends(get_current_user), Depends(require_internal_user)]
)


@router.post("/", response_model=ServicoResponse, status_code=status.HTTP_201_CREATED)
async def create_servico(
    servico_in: ServicoCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Cria um novo serviço (ex: Desratização)."""
    # 1. Verifica se já existe um serviço com este nome (opcional, mas recomendado)
    stmt = select(Servico).where(Servico.nome == servico_in.nome)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um serviço cadastrado com este nome"
        )
    
    novo_servico = Servico(**servico_in.model_dump())
    db.add(novo_servico)
    await db.commit()
    await db.refresh(novo_servico)
    return novo_servico


@router.get("/", response_model=list[ServicoResponse])
async def list_servicos(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100
):
    """Lista todos os serviços com paginação."""
    stmt = select(Servico).offset(skip).limit(limit).order_by(Servico.nome)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{servico_id}", response_model=ServicoResponse)
async def get_servico(
    servico_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Busca um serviço específico pelo ID."""
    servico = await db.get(Servico, servico_id)
    if not servico:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")
    return servico


@router.patch("/{servico_id}", response_model=ServicoResponse)
async def update_servico(
    servico_id: UUID,
    servico_in: ServicoUpdate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Atualiza dados de um serviço (ex: reajuste de preço)."""
    servico = await db.get(Servico, servico_id)
    if not servico:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")

    update_data = servico_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(servico, key, value)

    await db.commit()
    await db.refresh(servico)
    return servico


@router.delete("/{servico_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_servico(
    servico_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """
    Desativa um serviço (Soft Delete).
    Nota: Se deletarmos via banco de dados, as visitas passadas que usavam
    este serviço podem perder a referência (dependendo da constraint).
    """
    servico = await db.get(Servico, servico_id)
    if not servico:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")

    # Em vez de db.delete(servico), fazemos um soft-delete
    servico.ativo = False
    await db.commit()
