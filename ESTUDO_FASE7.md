# ESTUDO FASE 7: Segurança Avançada e Automação de E-mails 🛡️✉️

Nesta fase, o foco principal foi preparar o sistema para um ambiente de produção real, garantindo que os dados dos clientes e do sistema estejam devidamente isolados, protegidos contra abusos e que a comunicação automatizada seja profissional.

## 1. Controle de Acesso Baseado em Perfis (RBAC)
Foi implementada uma trava de segurança em todas as rotas sensíveis e de mutação (`POST`, `PATCH`, `DELETE`). 
- **O Problema Resolvido:** Antes, se um usuário `cliente` descobrisse o endpoint da API, ele poderia enviar uma requisição maliciosa para alterar um status de serviço ou criar uma visita no nome de outra pessoa.
- **A Solução:** Foram criadas dependências no backend (`require_internal_user` e `require_admin_or_atendente`). Agora, qualquer tentativa de alteração de sistema por um cliente resulta em `HTTP 403 - Forbidden`.

## 2. Prevenção contra IDOR (Insecure Direct Object Reference)
- **O Problema Resolvido:** Nas rotas de consulta (`GET /visitas/{id}` e `GET /cobrancas/{id}`), um cliente poderia simplesmente alterar o ID na URL para tentar acessar faturas ou ordens de serviço de outros clientes.
- **A Solução:** O sistema agora cruza o `usuario_id` do cliente logado com o dono do documento solicitado. Se não for o titular, a resposta é `Acesso negado a dados de outra OS`.

## 3. Política de Senhas Fortes (Padrão OWASP)
- A validação de senhas foi elevada para os padrões de mercado exigidos por auditorias (NIST / OWASP).
- Exigências nativas adicionadas no Pydantic (Backend) e React (Frontend):
  - Mínimo de 8 caracteres.
  - Pelo menos 1 Letra Maiúscula e 1 Minúscula.
  - Pelo menos 1 Número.
  - Pelo menos 1 Caractere Especial (ex: `@$!%*?&`).
- Tokens JWT foram revisados e mantidos com vida útil curta de **15 minutos** (Access Token), garantindo que, mesmo que interceptados, expirem rapidamente.

## 4. Prevenção de Ataques de Força Bruta (Rate Limiting)
- O backend foi integrado à biblioteca `slowapi`, adicionando limites estritos de requisições por IP nas rotas de autenticação.
- **Login (`POST /api/auth/login`):** Limitado a **5 tentativas por minuto** por IP. Previne ataques de dicionário ou força bruta tentando descobrir senhas.
- **Recuperação de Senha (`POST /api/auth/forgot-password`):** Limitada a **3 tentativas por minuto**. Previne que robôs usem o servidor de e-mail como vetor de Spam e impede "enumeração de usuários".

## 5. Automação de E-mails e Identidade Visual (HTML)
O sistema agora envia e-mails transacionais não apenas como texto puro, mas utilizando um template HTML responsivo, limpo e profissional, utilizando as cores da marca (Verde Protecta).
- **Gatilho 1 (Agendamento):** Dispara `send_agendamento_email` informando data, hora e serviço quando o atendente cria uma OS.
- **Gatilho 2 (Conclusão):** Dispara `send_conclusao_email` como agradecimento quando a OS é atualizada para o status `concluida`.
- **Gatilho 3 (Faturas):** Dispara `send_cobranca_email` com destaque para o Valor e Data de Vencimento quando um boleto é gerado.
- **Recuperação de Senha:** Botão verde chamativo guiando o cliente para a troca de senha segura.

### Conclusão da Fase 7
O sistema está funcional, automatizado e com os buracos de segurança (que são comuns em MVPs) devidamente fechados. A arquitetura (FastAPI + React) está pronta para ser encapsulada e enviada para provedores de nuvem (Cloud Deployment) na próxima etapa.
