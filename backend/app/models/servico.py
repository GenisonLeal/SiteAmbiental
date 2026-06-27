"""
Model SQLAlchemy para a entidade Serviço.
Representa o catálogo de serviços oferecidos pela Protecta Dedetização.
"""
from decimal import Decimal

from sqlalchemy import Boolean, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ModelBase


class Servico(ModelBase):
    """
    Tabela: servicos

    Catálogo dos serviços disponíveis para agendamento:
      - Desinsetização (Dedetização)
      - Desratização
      - Descupinização
      - Higienização de Reservatório de Água
    """

    __tablename__ = "servicos"

    nome: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        unique=True,  # Não permite dois serviços com o mesmo nome
    )

    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Numeric(10, 2): até 10 dígitos no total, 2 casas decimais
    # Evita o problema de ponto flutuante (Float) em valores monetários
    preco_base: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2),
        nullable=True,  # Preço pode variar por cliente — aqui é só uma referência
    )

    duracao_estimada_horas: Mapped[int | None] = mapped_column(nullable=True)

    ativo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        # Soft-disable: desativar preserva o histórico de visitas existentes
    )

    # ── Relacionamento ────────────────────────────────────────────────────────
    # ondelete="RESTRICT" (definido na FK de Visita) impede excluir um serviço
    # que ainda possui visitas vinculadas
    visitas: Mapped[list["Visita"]] = relationship(  # noqa: F821
        "Visita",
        back_populates="servico",
    )

    def __repr__(self) -> str:
        return f"<Servico nome={self.nome} ativo={self.ativo}>"
