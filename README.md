# Pulse

App de rotina web (PWA) em que cada dia recebe uma nota de 0,0 a 10,0. Funciona offline e
sincroniza entre aparelhos. Projeto de portfólio do Ricardo.

Cada mudança é um evento imutável criado no aparelho; nota, faixas, sequência e histórico são
projeções desse log. A interface lê e escreve no IndexedDB, e a rede só sincroniza — nenhuma ação
espera o servidor.

A spec completa está em [`docs/spec.md`](docs/spec.md), o design system em
[`docs/design-system/`](docs/design-system/) e as decisões em [`docs/decisoes/`](docs/decisoes/).

## Como está organizado

| Pacote | O que é |
| --- | --- |
| `apps/web` | PWA em React + Vite + TanStack Router + Tailwind |
| `apps/api` | API em Hono sobre Node, com Postgres |
| `packages/core` | eventos, recorrência, nota, faixas, sequência e projeções — puro, sem interface nem banco |
| `e2e` | testes Playwright do app inteiro |
| `prototype/` | código descartável do T0, congelado e fora do workspace. Não importe nada dele |

## Pré-requisitos

- Node 26 (a versão está fixada em `.nvmrc` e em `engines`)
- pnpm 12
- Docker com o plugin `compose`, para o Postgres de desenvolvimento

## Instalar

```bash
pnpm install
cp .env.example .env
```

## Rodar em desenvolvimento

```bash
pnpm db:up     # Postgres 18 na porta 5434
pnpm dev       # API em :8787 e web em :5173
```

Abra http://localhost:5173. O Vite faz proxy de `/api` para a API, então o navegador só conversa
com uma origem — é o que o cookie de sessão precisa, e o que permite simular a API fora do ar nos
testes sem derrubar o servidor de desenvolvimento.

## Rodar os testes

```bash
pnpm lint         # Biome: lint e formatação
pnpm typecheck    # tsc --noEmit em todos os pacotes
pnpm test:unit    # Vitest em packages/core e apps/api
pnpm test:e2e     # Playwright (faz o build antes)
pnpm test         # unit + e2e
```

Na primeira vez: `pnpm --filter @pulse/e2e exec playwright install chromium`.

## Derrubar o banco

```bash
pnpm db:down
```
