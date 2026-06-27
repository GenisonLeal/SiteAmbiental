"""
Model SQLAlchemy para a entidade Visita (Ordem de Serviço).
Registra cada atendimento realizado pela empresa no cliente.
É o model central do sistema — conecta Cliente, Serviço e Técnico.
"""
import enum
import uuid

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ModelBase


class StatusVisita(str, enum.Enum):
    """Ciclo de vida de uma Ordem de Serviço."""

    agendada = "agendada"
    em_andamento = "em_andamento"
    concluida = "concluida"
    cancelada = "cancelada"


class Visita(ModelBase):
    """
    Tabela: visitas

    Representa um agendamento/execução de serviço.
    Cada visita pertence a um cliente, tem um serviço e opcionalmente um técnico.

    Comportamento das FKs ao excluir registros relacionados:
      - Cliente excluído → visitas excluídas (CASCADE)
      - Serviço excluído → bloqueado se tiver visitas (RESTRICT)
      - Técnico excluído → tecnico_id vira NULL (SET NULL)
    """

    __tablename__ = "visitas"

    # ── Chaves estrangeiras ───────────────────────────────────────────────────
    cliente_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("clientes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    servico_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("servicos.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Técnico é opcional: visita pode ser criada sem técnico definido ainda
    tecnico_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # ── Campos da visita ──────────────────────────────────────────────────────
    data_agendada: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    data_realizada: Mapped[object | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,  # Preenchido apenas quando a visita for concluída
    )

    status: Mapped[StatusVisita] = mapped_column(
        Enum(StatusVisita, name="status_visita"),
        default=StatusVisita.agendada,
        nullable=False,
        index=True,  # Filtros por status são frequentes no painel
    )

    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Número sequencial legível: "OS-2025-0001"
    numero_os: Mapped[str | None] = mapped_column(
        String(20),
        unique=True,
        nullable=True,
    )

    # URL do certificado/PDF gerado pelo ReportLab e salvo no Supabase Storage
    certificado_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ── Relacionamentos ───────────────────────────────────────────────────────
    cliente: Mapped["Cliente"] = relationship(  # noqa: F821
        "Cliente",
        back_populates="visitas",
    )

    servico: Mapped["Servico"] = relationship(  # noqa: F821
        "Servico",
        back_populates="visitas",
    )

    tecnico: Mapped["Usuario | None"] = relationship(  # noqa: F821
        "Usuario",
        back_populates="visitas",
        foreign_keys=[tecnico_id],
    )

    # uselist=False: relação 1:1 — cada visita tem no máximo uma cobrança
    cobranca: Mapped["Cobranca | None"] = relationship(  # noqa: F821
        "Cobranca",
        back_populates="visita",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Visita os={self.numero_os} status={self.status}>"
