# T1 · Fundação do monorepo, CI e hospedagem

Leia o `CLAUDE.md`, a seção do T1 em `docs/spec.md` e o `prototype/RESULTADO.md`. Comece em modo plan e me mostre o plano antes de escrever código.

## Objetivo

Deixar o repositório pronto para as próximas ondas: três pacotes que compilam e testam, CI verde a cada PR, um E2E mínimo e um esqueleto no ar. **Nenhuma regra de negócio, login ou componente visual entra aqui**: isso é T2 em diante.

## O que construir

**Monorepo**
- pnpm workspaces com `apps/web`, `apps/api`, `packages/core` e `e2e`. A pasta `prototype/` fica fora do workspace, do lint e da CI.
- Node 26.x e TypeScript 5.9.x, com uma `tsconfig` base e `strict` ligado. Fixe a versão do Node (`.nvmrc` ou `engines`) e a do pnpm (`packageManager`).
- Lint e formatação: use Biome (uma ferramenta só). Se encontrar motivo forte para ESLint + Prettier, explique no plano.

**`packages/core`**
- Biblioteca TypeScript pura, sem dependências de runtime.
- Vitest configurado e um teste de exemplo (por exemplo, um `version` exportado).

**`apps/api`**
- Hono 4.13.x com `@hono/node-server`.
- Rota `GET /api/health` que devolve `{ ok: true, version }` e importa algo do `packages/core`, para provar a ligação entre os pacotes.
- `docker-compose.yml` na raiz com Postgres 18 para desenvolvimento. A API ainda não precisa falar com o banco; só deixe a variável `DATABASE_URL` prevista.
- Vitest com um teste da rota de saúde.

**`apps/web`**
- Vite 8.3.x + React + TanStack Router 1.170+ + Tailwind CSS 4.3.x.
- Uma página inicial simples com o texto "Pulse" e o resultado de `/api/health`.
- Proxy do Vite: `/api` aponta para a API em desenvolvimento, para tudo ficar na mesma origem (recomendação T9-6 do protótipo).
- Ainda sem tokens do design system nem componentes (isso é T7a).

**`e2e`**
- Playwright 1.65.x com um teste: abrir a página inicial e ver o resultado de `/api/health`.
- `webServer` subindo API e web com `node` (ou o binário do Vite) e `cwd`, **nunca** via `pnpm --filter`.

**CI (GitHub Actions)**
- A cada PR e push na branch principal: instalar com cache do pnpm, lint, checagem de tipos, testes unitários de todos os pacotes e o E2E (com Postgres como serviço, mesmo que ainda não seja usado).
- Tempo total alvo: abaixo de 5 minutos.

**Versões**
- Confirme no registro do npm as versões que a spec marca como "a confirmar no T1": React, Drizzle, Vitest, Motion, shadcn/ui e o plugin de PWA do Vite. Escolha versões publicadas há pelo menos duas semanas.
- Atualize a tabela "Bibliotecas e versões" em `docs/spec.md` com o que foi instalado ou confirmado.

**Hospedagem**
- Compare as opções gratuitas ou baratas para: (1) a web estática, (2) a API Node, (3) o Postgres. Considere pelo menos Railway, Fly.io e Neon, e um host estático (Cloudflare Pages, Vercel ou Netlify).
- Critérios: custo mensal no uso do MVP, se o plano gratuito "dorme" e quanto demora para acordar, suporte a job agendado (lembrete e restauração da demo) e **mesma origem para `/api` em produção**, por regra de reescrita ou proxy. Isso importa porque o login do T4 usa cookie de sessão.
- Escreva `docs/decisoes/hospedagem.md` com uma tabela comparando as opções, as fontes consultadas e a sua recomendação.
- **Pare e me mostre a recomendação antes de criar contas ou fazer deploy.** Depois que eu aprovar e criar as contas, prepare a configuração de deploy (arquivos e variáveis) e me passe os passos que dependem de mim.

**Documentação**
- `README.md` na raiz: o que é o Pulse, como instalar, rodar em desenvolvimento e rodar os testes.
- Preencha a seção "Comandos" do `CLAUDE.md`.

## Critérios de aceite

1. `pnpm install` seguido do comando de testes passa em uma máquina limpa (Node 26 e Docker instalados).
2. A CI fica verde num PR que só contém o T1.
3. O E2E abre a página e mostra o resultado de `/api/health`, e o processo encerra sozinho ao terminar.
4. `docs/spec.md` tem as versões confirmadas e `docs/decisoes/hospedagem.md` tem a recomendação.
5. Depois da minha aprovação da hospedagem: web e API no ar, com `/api/health` respondendo pela mesma origem da web.

## Fora do escopo

Regras de negócio, banco de verdade (tabelas, migrações), login, tokens e componentes do design system, PWA. Se algo disso parecer necessário para fechar o T1, pare e me avise.
