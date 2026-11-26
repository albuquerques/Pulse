# T0 · Protótipo da sincronização

Código **descartável**. Existe só para provar que a sincronização própria de eventos (decisão
D1 da spec) aguenta escrita offline em dois aparelhos. Sem login, sem visual, sem recorrência.
Nada daqui deve ser importado por `apps/` ou `packages/` depois — veja o `RESULTADO.md` para o
que aprendemos e levar adiante.

## Pré-requisitos

- Node 26+ (roda `.ts` nativamente, sem `tsx` nem `ts-node`)
- pnpm 12+
- Docker com o plugin `compose`

Se `docker compose version` falhar no macOS com Homebrew:

```bash
brew install docker-compose
# e registre o diretório do plugin em ~/.docker/config.json:
#   "cliPluginsExtraDirs": ["/opt/homebrew/lib/docker/cli-plugins"]
```

## Subir

```bash
cd prototype
pnpm install
pnpm db:up                       # postgres:18-alpine na porta 5433
pnpm exec playwright install chromium
pnpm dev                         # API em :8787 e web em :5173
```

O esquema do banco é criado no boot do servidor (`create table if not exists`). Não há
ferramenta de migração aqui — isso é T4.

Abra http://localhost:5173 em duas janelas (perfis diferentes, ou uma anônima) para ver dois
"aparelhos" convergindo. Para simular a API fora do ar, basta parar o servidor: a página
continua funcionando e a fila de envio cresce.

## Rodar os testes

```bash
pnpm test:unit    # node --test: nota, ordem determinística, propriedade das 20 ordens
pnpm test:e2e     # Playwright, dois contextos: os 5 critérios do ticket
pnpm typecheck    # tsc --noEmit nos três pacotes
pnpm test         # unit + e2e
```

O `test:e2e` sobe API e Vite sozinho (`webServer` do Playwright) e precisa do Postgres de pé.
Se o banco não estiver no ar, o servidor falha no boot apontando o `pnpm db:up`.

## Derrubar

```bash
pnpm db:down      # remove o container e o volume
```

## Como está organizado

```
server/src/db.ts      pool do pg + esquema no boot
server/src/index.ts   POST /sync/push (idempotente), GET /sync/pull?after=<seq>
web/src/score.ts      puro, sem imports: data local, ordem determinística, nota
web/src/db.ts         Dexie: events, outbox, meta
web/src/events.ts     recordEvent — a única porta de escrita no log
web/src/sync.ts       push da fila + pull por cursor, com guarda de reentrância
web/src/main.ts       a tela, projetada do log local via liveQuery
e2e/sync.spec.ts      os 5 critérios, com a contagem conferida direto no Postgres
```

## Escolhas que valem saber

- **A página e a API compartilham a origem.** A web faz `fetch("/sync/...")` relativo e o Vite
  faz proxy para `:8787`. Assim o teste consegue derrubar só a API
  (`page.route("**/sync/**", r => r.abort())`) sem matar o Vite — e não existe CORS no caminho.
- **`user_id` é fixo no servidor** (`"proto-user"`) e nunca vem do cliente; toda consulta
  filtra por ele.
- **`POST /test/reset`** só existe com `PROTO_ALLOW_RESET=1`, ligado apenas pelo Playwright.
- **Os `webServer` do Playwright rodam `node`/`vite` direto, não via `pnpm --filter`:** o pnpm
  não repassa o SIGTERM, e o Playwright ficava pendurado esperando os servidores morrerem.
