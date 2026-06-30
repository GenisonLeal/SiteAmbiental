"""
Rotas para gestão de Cobranças (CRUD).
"""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_user, require_internal_user
from app.database import get_db
from app.models.cobranca import Cobranca
from app.models.usuario import Usuario, RoleUsuario
from app.models.cliente import Cliente
from app.models.visita import Visita
from app.schemas.cobranca import CobrancaCreate, CobrancaResponse, CobrancaUpdate
from app.services.email_service import send_cobranca_email

router = APIRouter(
    prefix="/api/cobrancas",
    tags=["Cobranças"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=CobrancaResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_internal_user)])
async def create_cobranca(
    cobranca_in: CobrancaCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Gera uma nova cobrança vinculada a uma Visita/Ordem de Serviço."""
    # Para notificar, precisamos buscar a Visita e juntar o Cliente
    stmt = select(Visita).where(Visita.id == cobranca_in.visita_id).options(selectinload(Visita.cliente))
    result = await db.execute(stmt)
    visita = result.scalar_one_or_none()
    
    if not visita:
        raise HTTPException(status_code=404, detail="Visita/OS não encontrada")

    nova_cobranca = Cobranca(**cobranca_in.model_dump())
    db.add(nova_cobranca)
    await db.commit()
    await db.refresh(nova_cobranca)

    # Dispara e-mail se o cliente tiver e-mail
    if visita.cliente and visita.cliente.email:
        valor_str = f"{nova_cobranca.valor:.2f}".replace('.', ',')
        vencimento_str = nova_cobranca.data_vencimento.strftime("%d/%m/%Y") if nova_cobranca.data_vencimento else "À vista"
        send_cobranca_email(visita.cliente.email, valor_str, vencimento_str)

    return nova_cobranca


@router.get("/", response_model=list[CobrancaResponse])
async def list_cobrancas(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 100
):
    """Lista as cobranças cadastradas."""
    stmt = select(Cobranca)
    
    if current_user.role == RoleUsuario.cliente:
        stmt = stmt.join(Visita).join(Cliente).where(Cliente.usuario_id == current_user.id)
        
    stmt = stmt.offset(skip).limit(limit).order_by(Cobranca.data_vencimento.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{cobranca_id}", response_model=CobrancaResponse)
async def get_cobranca(
    cobranca_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Busca os detalhes de uma cobrança específica."""
    # Precisamos do JOIN com Visita e Cliente para checar a titularidade
    stmt = (
        select(Cobranca)
        .where(Cobranca.id == cobranca_id)
        .options(selectinload(Cobranca.visita).selectinload(Visita.cliente))
    )
    result = await db.execute(stmt)
    cobranca = result.scalar_one_or_none()
    
    if not cobranca:
        raise HTTPException(status_code=404, detail="Cobrança não encontrada")
        
    if current_user.role == RoleUsuario.cliente:
        if cobranca.visita.cliente.usuario_id != current_user.id:
            raise HTTPException(status_code=403, detail="Acesso negado a cobrança de outro cliente.")
            
    return cobranca


@router.patch("/{cobranca_id}", response_model=CobrancaResponse, dependencies=[Depends(require_internal_user)])
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


@router.delete("/{cobranca_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_internal_user)])
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
