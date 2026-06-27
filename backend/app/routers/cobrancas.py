"""
Rotas para gestão de Cobranças (CRUD).
"""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.cobranca import Cobranca
from app.models.visita import Visita
from app.schemas.cobranca import CobrancaCreate, CobrancaResponse, CobrancaUpdate

router = APIRouter(
    prefix="/api/cobrancas",
    tags=["Cobranças"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=CobrancaResponse, status_code=status.HTTP_201_CREATED)
async def create_cobranca(
    cobranca_in: CobrancaCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Gera uma nova cobrança vinculada a uma Visita/Ordem de Serviço."""
    # 1. Verifica se a Visita existe
    visita = await db.get(Visita, cobranca_in.visita_id)
    if not visita:
        raise HTTPException(status_code=404, detail="Visita/OS não encontrada")

    nova_cobranca = Cobranca(**cobranca_in.model_dump())
    db.add(nova_cobranca)
    await db.commit()
    await db.refresh(nova_cobranca)
    return nova_cobranca


@router.get("/", response_model=list[CobrancaResponse])
async def list_cobrancas(
    db: Annotated[AsyncSession, Depends(get_db)],
    skip: int = 0,
    limit: int = 100
):
    """Lista as cobranças cadastradas."""
    stmt = select(Cobranca).offset(skip).limit(limit).order_by(Cobranca.data_vencimento.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{cobranca_id}", response_model=CobrancaResponse)
async def get_cobranca(
    cobranca_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Busca os detalhes de uma cobrança específica."""
    cobranca = await db.get(Cobranca, cobranca_id)
    if not cobranca:
        raise HTTPException(status_code=404, detail="Cobrança não encontrada")
    return cobranca


@router.patch("/{cobranca_id}", response_model=CobrancaResponse)
async def update_cobranca(
    cobranca_id: UUID,
    cobranca_in: CobrancaUpdate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Atualiza o status de pagamento, data ou valor de uma cobrança."""
    cobranca = await db.get(Cobranca, cobranca_id)
    if not cobranca:
        raise HTTPException(status_code=404, detail="Cobrança não encontrada")

    update_data = cobranca_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(cobranca, key, value)

    await db.commit()
    await db.refresh(cobranca)
    return cobranca


@router.delete("/{cobranca_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cobranca(
    cobranca_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Cancela/Deleta uma cobrança."""
    cobranca = await db.get(Cobranca, cobranca_id)
    if not cobranca:
        raise HTTPException(status_code=404, detail="Cobrança não encontrada")

    await db.delete(cobranca)
    await db.commit()
