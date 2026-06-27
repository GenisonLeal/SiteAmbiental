"""
Model SQLAlchemy para a entidade Usuário.
Representa os colaboradores que acessam o painel administrativo.
"""
import enum

from sqlalchemy import Boolean, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ModelBase


class RoleUsuario(str, enum.Enum):
    """
    Perfis de acesso do sistema.
    Herdar de str permite comparar diretamente: role == "admin"
    """

    admin = "admin"          # Acesso total ao sistema
    tecnico = "tecnico"      # Executa visitas, visualiza suas próprias OSs
    atendente = "atendente"  # Gerencia clientes, agendamentos e cobranças


class Usuario(ModelBase):
    """
    Tabela: usuarios

    Armazena os usuários internos da empresa.
    A senha nunca é salva em texto puro — apenas o hash bcrypt.
    """

    __tablename__ = "usuarios"

    nome: Mapped[str] = mapped_column(String(150), nullable=False)

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,      # Não permite dois usuários com o mesmo e-mail
        nullable=False,
        index=True,       # Índice para acelerar buscas por e-mail no login
    )

    # Nunca armazenar a senha em texto puro!
    # A senha é convertida para hash bcrypt antes de salvar (ver auth/security.py)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    role: Mapped[RoleUsuario] = mapped_column(
        Enum(RoleUsuario, name="role_usuario"),  # Cria o tipo ENUM no PostgreSQL
        nullable=False,
        default=RoleUsuario.atendente,           # Perfil padrão ao criar usuário
    )

    ativo: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        # Soft delete: desativar em vez de excluir preserva o histórico de visitas
    )

    # ── Relacionamento ────────────────────────────────────────────────────────
    # Um usuário (técnico) pode ter várias visitas atribuídas a ele
    # "Visita" entre aspas = forward reference (evita importação circular)
    visitas: Mapped[list["Visita"]] = relationship(  # noqa: F821
        "Visita",
        back_populates="tecnico",
        foreign_keys="Visita.tecnico_id",
    )

    def __repr__(self) -> str:
        return f"<Usuario email={self.email} role={self.role}>"
