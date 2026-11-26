# Pulse

App de rotina web (PWA) em que cada dia recebe uma nota de 0,0 a 10,0. Funciona 100% offline e sincroniza entre aparelhos. Projeto de portfólio do Ricardo.

## Fontes da verdade (neste repositório)

- **Spec do MVP:** `docs/spec.md` (requisitos RF, critérios CA, decisões D, tickets T e ondas). Leia a seção do ticket antes de começar.
- **Design system:** `docs/design-system/` (`README.md` com princípios e cores, `tokens.json`, `components/*.md` com regras de cada componente, `mascote/*.svg`).
- **Telas de referência:** `docs/telas/` (Hoje e Fechamento; veja o README da pasta).
- **Protótipo da sincronização:** `prototype/` e `prototype/RESULTADO.md` (só referência; não importe nada dele).

Se o código e a spec discordarem, pare e avise. A spec é corrigida primeiro, no mesmo PR ou num PR próprio.

## Como trabalhamos

- Um ticket por vez, um PR por ticket, até ~500 linhas de lógica (testes, docs e config não contam). Passou disso: proponha quebrar.
- Comece em modo plan: liste arquivos, passos e testes antes de escrever código.
- Regra de negócio testável segue TDD: escreva o teste a partir dos critérios de aceite, veja falhar, implemente até passar.
- Não mexa em arquivos fora das áreas do ticket. Não adicione dependência sem dizer por quê.
- Não invente versões de bibliotecas: confira no registro do npm ou na documentação atual.
- Não crie contas, não configure cobrança e não faça deploy em serviço externo sem o Ricardo aprovar.
- Ao terminar: rode lint, tipos e testes; descreva no PR o que mudou, como verificar e o que ficou de fora.

## Regras de arquitetura (não negociáveis)

1. **Eventos são imutáveis.** Toda mudança é um evento novo com `id` (uuid) gerado no aparelho. Nunca edite nem apague eventos.
2. **Estado é projeção.** Nota, faixas, sequência e histórico são calculados a partir do log de eventos.
3. **Ordem determinística.** Projeções ordenam por `client_ts` e, no empate, por `id`. O mesmo log em qualquer ordem de chegada gera o mesmo resultado.
4. **Regra de negócio só em `packages/core`**, sem depender de interface, banco ou rede. Web e API importam dele.
5. **Toda consulta no servidor filtra por `user_id`** da sessão. Nunca confie em `user_id` vindo do cliente.
6. **Offline primeiro.** A interface lê e escreve no IndexedDB; a rede só sincroniza. Nenhuma ação do usuário espera o servidor.
7. **Data do dia vai no evento** (`local_date`, string `YYYY-MM-DD`, nunca `Date`), calculada no momento da ação com a virada configurada (padrão 04:00).

## Lições do protótipo (T0)

- O driver `pg` converte `date` em `Date` e `bigserial` em string. Registre parsers no boot da API e teste o JSON de ida e volta campo a campo.
- Testes de sincronização conferem a nota/projeção, não só a contagem de eventos.
- No Playwright, suba os servidores com `node` e `cwd`, nunca via `pnpm --filter` (o processo não encerra).
- No Dexie 4, use `liveQuery`. `bulkPut` sobrescreve eventos: proibido.

## Estrutura

- `apps/web`: PWA em React + Vite + TanStack Router + Tailwind + Dexie.
- `apps/api`: Hono + Postgres (Drizzle) + Better Auth.
- `packages/core`: eventos, recorrência, nota, faixas, sequência, projeções.
- `e2e/`: testes Playwright do app inteiro.
- `docs/`: spec, design system e telas.

## Interface

- Texto da interface em português do Brasil. Código, nomes de variáveis e commits em inglês.
- Cores, raios, espaçamentos e fonte só pelos tokens de `docs/design-system/tokens.json`. Nada de hex solto.
- Contraste mínimo 4,5:1 em texto e 3:1 em controles; botões reais com `aria-label`; respeitar "reduzir movimento".

## Comandos

Todos na raiz do repositório. Node 26 e pnpm 12; o `prototype/` tem workspace próprio e não
responde a nenhum destes.

| Comando | O que faz |
| --- | --- |
| `pnpm install` | instala o workspace |
| `pnpm dev` | API em :8787 e web em :5173, com `/api` no proxy do Vite |
| `pnpm build` | compila `packages/core`, depois `apps/api` e `apps/web` |
| `pnpm lint` | Biome: lint e formatação (`pnpm lint:fix` corrige) |
| `pnpm typecheck` | `tsc --noEmit` em todos os pacotes |
| `pnpm test:unit` | Vitest em `packages/core` e `apps/api` |
| `pnpm test:e2e` | Playwright; faz o build antes |
| `pnpm test` | unit + E2E |
| `pnpm db:up` / `pnpm db:down` | Postgres 18 de desenvolvimento, na porta 5434 |

Na primeira vez: `pnpm --filter @pulse/e2e exec playwright install chromium`.

Migrações do banco: definidas no T4.

`packages/core` publica `dist/`, então precisa estar compilado antes de qualquer coisa que o
importe — `typecheck`, `test:unit` e `test:e2e` já fazem isso sozinhos.
