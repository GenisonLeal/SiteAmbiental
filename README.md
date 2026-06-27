# 🛡️ Protecta Dedetização — Sistema Web

> Site institucional e painel administrativo para empresa de controle de pragas urbanas.

---

## 📌 Sobre o Projeto

O **Protecta Dedetização** é um sistema web full-stack desenvolvido para a empresa **Protecta Dedetização**, especializada em:

- 🪲 **Desinsetização (Dedetização)** — Eliminação de insetos
- 🐀 **Desratização** — Controle de roedores
- 🪵 **Descupinização** — Eliminação de cupins
- 💧 **Higienização de Reservatório de Água** — Limpeza e higienização de caixas d'água

O projeto é composto por duas frentes:

1. **Site Institucional** — Apresentação da empresa, serviços e formulário de contato/orçamento (acesso público).
2. **Painel Administrativo** — Sistema CRUD completo para gestão de clientes, visitas, cobranças e usuários (acesso autenticado).

---

## 🚀 Stack Tecnológica

### Frontend
- **React 18** com **Vite**
- **TailwindCSS** para estilização
- **React Router DOM v7** para roteamento
- **Axios** para consumo da API
- **React Hook Form** + **Zod** para formulários e validação
- **Lucide React** para ícones

### Backend
- **FastAPI** (Python)
- **SQLAlchemy** (async) como ORM
- **Alembic** para migrations de banco de dados
- **PostgreSQL** como banco de dados relacional
- **JWT** (python-jose) + **Bcrypt** (passlib) para autenticação
- **Pydantic v2** para validação de schemas

### Cloud & Infraestrutura
- **Supabase** — PostgreSQL gerenciado + Storage para arquivos
- **Vercel** — Deploy do Frontend
- **Railway / Render** — Deploy do Backend
- **GitHub Actions** — CI/CD automatizado

---

## 🏗️ Arquitetura

```
┌────────────────────┐
│  React + Vite      │   (Vercel)
│  Site Público      │
│  Painel Admin      │
└─────────┬──────────┘
          │ REST API (HTTPS)
┌─────────▼──────────┐
│  FastAPI Backend   │   (Railway/Render)
│  Auth JWT          │
│  CRUD Routes       │
└─────────┬──────────┘
          │
┌─────────▼──────────┐
│  Supabase          │
│  PostgreSQL        │
│  Storage           │
└────────────────────┘
```

---

## 📁 Estrutura do Projeto

```
SiteAmbiental/
├── frontend/                   # Aplicação React + Vite
│   ├── src/
│   │   ├── assets/             # Imagens e mídias
│   │   ├── components/
│   │   │   ├── common/         # Componentes reutilizáveis (Button, Input, Modal...)
│   │   │   ├── layout/         # Layouts (Navbar, Footer, AdminLayout, Sidebar)
│   │   │   └── widgets/        # Widgets específicos (ServiceCard, StatsCard...)
│   │   ├── context/            # Context API (Auth, Toast)
│   │   ├── hooks/              # Custom hooks (useAuth, useFetch, useForm)
│   │   ├── pages/              # Páginas da aplicação
│   │   │   ├── Home/           # Site institucional
│   │   │   ├── Login/          # Tela de login
│   │   │   └── Admin/          # Painel administrativo
│   │   ├── routes/             # Configuração de rotas + proteção
│   │   ├── services/           # Axios instance + chamadas à API
│   │   └── utils/              # Formatadores e validadores
│   ├── .env                    # Variáveis de ambiente (local)
│   └── package.json
│
├── backend/                    # API FastAPI
│   ├── app/
│   │   ├── auth/               # JWT, bcrypt, dependências de auth
│   │   ├── models/             # Modelos SQLAlchemy
│   │   ├── schema/             # Schemas Pydantic (request/response)
│   │   ├── routers/            # Endpoints da API
│   │   ├── services/           # Serviços (e-mail, storage)
│   │   ├── config.py           # Configurações da aplicação
│   │   ├── database.py         # Conexão com banco de dados
│   │   └── main.py             # Ponto de entrada FastAPI
│   ├── alembic/                # Migrations do banco de dados
│   ├── .env                    # Variáveis de ambiente (local)
│   └── requirements.txt        # Dependências Python
│
└── README.md
```

