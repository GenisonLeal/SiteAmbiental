# ESTUDO FASE 4: Construção do Frontend Administrativo com React

Este documento explica de forma didática as decisões de arquitetura e tecnologias aplicadas na construção da Fase 4 do projeto: o Painel Administrativo em React.

---

### 1. Por que decidimos usar "Vanilla CSS" em vez de Tailwind ou Bootstrap?
**O Desafio:** Frameworks de CSS como Bootstrap são pesados e muitas vezes deixam os sites "com cara de sistema genérico". Já o Tailwind, embora poderoso, polui muito o código HTML/JSX com dezenas de classes na mesma linha (`class="flex justify-center items-center p-4 bg-green-500 rounded-lg shadow-md..."`).
**A Solução:** Optamos pelo **Vanilla CSS** (CSS puro). Nós criamos um arquivo `global.css` que contém as *Variáveis Nativas* do CSS (ex: `--color-primary: #10b981;`). 
**Vantagem Didática:** O JSX do React fica limpo e legível. Se precisarmos mudar o tom de verde de todo o sistema no futuro, basta alterar a variável `--color-primary` em um único lugar no `global.css` e o sistema inteiro se atualiza automaticamente, sem precisarmos caçar classes espalhadas.

### 2. O que é um "Interceptor" do Axios e por que ele é crucial para a segurança?
**O Desafio:** Nosso FastAPI usa `OAuth2` com JWT. Isso significa que, para acessar rotas seguras (como Criar Cliente), o Frontend precisa enviar o Token de Autenticação num cabeçalho (`Authorization: Bearer <token>`) em *toda santa requisição*. Lembrar de programar esse envio manualmente toda vez que usamos `axios.get` ou `axios.post` daria muito trabalho e causaria falhas de segurança por esquecimento.
**A Solução:** Em `src/services/api.js`, nós configuramos os **Interceptadores (Interceptors)**. Eles funcionam como "guardas de fronteira" na saída do Frontend.
1. Quando o código tenta mandar uma requisição para a API, o Interceptor "sequestra" a requisição, pega o token salvo no `localStorage` e injeta no cabeçalho antes dela sair.
2. Na volta, se o Backend responder com "Erro 401: Não Autorizado" (indicando que o token venceu), o Interceptor intercepta a resposta e "desloga" o usuário automaticamente, mandando-o para a tela de Login.

### 3. Como funciona a mágica do Roteamento Seguro (Protected Routes)?
**O Desafio:** Se o usuário digitar na barra de URL do navegador `http://localhost:5173/dashboard/clientes`, como o React impede ele de ver a tela se não estiver logado?
**A Solução:** Criamos o componente `<ProtectedRoute />`. Ele engloba todas as rotas do dashboard no nosso `App.jsx`. O papel dele é simples:
* "Tem token no localStorage?" -> Deixa o componente interno (Outlet) ser renderizado.
* "Não tem token?" -> Retorna um `<Navigate to="/login" />`, que imediatamente chuta o usuário de volta para a tela de login.

### 4. Por que usamos "Modais" em vez de páginas separadas para Criar/Editar?
**O Desafio:** Se ao clicar em "Novo Cliente" a página precisasse mudar para `/clientes/novo`, o navegador perderia a listagem da tabela. O usuário teria que voltar e recarregar a tabela para ver o resultado.
**A Solução:** O padrão de Design UI que escolhemos usa Modais flutuantes. O Modal é carregado por cima da tabela. Quando o usuário clica em Salvar:
1. O Modal dispara a API para salvar via Axios.
2. Ao receber "Sucesso" da API, o Modal fecha.
3. O Modal avisa a listagem pai (`onSaveSuccess`) que ela deve buscar os dados na API novamente (`fetch()`).
4. A tabela se atualiza em tempo real sem o usuário nunca sair da tela. Fluidez total!

### 5. Como o Select de "Visita/OS" ou "Cliente" funcionam sozinhos no Modal?
**A Solução:** No React, o componente executa o bloco `useEffect(..., [])` logo após "nascer" na tela. Quando você abre o Modal de Cobrança, por exemplo, o `useEffect` dele envia silenciosamente requisições GET para a nossa API (`/api/visitas/`).
Ele pega esse Array de resultados, guarda numa variável de estado (`useState`) chamada `visitas`, e nós usamos um `.map()` para transformar esse Array em várias `<option>` dentro do `<select>` HTML.
Dessa forma, os formulários nunca têm dados engessados; eles estão sempre lendo a realidade do Banco de Dados.

### 6. Como conseguimos forçar o "Download" de um PDF que foi gerado pelo Celery?
**O Desafio:** A nossa API `/api/visitas/{id}/pdf` não retorna um texto JSON. Ela retorna os "bytes crus" de um arquivo PDF (Blob). O navegador não sabe o que fazer com bytes crus via requisição AJAX (Axios).
**A Solução:** No `VisitasList.jsx`, a função `downloadPDF` faz três truques geniais em sequência:
1. Pede pro Axios entender a resposta como um arquivo (`responseType: 'blob'`).
2. Transforma esses bytes na memória RAM em uma "URL de mentira" no navegador (`window.URL.createObjectURL`).
3. Cria um elemento link `<a>` temporário de forma invisível, aponta a `href` dele para a URL de mentira, adiciona a tag `download="Nome_do_Arquivo.pdf"`, simula o *clique* de um humano via JavaScript (`link.click()`) e, imediatamente depois, destrói o link para não sujar a tela (`link.remove()`).

### 7. Resumo da Correção Crítica (O Erro 422 - Unprocessable Entity)
Durante o desenvolvimento, tivemos um "crash". O Frontend tentou enviar uma variável chamada `data_visita` e o Pydantic do Backend rejeitou (Erro 422), porque a regra do schema dizia que o nome obrigatório era `data_agendada`. O mesmo ocorreu com `status` e `status_pagamento`.
**Lição de Ouro:** O `BaseModel` do Pydantic (Backend) e as chaves do Objeto no Axios (Frontend) **precisam ser espelhos perfeitos**. Se o Backend espera "status", você não pode enviar "status_pagamento". Quando houver falhas do tipo 422, verifique sempre qual é o "nome exato da chave" que está faltando ou sobrando na ponte entre Axios e FastAPI.
