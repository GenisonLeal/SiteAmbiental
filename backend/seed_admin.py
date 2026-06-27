"""
Script de Seed para o banco de dados.
Gera o primeiro usuário administrador do sistema.
Execute apenas uma vez no ambiente de produção/desenvolvimento.
"""
import asyncio

from sqlalchemy import select

from app.auth.security import get_password_hash
from app.database import AsyncSessionLocal
from app.models.usuario import RoleUsuario, Usuario


async def create_first_admin():
    async with AsyncSessionLocal() as db:
        # Verifica se já existe um admin
        stmt = select(Usuario).where(Usuario.role == RoleUsuario.admin)
        result = await db.execute(stmt)
        admin_existente = result.scalar_one_or_none()

        if admin_existente:
            print(f"⚠️ Já existe um administrador cadastrado: {admin_existente.email}")
            return

        # Cria o primeiro admin
        print("Criando usuario administrador inicial...")
        novo_admin = Usuario(
            nome="Administrador do Sistema",
            email="admin@protecta.com",
            senha_hash=get_password_hash("admin123"),  # Senha provisória forte recomendada em PRD
            role=RoleUsuario.admin,
            ativo=True,
        )

        db.add(novo_admin)
        await db.commit()
        print("Administrador criado com sucesso!")
        print("E-mail: admin@protecta.com")
        print("Senha: admin123")


if __name__ == "__main__":
    asyncio.run(create_first_admin())
