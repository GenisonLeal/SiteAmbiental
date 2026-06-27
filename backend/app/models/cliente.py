"""
Model SQLAlchemy para a entidade Cliente.
Representa pessoas físicas ou jurídicas que contratam os serviços.
"""
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ModelBase


class Cliente(ModelBase):
    """
    Tabela: clientes

    Endereço desnormalizado (colunas diretas na tabela) pois cada
    cliente possui um único endereço principal de atendimento.
    """

    __tablename__ = "clientes"

    nome: Mapped[str] = mapped_column(String(200), nullable=False)

    # CPF (14 chars: "000.000.000-00") ou CNPJ (18 chars: "00.000.000/0000-00")
    cpf_cnpj: Mapped[str | None] = mapped_column(
        String(18),
        unique=True,
        nullable=True,   # Nem sempre disponível no primeiro contato
    )

    telefone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,      # Facilita busca por e-mail no painel
    )

    # ── Endereço ──────────────────────────────────────────────────────────────
    logradouro: Mapped[str | None] = mapped_column(String(255), nullable=True)
    numero: Mapped[str | None] = mapped_column(String(20), nullable=True)
    complemento: Mapped[str | None] = mapped_column(String(100), nullable=True)
    bairro: Mapped[str | None] = mapped_column(String(100), nullable=True)
    cidade: Mapped[str | None] = mapped_column(String(100), nullable=True)
    estado: Mapped[str | None] = mapped_column(String(2), nullable=True)  # "SP", "RJ"
    cep: Mapped[str | None] = mapped_column(String(9), nullable=True)     # "00000-000"

    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Relacionamento ────────────────────────────────────────────────────────
    # cascade="all, delete-orphan": ao excluir um cliente, suas visitas
    # são excluídas automaticamente (integridade referencial no nível ORM)
    visitas: Mapped[list["Visita"]] = relationship(  # noqa: F821
        "Visita",
        back_populates="cliente",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Cliente nome={self.nome} cidade={self.cidade}>"
