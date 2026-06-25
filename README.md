# NUTRATIVA

Esta pasta contem a versao local do NUTRATIVA, uma plataforma de operacao e acompanhamento nutricional com frontend em React/Vite e backend local em Express.

## Como executar

```bash
npm install
npm run dev
```

O comando `npm run dev` inicia:

- API local: `http://127.0.0.1:3001`
- Frontend: `http://127.0.0.1:5180/#/login`

Endereco local fixo:

- O frontend agora fica travado em `http://127.0.0.1:5180/#/login`.
- A API local continua fixa em `http://127.0.0.1:3001`.
- Se a porta `5180` ja estiver em uso, o Vite passa a exibir erro de inicializacao em vez de trocar automaticamente para outra porta. Isso evita que o link mude a cada reinicio.
- No navegador, use apenas `http://127.0.0.1:5180/#/login`. O frontend encaminha automaticamente as chamadas `/api` para a porta `3001`.

## Acesso local

Credenciais padrao da autenticacao local:

- Login: `admin`
- Senha: `123456`

Depois do login, o frontend armazena o token localmente e usa esse token para acessar a API protegida.

## Scripts disponiveis

- `npm run dev`: sobe frontend e backend ao mesmo tempo.
- `npm run web`: sobe apenas o frontend com Vite.
- `npm run api`: sobe apenas a API local.
- `npm run build`: gera a build de producao do frontend.
- `npm run preview`: publica a build localmente para conferencia.
- `npm run reset:data`: recria a base SQLite local a partir de `server/data/initial-state.json`.
- `npm run capture`: executa o script de exploracao automatizada configurado no projeto.

## Autenticacao da API

Rotas de autenticacao:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Exemplo de login:

```bash
curl -X POST http://127.0.0.1:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"login\":\"admin\",\"password\":\"123456\"}"
```

A resposta retorna um token Bearer e os dados do usuario autenticado. As demais rotas `/api/*`, com excecao de `/api/health` e `/api/auth/login`, exigem esse token no header:

```text
Authorization: Bearer SEU_TOKEN
```

## API local

Rota publica:

- `GET /api/health`

Rota protegida de bootstrap:

- `GET /api/bootstrap`

Recursos com `GET`, `POST`, `PUT /:id` e `DELETE /:id`:

- `/api/schools`
- `/api/students`
- `/api/users`
- `/api/years`
- `/api/campaigns`
- `/api/nutritionists`
- `/api/evaluations`

Configuracoes e suporte:

- `PUT /api/settings`
- `POST /api/reset`

## Escopo implementado

- Login com autenticacao real por login e senha.
- Persistencia local de sessao no frontend.
- Dashboard administrativo com cards, grafico e tabela Top 5.
- CRUD local de Escolas, Alunos, Usuarios, Anos Letivos, Campanhas e Vinculo.
- Telas de lista, cadastro, edicao, exclusao e detalhe de escola.
- Perfil do usuario autenticado.
- Mapa preparado para dados reais cadastrados.
- Relatorios nutricionais: escolas, avaliacoes, individual e campanha.
- Configuracoes do sistema, incluindo branding, organizacao, integracoes, cores e editor de banner.

## Estrutura principal

- `src/`: aplicacao frontend React.
- `server/`: API local Express e arquivos de dados.
- `server/data/app.sqlite`: base SQLite local usada pela API.
- `server/data/store.json`: espelho JSON automatico da base atual, mantido por compatibilidade e backup rapido.
- `server/data/store.pre-sqlite-backup.json`: backup do JSON original criado na primeira migracao.
- `server/data/initial-state.json`: estado inicial usado para restauracao.
- `scripts/`: automacoes auxiliares com Playwright.

## Arquitetura

Visao geral da aplicacao:

- Frontend: SPA em React com roteamento por `hash` e interface servida pelo Vite.
- Backend: API REST em Express responsavel por autenticacao, bootstrap e CRUDs locais.
- Persistencia de dados: SQLite local em `server/data/app.sqlite`, com espelho JSON em `server/data/store.json`.
- Persistencia de sessao: token salvo no `localStorage` do navegador e sessoes mantidas em memoria no backend.

