"""
Classe base abstrata para todos os models do sistema.
Define os campos comuns presentes em todas as tabelas:
  - id: UUID gerado automaticamente
  - criado_em: timestamp de criação
  - atualizado_em: timestamp de última atualização
"""
import uuid
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ModelBase(Base):
    """
    Herdar esta classe em vez de Base diretamente.
    O SQLAlchemy não cria tabela para classes com __abstract__ = True.
    """

    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,          # Gerado pelo Python ao criar o objeto
        server_default=func.gen_random_uuid(),  # Fallback gerado pelo PostgreSQL
    )

    criado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),   # Preenchido automaticamente pelo banco
        nullable=False,
    )

    atualizado_em: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),         # Atualizado automaticamente a cada UPDATE
        nullable=False,
    )
