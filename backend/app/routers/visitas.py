"""
Rotas para gestão de Visitas / Ordens de Serviço (CRUD).
"""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.cliente import Cliente
from app.models.servico import Servico
from app.models.usuario import Usuario
from app.models.visita import Visita
from app.schemas.visita import VisitaCreate, VisitaResponse, VisitaUpdate

router = APIRouter(
    prefix="/api/visitas",
    tags=["Visitas"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=VisitaResponse, status_code=status.HTTP_201_CREATED)
async def create_visita(
    visita_in: VisitaCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Agenda uma nova Visita / Ordem de Serviço."""
    # 1. Verifica se o Cliente existe
    cliente = await db.get(Cliente, visita_in.cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    # 2. Verifica se o Serviço existe
    servico = await db.get(Servico, visita_in.servico_id)
    if not servico:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")

    nova_visita = Visita(**visita_in.model_dump())
    db.add(nova_visita)
    await db.commit()
    await db.refresh(nova_visita)
    return nova_visita


@router.get("/", response_model=list[VisitaResponse])
async def list_visitas(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 100
):
    """Lista as visitas agendadas e realizadas."""
    from app.models.usuario import RoleUsuario

    stmt = (
        select(Visita)
        .options(selectinload(Visita.cliente), selectinload(Visita.servico))
    )

    if current_user.role == RoleUsuario.cliente:
        # Se for cliente, filtra para mostrar APENAS as visitas que o cliente_id seja 
        # aquele associado ao usuario_id deste cliente.
        stmt = stmt.join(Cliente).where(Cliente.usuario_id == current_user.id)

    stmt = stmt.offset(skip).limit(limit).order_by(Visita.data_agendada.asc())
    
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{visita_id}", response_model=VisitaResponse)
async def get_visita(
    visita_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Busca os detalhes de uma visita específica."""
    visita = await db.get(Visita, visita_id)
    if not visita:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
    return visita


@router.patch("/{visita_id}", response_model=VisitaResponse)
async def update_visita(
    visita_id: UUID,
    visita_in: VisitaUpdate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Atualiza o status, o técnico ou a data de uma visita."""
    visita = await db.get(Visita, visita_id)
    if not visita:
        raise HTTPException(status_code=404, detail="Visita não encontrada")

    update_data = visita_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(visita, key, value)

    await db.commit()
    await db.refresh(visita)
    return visita


@router.delete("/{visita_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_visita(
    visita_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Cancela/Deleta uma visita permanentemente."""
    visita = await db.get(Visita, visita_id)
    if not visita:
        raise HTTPException(status_code=404, detail="Visita não encontrada")

    await db.delete(visita)
    await db.commit()


from fastapi.responses import Response
from app.services.pdf_service import gerar_os_pdf


@router.get("/{visita_id}/pdf", response_class=Response)
async def download_visita_pdf(
    visita_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Gera e retorna o PDF da Ordem de Serviço."""
    # Precisamos carregar a Visita e juntar as informações do Cliente e Serviço associados a ela
    # O selectinload faz o JOIN automático para não tomarmos erro de Lazy Loading
    stmt = (
        select(Visita)
        .where(Visita.id == visita_id)
        .options(selectinload(Visita.cliente), selectinload(Visita.servico))
    )
    result = await db.execute(stmt)
    visita = result.scalar_one_or_none()

    if not visita:
        raise HTTPException(status_code=404, detail="Visita não encontrada")

    # Gera o arquivo binário em memória
    pdf_bytes = gerar_os_pdf(visita, visita.cliente, visita.servico)

    # Devolve para o navegador informando que o conteúdo é um Arquivo PDF (não um JSON)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=OS_Protecta_{visita.id}.pdf"
        }
    )
