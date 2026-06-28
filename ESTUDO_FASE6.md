# ESTUDO FASE 6: Portal do Cliente e RBAC

Este documento explica de forma didática as soluções arquiteturais adotadas na Fase 6 do projeto, onde transformamos um painel interno num sistema B2B/B2C (Business to Consumer).

---

### 1. O que é RBAC (Role-Based Access Control)?
**O Desafio:** Se darmos um login e senha para um cliente, como garantimos que ele não clique em "Serviços" e apague o catálogo da empresa?
**A Solução:** RBAC significa *Controle de Acesso Baseado em Perfis*. Na tabela `usuarios`, nós tínhamos a coluna `role` (que é um tipo *ENUM*). Nós adicionamos o valor `cliente` nesse Enum.
A partir de agora, o nosso Token JWT não guarda apenas o e-mail do usuário, ele é a identidade do perfil dele. O Frontend e o Backend se comunicam baseados nessa identidade.

### 2. Segurança de Roteamento no React (Frontend)
Na Fase 5, criamos o `<ProtectedRoute />` que apenas olhava: *"Tem token? Pode passar!"*.
Na Fase 6, elevamos o nível. O `ProtectedRoute` agora exige a propriedade `allowedRoles` (perfis permitidos).
```jsx
{/* Rota do Portal do Cliente */}
<Route element={<ProtectedRoute allowedRoles={['cliente']} />}>
   <Route path="/portal" element={<ClientDashboard />} />
</Route>

{/* Rota Administrativa */}
<Route element={<ProtectedRoute allowedRoles={['admin', 'atendente']} />}>
   <Route path="/dashboard" element={<DashboardHome />} />
</Route>
```
Se um `cliente` tentar digitar `/dashboard` na barra de endereços, o React olha o `localStorage`, vê que a role dele é `cliente` e devolve ele imediatamente para o `/portal`.

### 3. A Prevenção de IDOR no Backend (Insecure Direct Object Reference)
**O Desafio Crítico:** E se um cliente logado, que sabe programar, tentar contornar o React e mandar uma requisição HTTP direta para a nossa API `GET /api/cobrancas/`? O React não o impediria, pois a requisição não passaria pela tela. Se a API retornasse todos os boletos do banco de dados, o cliente veria o faturamento da empresa inteira. Esse tipo de vazamento de dados se chama **IDOR**.
**A Solução:** Modificamos nossos *routers* do FastAPI (`visitas.py` e `cobrancas.py`). Antes de disparar a busca, a API verifica quem está pedindo (`current_user`). Se for um cliente, nós anexamos um filtro cravado diretamente no SQL (`.where(Cliente.usuario_id == current_user.id)`).
Desta forma, mesmo que um hacker logado tente buscar "todas as visitas", o próprio Banco de Dados (PostgreSQL) filtrará e entregará **apenas** aquelas em que o `usuario_id` dele está vinculado! O Backend confia apenas no Token JWT.

### 4. A Relação 1:1 e as Chaves Estrangeiras (SQLAlchemy)
Como o Banco de Dados sabe de quem são os boletos?
1. Uma **Cobrança** pertence a uma **Visita** (`visita_id`).
2. Uma **Visita** pertence a um **Cliente** (`cliente_id`).
3. Criamos uma ligação onde o **Cliente** aponta para um **Usuário** de Login (`usuario_id`).
Quando o cliente loga, o Backend usa o `JOIN` do SQLAlchemy para caminhar por essa "corrente" de trás para frente: Ele pega a Cobrança, olha pra Visita dela, olha pro Cliente da Visita e verifica se o `usuario_id` daquele cliente é igual ao `id` de quem fez o login.

### 5. Alembic e os Enums do PostgreSQL
**Curiosidade:** Quando rodamos o Alembic para gerar a migração de banco de dados (`alembic revision --autogenerate`), ele identificou a nova coluna `usuario_id` perfeitamente. No entanto, o Alembic não consegue detectar que adicionamos `"cliente"` ao Enum `RoleUsuario`.
Isso acontece porque o PostgreSQL armazena Enums de forma especial (custom types).
Para resolver isso, nós mesmos escrevemos a instrução de atualização no arquivo de migração gerado:
`op.execute("ALTER TYPE role_usuario ADD VALUE IF NOT EXISTS 'cliente'")`
Assim, ao rodarmos o `upgrade head`, o PostgreSQL aceitou o novo perfil com sucesso e de forma totalmente segura.
