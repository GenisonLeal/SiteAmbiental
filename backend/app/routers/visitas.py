"""
Rotas para gestão de Visitas / Ordens de Serviço (CRUD).
"""
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi.responses import Response

from app.auth.dependencies import get_current_user, require_internal_user
from app.database import get_db
from app.models.cliente import Cliente
from app.models.servico import Servico
from app.models.usuario import Usuario, RoleUsuario
from app.models.visita import Visita
from app.schemas.visita import VisitaCreate, VisitaResponse, VisitaUpdate
from app.services.pdf_service import gerar_os_pdf
from app.services.email_service import send_agendamento_email, send_conclusao_email
from app.services.auditoria_service import registrar_log


router = APIRouter(
    prefix="/api/visitas",
    tags=["Visitas"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/", response_model=VisitaResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_internal_user)])
async def create_visita(
    visita_in: VisitaCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Agenda uma nova Visita / Ordem de Serviço."""
    cliente = await db.get(Cliente, visita_in.cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    servico = await db.get(Servico, visita_in.servico_id)
    if not servico:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")

    nova_visita = Visita(**visita_in.model_dump())
    db.add(nova_visita)
    await registrar_log(db, current_user.email, "CREATE", "Visita", detalhes={"cliente_id": str(cliente.id), "servico": servico.nome})
    await db.commit()
    
    stmt = select(Visita).options(selectinload(Visita.cliente), selectinload(Visita.servico)).where(Visita.id == nova_visita.id)
    result = await db.execute(stmt)
    visita_criada = result.scalar_one()

    # Dispara e-mail de agendamento se o cliente tiver e-mail
    if cliente.email:
        data_formatada = visita_criada.data_agendada.strftime("%d/%m/%Y às %H:%M") if visita_criada.data_agendada else "Data a definir"
        send_agendamento_email(cliente.email, data_formatada, servico.nome)

    return visita_criada


@router.get("/", response_model=list[VisitaResponse])
async def list_visitas(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)],
    skip: int = 0,
    limit: int = 100
):
    """Lista as visitas agendadas e realizadas."""
    stmt = (
        select(Visita)
        .options(selectinload(Visita.cliente), selectinload(Visita.servico))
    )

    if current_user.role == RoleUsuario.cliente:
        stmt = stmt.join(Cliente).where(Cliente.usuario_id == current_user.id)

    stmt = stmt.offset(skip).limit(limit).order_by(Visita.data_agendada.asc())
    
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{visita_id}", response_model=VisitaResponse)
async def get_visita(
    visita_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Busca os detalhes de uma visita específica."""
    stmt = select(Visita).options(selectinload(Visita.cliente), selectinload(Visita.servico)).where(Visita.id == visita_id)
    result = await db.execute(stmt)
    visita = result.scalar_one_or_none()
    
    if not visita:
        raise HTTPException(status_code=404, detail="Visita não encontrada")
        
    # Proteção IDOR
    if current_user.role == RoleUsuario.cliente:
        if visita.cliente.usuario_id != current_user.id:
            raise HTTPException(status_code=403, detail="Acesso negado a dados de outra OS.")

    return visita


@router.patch("/{visita_id}", response_model=VisitaResponse, dependencies=[Depends(require_internal_user)])
async def update_visita(
    visita_id: UUID,
    visita_in: VisitaUpdate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Atualiza o status, o técnico ou a data de uma visita."""
    stmt = select(Visita).options(selectinload(Visita.cliente), selectinload(Visita.servico)).where(Visita.id == visita_id)
    result = await db.execute(stmt)
    visita = result.scalar_one_or_none()

    if not visita:
        raise HTTPException(status_code=404, detail="Visita não encontrada")

    status_anterior = visita.status
    
    update_data = visita_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(visita, key, value)

    await registrar_log(db, current_user.email, "UPDATE", "Visita", visita_id, detalhes=update_data)
    await db.commit()
    await db.refresh(visita)

    # Dispara e-mail se o status mudou para 'concluida'
    if status_anterior != "concluida" and visita.status == "concluida":
        if visita.cliente.email:
            send_conclusao_email(visita.cliente.email, visita.servico.nome)

    return visita


@router.delete("/{visita_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_internal_user)])
async def delete_visita(
    visita_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Cancela/Deleta uma visita permanentemente."""
    visita = await db.get(Visita, visita_id)
    if not visita:
        raise HTTPException(status_code=404, detail="Visita não encontrada")

    await db.delete(visita)
    await registrar_log(db, current_user.email, "DELETE", "Visita", visita_id, detalhes={"status_anterior": visita.status})
    await db.commit()


from fastapi.responses import Response, RedirectResponse
from app.services.storage_service import upload_file_to_s3

@router.get("/{visita_id}/pdf")
async def download_visita_pdf(
    visita_id: UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_user)]
):
    """Gera o PDF da Ordem de Serviço, salva no S3 e redireciona."""
    stmt = (
        select(Visita)
        .where(Visita.id == visita_id)
        .options(selectinload(Visita.cliente), selectinload(Visita.servico))
    )
    result = await db.execute(stmt)
    visita = result.scalar_one_or_none()

    if not visita:
        raise HTTPException(status_code=404, detail="Visita não encontrada")

    # Proteção IDOR
    if current_user.role == RoleUsuario.cliente:
        if visita.cliente.usuario_id != current_user.id:
            raise HTTPException(status_code=403, detail="Acesso negado a PDFs de outra OS.")

    # Gera o PDF em memória (bytes)
    pdf_bytes = gerar_os_pdf(visita, visita.cliente, visita.servico)
    file_name = f"OS_Protecta_{visita.id}.pdf"

    # Tenta fazer upload para o S3
    s3_url = upload_file_to_s3(pdf_bytes, file_name)

    # Se a nuvem estiver configurada e o upload foi sucesso, redireciona o cliente para o S3
    if s3_url:
        return RedirectResponse(url=s3_url)

    # Fallback: Se o S3 não estiver configurado no .env, baixa direto do backend
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={file_name}"
        }
    )
