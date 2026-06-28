"""
Pacote de models do banco de dados.

Importamos todos os models aqui para que, ao importar este pacote,
o SQLAlchemy registre todas as tabelas no Base.metadata.
Isso é essencial para o Alembic conseguir gerar as migrations automaticamente.
"""
from app.models.base import ModelBase
from app.models.usuario import Usuario
from app.models.cliente import Cliente
from app.models.servico import Servico
from app.models.visita import Visita
from app.models.cobranca import Cobranca

# Facilita a importação: from app.models import Usuario, Cliente...
__all__ = [
    "ModelBase",
    "Usuario",
    "Cliente",
    "Servico",
    "Visita",
    "Cobranca",
]
