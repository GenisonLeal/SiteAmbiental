"""
Model SQLAlchemy para a entidade Cobrança.
Representa o financeiro de cada visita realizada.
Relação 1:1 com Visita — criada após a conclusão do serviço.
"""
import enum
import uuid
from datetime import date

from sqlalchemy import Date, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ModelBase


class StatusCobranca(str, enum.Enum):
    """Ciclo de vida do pagamento de uma cobrança."""

    pendente = "pendente"    # Aguardando pagamento
    pago = "pago"            # Pagamento confirmado
    vencido = "vencido"      # Data de vencimento passou sem pagamento
    cancelado = "cancelado"  # Cobrança anulada


class FormaPagamento(str, enum.Enum):
    """Formas de pagamento aceitas."""

    dinheiro = "dinheiro"
    pix = "pix"
    cartao_credito = "cartao_credito"
    cartao_debito = "cartao_debito"
    boleto = "boleto"
    transferencia = "transferencia"


class Cobranca(ModelBase):
    """
    Tabela: cobrancas

    Registra o valor e o status de pagamento de cada visita.
    Criada quando a visita é concluída ou ao agendar (conforme fluxo da empresa).
    """

    __tablename__ = "cobrancas"

    # FK para visita — CASCADE: excluir a visita exclui a cobrança junto
    visita_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("visitas.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # Garante a relação 1:1 no banco de dados
        index=True,
    )

    valor: Mapped[object] = mapped_column(
        Numeric(10, 2),
        nullable=False,
    )

    # Usa date (sem hora) pois vencimento é por dia, não por horário
    data_vencimento: Mapped[date] = mapped_column(Date, nullable=False)

    data_pagamento: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,  # Preenchido somente quando o pagamento for confirmado
    )

    status: Mapped[StatusCobranca] = mapped_column(
        Enum(StatusCobranca, name="status_cobranca"),
        default=StatusCobranca.pendente,
        nullable=False,
        index=True,  # Filtros por status são frequentes no painel financeiro
    )

    forma_pagamento: Mapped[FormaPagamento | None] = mapped_column(
        Enum(FormaPagamento, name="forma_pagamento"),
        nullable=True,  # Preenchido quando o pagamento for registrado
    )

    observacoes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # ── Relacionamento ────────────────────────────────────────────────────────
    visita: Mapped["Visita"] = relationship(  # noqa: F821
        "Visita",
        back_populates="cobranca",
    )

    def __repr__(self) -> str:
        return f"<Cobranca valor={self.valor} status={self.status}>"