Fluxo resumido:

1. o usuario acessa `/#/login`;
2. o frontend envia `login` e `password` para `POST /api/auth/login`;
3. a API valida as credenciais e retorna um token Bearer;
4. o frontend salva o token no navegador;
5. as chamadas seguintes para `/api/*` enviam `Authorization: Bearer ...`;
6. ao recarregar a pagina, o frontend consulta `GET /api/auth/me` para restaurar a sessao.

## Banco de dados local

Persistencia atual:

- A API usa SQLite local por padrao.
- Na primeira inicializacao, os dados existentes em `server/data/store.json` sao importados automaticamente para `server/data/app.sqlite`.
- O arquivo `server/data/store.json` continua sendo atualizado como espelho da base para evitar perda de historico e facilitar inspecoes manuais.
- O primeiro JSON encontrado antes da migracao e preservado em `server/data/store.pre-sqlite-backup.json`.

Configuracao padrao:

- `DB_CLIENT=sqlite`
- `SQLITE_FILE=server/data/app.sqlite`

Preparacao para producao com MySQL:

- A camada de persistencia foi isolada em `server/db/`.
- O servidor agora usa `knex`, com drivers instalados para `sqlite3` e `mysql2`.
- A estrutura de tabelas usada pela API e compativel com a futura troca de `DB_CLIENT` para MySQL, reduzindo a mudanca para configuracao e provisionamento do banco.

Variaveis previstas para MySQL:

- `DB_CLIENT=mysql2`
- `MYSQL_HOST`
- `MYSQL_PORT`
- `MYSQL_USER`
- `MYSQL_PASSWORD`
- `MYSQL_DATABASE`

## Fluxo de sessao

Comportamento atual da autenticacao:

- O backend aceita o usuario local configurado em `server/index.js`.
- O token de sessao e gerado no login e armazenado apenas em memoria no servidor.
- Se o processo da API for reiniciado, as sessoes anteriores deixam de existir.
- Quando a API responde `401`, o frontend limpa a sessao local e redireciona para o login.
- O logout invalida o token atual no backend e remove o token salvo no navegador.

Configuracao atual do usuario local:

- Login padrao: `admin`
- Senha padrao: `123456`

Se quiser alterar essas credenciais sem mexer no codigo, a API tambem aceita:

- `AUTH_LOGIN`
- `AUTH_PASSWORD`

Exemplo:

```bash
AUTH_LOGIN=gestor AUTH_PASSWORD=segredo npm run api
```

## Exemplos com fetch

Login:

```js
const loginResponse = await fetch("http://127.0.0.1:3001/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ login: "admin", password: "123456" }),
});

const { token, user } = await loginResponse.json();
console.log(token, user);
```

Consulta autenticada:

```js
const bootstrapResponse = await fetch("http://127.0.0.1:3001/api/bootstrap", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const bootstrap = await bootstrapResponse.json();
console.log(bootstrap.dashboard);
```

Logout:

```js
await fetch("http://127.0.0.1:3001/api/auth/logout", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## Observacoes de desenvolvimento

- A autenticacao atual e simples e pensada para ambiente local.
- As sessoes nao sobrevivem ao reinicio do backend porque ficam em memoria.
- Os dados de CRUD sobrevivem no arquivo SQLite local `server/data/app.sqlite`.
- `server/data/store.json` e apenas o espelho automatico da base.
- `npm run reset:data` recria a base SQLite e o espelho JSON sem alterar o usuario fixo de autenticacao.

## Observacoes

Esta base reproduz a experiencia visual e os fluxos principais do sistema com backend local proprio.

O codigo-fonte privado do sistema original nao pode ser extraido a partir do acesso web. Para incorporar o sistema original, adicione o repositorio, zip ou backup correspondente nesta pasta para analise e integracao. Ate la, esta base segue como uma recriacao limpa, sem dependencias do codigo privado original.