---

## ⚙️ Como Rodar Localmente

### Pré-requisitos

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+ (ou conta no [Supabase](https://supabase.com))

---

### Backend

```bash
# Entrar na pasta do backend
cd backend

# Criar e ativar ambiente virtual
python -m venv venv
venv\Scripts\activate         # Windows
# source venv/bin/activate    # Linux/macOS

# Instalar dependências
pip install -r requirements.txt

# Copiar e configurar variáveis de ambiente
copy .env.example .env
# Edite .env com suas credenciais

# Executar migrations
alembic upgrade head

# Iniciar o servidor de desenvolvimento
uvicorn app.main:app --reload --port 8000
```

> A documentação interativa da API estará disponível em: `http://localhost:8000/docs`

---

### Frontend

```bash
# Entrar na pasta do frontend
cd frontend

# Instalar dependências
npm install

# Copiar e configurar variáveis de ambiente
copy .env.example .env
# Edite VITE_API_URL=http://localhost:8000

# Iniciar o servidor de desenvolvimento
npm run dev
```

> A aplicação estará disponível em: `http://localhost:5173`

---

## 🔐 Variáveis de Ambiente

### `backend/.env`

```env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/protecta_db
SECRET_KEY=sua-chave-secreta-super-longa
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=contato@protecta.com.br
SMTP_PASSWORD=senha-do-app
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_KEY=service_role_key
CORS_ORIGINS=["http://localhost:5173"]
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
```

---

## 👥 Perfis de Acesso

| Role | Permissões |
|---|---|
| `admin` | Acesso total: usuários, clientes, visitas, cobranças, serviços |
| `tecnico` | Visualizar e atualizar visitas atribuídas a ele |
| `atendente` | Gerenciar clientes, criar e visualizar visitas e cobranças |

---

## 📋 Módulos do Painel Administrativo

| Módulo | Funcionalidades |
|---|---|
| **Dashboard** | Visão geral: total de clientes, visitas do mês, cobranças pendentes |
| **Clientes** | Listar, cadastrar, editar, excluir, ver histórico de visitas |
| **Visitas / OS** | Agendar, listar por status/data, atualizar andamento |
| **Cobranças** | Registrar, listar, marcar como pago, controle de vencimentos |
| **Serviços** | Cadastrar tipos de serviços com preços base |
| **Usuários** | Gerenciar usuários e permissões (admin only) |

---

## 🌐 Deploy em Produção

### 1. Banco de Dados — Supabase
1. Criar projeto em [supabase.com](https://supabase.com)
2. Copiar `DATABASE_URL` da seção Connection String
3. Executar migrations: `alembic upgrade head`

### 2. Backend — Railway
1. Conectar repositório GitHub ao [railway.app](https://railway.app)
2. Configurar variáveis de ambiente
3. Definir comando de start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 3. Frontend — Vercel
1. Importar repositório em [vercel.com](https://vercel.com)
2. Definir root directory: `frontend`
3. Configurar `VITE_API_URL` com a URL do backend em produção

---

## 🔒 Segurança

- Autenticação via **JWT** com access token de curta duração e refresh token
- Senhas protegidas com **Bcrypt** (cost factor 12)
- Autorização por **roles** no backend (middleware por rota)
- **Rate limiting** no endpoint de login (proteção contra brute-force)
- Variáveis sensíveis nunca commitadas (`.env` no `.gitignore`)
- **CORS** configurado para aceitar apenas origens autorizadas
- **HTTPS** obrigatório em produção

---

## 📄 Licença

Este projeto é de uso **pessoal**. Todos os direitos reservados ao desenvolvedor.

---

*Desenvolvido com 💚 para Protecta Dedetização*
