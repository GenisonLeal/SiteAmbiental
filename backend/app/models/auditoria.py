from datetime import datetime
from sqlalchemy import String, DateTime, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import ModelBase

class AuditoriaLog(ModelBase):
    """
    Tabela: auditoria_logs
    Armazena o histórico de ações sensíveis (criação, edição, exclusão).
    """
    __tablename__ = "auditoria_logs"

    # Quem fez a ação (salvamos o e-mail em vez do ID para manter o histórico caso o usuário seja deletado)
    usuario_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    
    # O que foi feito: CREATE, UPDATE, DELETE, etc.
    acao: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    
    # Onde foi feito (ex: 'Cliente', 'Visita', 'Usuario')
    entidade: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    
    # O ID do item que foi alterado (se aplicável)
    entidade_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    
    # Detalhes adicionais (o que mudou, motivo, etc.)
    detalhes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    
    # Quando foi feito
    data_hora: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def __repr__(self) -> str:
        return f"<AuditoriaLog acao={self.acao} entidade={self.entidade} por={self.usuario_email}>"
