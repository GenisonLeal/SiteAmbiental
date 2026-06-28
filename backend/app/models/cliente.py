"""
Model SQLAlchemy para a entidade Cliente.
Representa pessoas físicas ou jurídicas que contratam os serviços.
"""
import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
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
    endereco: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cidade: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # FK para o Usuario que representa este cliente no sistema
    usuario_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True,
        unique=True,  # 1 Cliente = 1 Usuario de login
        index=True,
    )

    observacoes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ── Relacionamento ────────────────────────────────────────────────────────
    # cascade="all, delete-orphan": ao excluir um cliente, suas visitas
    # são excluídas automaticamente (integridade referencial no nível ORM)
    visitas: Mapped[list["Visita"]] = relationship(  # noqa: F821
        "Visita",
        back_populates="cliente",
        cascade="all, delete-orphan",
    )

    # Relacionamento 1:1 com Usuário (para acesso ao painel do cliente)
    usuario: Mapped["Usuario"] = relationship(  # noqa: F821
        "Usuario",
        foreign_keys=[usuario_id],
    )

    def __repr__(self) -> str:
        return f"<Cliente nome={self.nome} cidade={self.cidade}>"
