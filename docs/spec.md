# Pulse — Spec do MVP

Cópia em Markdown do documento "Pulse — Spec do MVP" (claude.ai). Atualizada em 25/11/2026, depois do resultado do T0. Quando a spec mudar, esta cópia é atualizada no mesmo PR.

Classificação: complexa (projeto do zero com arquitetura local-first). Aprovada em 25/11/2026.

## Resumo da ideia

- **O quê e onde:** Pulse, um app de rotina web (PWA instalável), com as telas Hoje, Fechamento do dia, Histórico, Tarefas e Perfil.
- **Para quem:** pessoas que querem organizar a rotina de forma leve e ver a própria evolução. Também é a peça principal do portfólio de desenvolvedor do Ricardo.
- **Como aparece:** a pessoa cadastra tarefas recorrentes com peso, conclui com um toque e vê o anel e o mascote Pulse reagirem. Cada dia fecha com uma nota de 0,0 a 10,0 e uma tela de comemoração.
- **Objetivo:** tornar a rotina recompensadora e mostrar, no portfólio, produto, interface e engenharia (offline, eventos, testes, CI/CD).
- **Métrica de sucesso:** o Ricardo usa o app todo dia por 2 semanas sem voltar ao Notion; funciona sem internet e converge entre dois aparelhos; está no ar com conta demo, README e vídeo.
- **Limites:** um usuário por conta, só pt-BR, só web, tema claro, fórmula da nota provisória e isolada.
- **Ritmo:** 10 a 15 h por semana, MVP no ar em cerca de 8 semanas.

## Pesquisa

Achado principal: nenhuma das sync engines do plano original cumpre "offline completo". Por isso a spec usa uma sincronização própria sobre o log de eventos (decisão D1).

| Tema | Fato encontrado | Fonte |
| --- | --- | --- |
| Zero (Rocicorp) | Estável desde a 1.0 (mar/2026), última versão 1.10. **Não aceita escrita offline:** sem conexão, leituras funcionam e escritas são rejeitadas. Bug de escrita offline segue aberto. | https://zero.rocicorp.dev/docs/connection · https://bugs.rocicorp.dev/p/zero/issue/246605 |
| ElectricSQL | Sincroniza só leitura (Postgres → cliente); escrita fica a cargo da API do app. O Electric Cloud foi desligado em set/2026; resta hospedar por conta própria. | https://www.issoh.co.jp/md/tech/7220 |
| LiveStore | Modelo baseado em eventos com SQLite local e escrita offline, mas ainda em 0.4 (antes da 1.0). | https://cdn.jsdelivr.net/npm/@livestore/livestore@0.4.0/README.md |
| Dexie (IndexedDB) | Estável, série 4.4 (2026). | https://security.snyk.io/package/npm/dexie/versions?page=1 |
| Vite | 8.0 estável (mar/2026), com Rolldown; 8.1 em jun/2026. | https://vite.dev/blog/announcing-vite8-1 |
| Tailwind CSS | Série 4.3 (última vista: 4.3.5, nov/2026), compatível com Vite 8. | https://releasebot.io/updates/tailwind |
| TanStack Router | React Router 1.170.x (jul/2026); a 2.0 ainda é beta. | https://newreleases.io/project/github/TanStack/router/release/release-2026-07-13-2136 |
| Hono | 4.13.x estável; a v5 está em pré-lançamento. | https://socket.dev/npm/package/hono/overview/4.13.16 |
| Better Auth | Série 1.6 estável (1.6.25); 1.7 em release candidate. | https://releases.sh/better-auth/overview |
| Rive (React) | `@rive-app/react-canvas` com `useStateMachineInput` para entradas numéricas. No plano gratuito, a exportação traz uma tela de abertura do Rive. | https://rive.app/docs/runtimes/react/inputs · https://rive.app/docs/editor/exporting |

**Em aberto:** versões de React, Drizzle, Vitest, Motion e do plugin de PWA (conferir no T1); hospedagem da API e do Postgres; suporte a Web Push no iPhone.

## Protótipo (T0)

Valida a parte mais arriscada: a sincronização própria de eventos, com escrita offline em dois aparelhos. Código descartável em `prototype/`.

**Critérios de sucesso** (Playwright com dois contextos de navegador)

1. O aparelho A fica offline, registra 3 conclusões e a nota muda na hora.
2. O aparelho B, online, registra 1 conclusão.
3. A volta a ficar online: em até 5 s, A e B mostram os mesmos eventos e a mesma nota.
4. Reenviar o mesmo lote não duplica nada no servidor.
5. Recarregar A com a API inalcançável mantém todos os eventos e a nota. (No protótipo, "offline" significa API bloqueada; a recarga sem rede nenhuma depende do service worker e é validada no T15.)

**Resultado (25/11/2026): passou.** Os 5 critérios e o teste das 20 ordens ficaram verdes em 5 execuções seguidas, com cerca de 3 h de esforço. A convergência levou cerca de 1,8 s, mas pode chegar a 4 s no pior caso, por causa do intervalo de 2 s. O achado mais sério foi silencioso: o driver do Postgres devolvia a data como `Date`, o evento entrava no log e sumia da projeção, sem nenhum erro visível. As correções viraram as decisões D9 a D11, os riscos novos e os critérios reforçados de T1, T5, T6, T8 e T9. Detalhes em `prototype/RESULTADO.md`.

## 1. Objetivo e contexto

Entregar um app de rotina que funciona 100% offline, dá uma nota a cada dia e recompensa a conclusão de tarefas com animação e com o mascote Pulse. O visual está definido no design system (`docs/design-system/`) e nas telas Hoje e Fechamento (`docs/telas/`). A fórmula definitiva da nota será escrita pelo Ricardo depois; o MVP traz uma provisória, isolada.

## 2. Usuários e fluxo principal

**Usuários:** a pessoa dona da conta (um usuário por conta) e o visitante do portfólio, que entra pela conta demo.

**Fluxo principal**

1. Cadastra-se com e-mail e senha, ou toca em "Entrar como demo".
2. Cria tarefas com nome, peso e recorrência.
3. Na tela Hoje, conclui tarefas com um toque: o anel, a nota e o mascote reagem na hora.
4. Ao concluir tudo, ao tocar em "Fechar o dia" ou quando chega o horário do lembrete, vê a tela de Fechamento com nota, faixa e mensagem.
5. No Histórico, acompanha a evolução por semana e por mês.
6. Em outro aparelho, com a mesma conta, vê os mesmos dados após a sincronização.

## 3. Requisitos funcionais

**Conta**

- **RF01 · Cadastro e login** com e-mail e senha; sair da conta. A sessão persiste ao reabrir o app.
- **RF02 · Conta demo:** botão "Entrar como demo" na tela de login abre uma conta com cerca de 30 dias de histórico fictício. Os dados da demo voltam ao estado inicial todo dia às 04:00.

**Tarefas**

- **RF03 · Criar, editar e arquivar tarefa:** nome (obrigatório, até 60 caracteres), emoji opcional, peso inteiro de 1 a 5 (padrão 1) e recorrência: todo dia, dias da semana escolhidos ou uma data única. Arquivar não apaga o histórico.
- **RF04 · Ordem manual** das tarefas por arrastar.
- **RF05 · Mudança em tarefa recorrente** vale só a partir do dia atual; dias passados ficam como foram.

**Hoje e nota**

- **RF06 · Tela Hoje:** saudação, chip de sequência, faixa dos últimos 7 dias, cartão da nota (anel + mascote + nota + "Fechar o dia") e lista das tarefas do dia.
- **RF07 · Concluir e desfazer** com um toque no checkbox. O anel, a nota e o mascote atualizam em menos de 100 ms, mesmo offline.
- **RF08 · Nota do dia:** de 0,0 a 10,0, com uma casa decimal e arredondamento meio para cima. Calculada por um módulo isolado (`packages/core/score`) com a fórmula provisória: soma dos pesos concluídos ÷ soma dos pesos do dia × 10.
- **RF09 · Faixas:** baixa (0,0–4,9), média (5,0–6,9), alta (7,0–9,9) e perfeita (10,0). A faixa define a cor e a espessura do anel, o chip e a expressão do mascote (SVG estático por faixa).

**Fechamento e virada**

- **RF10 · Fechamento do dia:** abre ao concluir todas as tarefas, ao tocar em "Fechar o dia" ou ao abrir o app depois do horário do lembrete. Mostra a nota, a faixa, a mensagem da faixa, tarefas feitas, média dos últimos 7 dias e sequência.
- **RF11 · Ajuste depois de fechar:** o dia aceita mudanças até a virada; a nota é recalculada e o fechamento não reaparece.
- **RF12 · Virada do dia:** horário configurável (padrão 04:00). O dia não fechado fecha sozinho, sem animação, e no próximo acesso aparece um resumo curto dele.
- **RF13 · Edição retroativa:** só o dia anterior pode ser alterado; os demais ficam bloqueados.
- **RF14 · Sequência:** dias seguidos com nota de pelo menos 5,0. Dia sem tarefas não conta nem quebra a sequência.

**Histórico**

- **RF15 · Histórico:** seletor semana / mês, calendário mensal com cada dia na cor da faixa, média do período e sequência atual e recorde. Tocar num dia abre o resumo dele.

**Offline, aparelhos e notificações**

- **RF16 · Offline completo:** RF03 a RF15 funcionam sem internet, inclusive após recarregar a página. Um indicador discreto mostra "offline", "sincronizando" e "sessão expirada" (esta última nunca aparece como se fosse falta de internet).
- **RF17 · Sincronização entre aparelhos:** ao reconectar, os eventos locais sobem e os de outros aparelhos descem; todos chegam ao mesmo estado.
- **RF18 · PWA instalável**, com a interface carregando sem rede depois do primeiro acesso.
- **RF19 · Lembrete de fechamento** por notificação push no horário escolhido, só se o dia ainda não foi fechado. Tocar abre o Fechamento.
- **RF20 · Perfil e ajustes:** nome, horário da virada, horário do lembrete, ativar ou desativar notificações, sair.

**Animação e acessibilidade**

- **RF21 · Micro-interações:** check animado, anel subindo e número contando (Motion), além de vibração no celular.
- **RF22 · Mascote animado no Rive** (último ticket, cortável): uma state machine com a nota como entrada, substituindo os SVGs estáticos.
- **RF23 · Acessibilidade:** respeita "reduzir movimento", contraste mínimo 4,5:1 no texto e 3:1 nos controles, controles reais com `aria-label`, e a faixa nunca é indicada só por cor.

## 4. Fora do escopo

- Tema escuro (os tokens já existem; entra depois).
- Squads, insights estatísticos, servidor MCP e conquistas.
- Fórmula definitiva da nota.
- Visão anual no Histórico.
- Recuperação de senha por e-mail e login social.
- App nativo, outros idiomas, compartilhamento entre usuários.
- Desenho prévio das telas de Histórico, Tarefas e Perfil: nascem no código a partir dos componentes e são refinadas depois.

## 5. Dados e integrações

Toda mudança vira um evento imutável, criado no aparelho com um id próprio. O cliente guarda os eventos e calcula tudo a partir deles; o servidor só guarda e redistribui.

**Eventos**

| Evento | Dados principais |
| --- | --- |
| `task_created` | taskId, nome, emoji, peso, recorrência, ordem |
| `task_updated` | taskId, campos alterados, data a partir da qual vale |
| `task_archived` | taskId |
| `task_reordered` | lista de taskIds |
| `task_completed` / `task_uncompleted` | taskId, data local do dia |
| `day_closed` | data local, origem (manual, automático, virada) |
| `settings_updated` | horário da virada, horário do lembrete, notificações |

**Postgres (servidor)**

| Tabela | Colunas |
| --- | --- |
| `user`, `session`, `account` | geradas pelo Better Auth |
| `events` | id (uuid do cliente, chave primária), user_id, device_id, type, payload (jsonb), local_date, client_ts, server_seq (sequencial do servidor), created_at |
| `push_subscriptions` | id, user_id, endpoint, chaves, created_at |

**IndexedDB (cliente, via Dexie)**

- `events`: log completo do usuário.
- `outbox`: eventos ainda não confirmados pelo servidor.
- `meta`: último `server_seq` recebido e id do aparelho.
- Projeções em memória ou em cache: tarefas, dias (nota, faixa, fechado) e sequência, recalculadas a partir dos eventos.

**API (Hono)**

| Rota | Função |
| --- | --- |
| `/api/auth/*` | Better Auth: cadastro, login, sessão, saída |
| `POST /api/demo` | cria sessão na conta demo |
| `POST /api/sync/push` | recebe um lote de eventos; ignora ids repetidos; devolve os ids aceitos e o `server_seq` de cada um |
| `GET /api/sync/pull?after=<seq>` | devolve os eventos do usuário com `server_seq` maior que o informado, em páginas de até 500 com `hasMore`, e com tipos normalizados (data como `YYYY-MM-DD`, `server_seq` numérico) |
| `POST /api/push/subscribe` | salva a inscrição de notificação |

Um job agendado no servidor envia o lembrete (RF19) e restaura a conta demo (RF02). Ele usa o mesmo `packages/core` do cliente para saber se o dia está fechado.

**Estrutura do repositório (pnpm workspaces)**

- `apps/web`: PWA (React + Vite).
- `apps/api`: Hono + Postgres.
- `packages/core`: tipos de evento, recorrência, nota, faixas, sequência e projeções. Sem dependência de interface nem de banco, e testado à parte.

**Bibliotecas e versões**

Fixadas no T1 (26/11/2026). Regra: só versão publicada há pelo menos duas semanas, conferida com
`npm view <pacote> time --json`. A trava está no `pnpm-workspace.yaml` (`minimumReleaseAge: 20160`),
então o instalador recusa pacote recém-publicado — não depende de quem instala lembrar.

| Camada | Biblioteca | Versão |
| --- | --- | --- |
| Runtime | Node | 26.x (`.nvmrc` e `engines`) |
| Gerenciador | pnpm | 12.6.0 (`packageManager`) |
| Build | Vite | 8.3.8 |
| Linguagem | TypeScript | 5.9.3 |
| React | `react`, `react-dom` | 19.3.1 (tipos 19.3.0) |
| Plugin React do Vite | `@vitejs/plugin-react` | 6.3.0 |
| Rotas | TanStack Router | 1.170.46 (plugin Vite 1.169.0; não usar a 2.0 beta) |
| Estilo | Tailwind CSS | 4.3.5 (`@tailwindcss/vite` 4.3.5) |
| Lint e formato | Biome | 2.6.7 (uma ferramenta só, sem ESLint nem Prettier) |
| Componentes | shadcn/ui (CLI `shadcn` 4.23.0) sobre `radix-ui` 1.8.1 | confirmadas; instaladas no T7a |
| Animação | Motion 14.12.0; `@rive-app/react-canvas` 4.39.0 (RF22) | confirmadas; instaladas no T19 e T21 |
| Dados locais | Dexie | 4.4.7; usar `liveQuery` |
| API | Hono | 4.13.18 (`@hono/node-server` 2.1.7; não usar a v5 pré) |
| Auth | Better Auth | **a spec dizia 1.6.x; a série publicada é 1.7.x (1.7.21). Decidir antes do T4** |
| Banco | Postgres 18; Drizzle | `drizzle-orm` 0.45.4 e `drizzle-kit` 0.31.11 confirmadas; instaladas no T4 |
| PWA | `vite-plugin-pwa` 2.0.0; `web-push` 4.0.0 | confirmadas; instaladas no T15 e T17 |
| Testes | Vitest 5.1.0; Playwright 1.65.0 | instaladas no T1 |

O `prototype/` ficou congelado com as versões do T0 (Hono 4.13.22, `@hono/node-server` 2.1.11,
Playwright 1.65.1, `@types/node` 26.6.10) e está fora do workspace, do lint e da CI. Duas delas
foram publicadas no mesmo dia em que o T0 rodou, o que a trava de idade agora impede.

**Hospedagem:** comparada em `docs/decisoes/hospedagem.md`. Recomendação do T1: Fly.io servindo a
interface pelo próprio processo da API (mesma origem para `/api` sem proxy) e Postgres no Neon
Free. Aguardando a aprovação do Ricardo antes de criar conta ou fazer deploy.

## 6. Decisões técnicas e alternativas descartadas

| # | Decisão | Por quê | Descartadas |
| --- | --- | --- | --- |
| D1 | **Sincronização própria:** log de eventos no Dexie + fila de envio + `push`/`pull` por cursor no Hono | Os eventos só são adicionados e cada conta tem um usuário, então não há conflito a resolver: basta unir os logs e ignorar ids repetidos. | Zero (não escreve offline); ElectricSQL (só leitura, sem serviço hospedado); LiveStore (antes da 1.0); CRDTs (desnecessários) |
| D2 | **Event sourcing**, com projeções calculadas no cliente | Trocar a fórmula da nota recalcula o histórico inteiro; a sincronização fica trivial | CRUD com tabela de estado |
| D3 | **`packages/core` puro**, compartilhado entre web e API | Mesma regra de nota e virada nos dois lados; fácil de testar | Regras duplicadas |
| D4 | **Ordem dos eventos** por `client_ts`, com o id como desempate; a projeção é determinística | Dois aparelhos chegam ao mesmo resultado independentemente da ordem de chegada | Ordem de chegada no servidor |
| D5 | **Vite + React** (aplicação de página única) | App atrás de login, sem SEO; mais simples de deixar offline | Next.js |
| D6 | **Monorepo pnpm** | Um repositório só no portfólio, tipos compartilhados | Repositórios separados |
| D7 | **Mascote em SVG estático primeiro**, Rive no fim | Libera o fluxo principal sem depender da animação; o Rive pode ser cortado | Rive desde o início |
| D8 | **Better Auth** com sessão por cookie | Open source, sem custo por usuário, série 1.6 estável | Clerk (pago e externo) |
| D9 | **Trava por usuário no push** (`pg_advisory_xact_lock` pelo id do usuário) | Dois aparelhos enviando ao mesmo tempo podem confirmar `server_seq` fora de ordem, e um cliente perderia um evento ao avançar o cursor. A trava ordena as confirmações de cada usuário. | Janela de releitura do cursor; cursor de duas partes |
| D10 | **`LocalDate` como string `YYYY-MM-DD` tipada**, com uma única função de conversão na fronteira; parsers de `date` e `int8` registrados no boot da API | O bug do protótipo entrou exatamente por uma data tratada como `Date` | Converter em cada consulta |
| D11 | **Sincronizar também ao ganhar foco e ao voltar para a aba**, com recuo de 2 s a 30 s em falha e guarda contra ciclos sobrepostos | Dá folga ao limite de 5 s do CA10 sem depender só do intervalo | Canal do servidor (SSE) no MVP: fica como melhoria se o polling não bastar |

## 7. Critérios de aceite

- [ ] **CA01 (RF01)** Um teste E2E cria uma conta, sai, entra de novo e encontra as tarefas criadas.
- [ ] **CA02 (RF02)** "Entrar como demo" abre a tela Hoje com histórico de 30 dias; depois da restauração, os dados voltam ao estado inicial.
- [ ] **CA03 (RF03–RF05)** Testes unitários de recorrência cobrem todo dia, dias da semana, data única e mudança que vale só a partir de hoje.
- [ ] **CA04 (RF07)** Concluir uma tarefa com a rede desligada atualiza anel e nota em menos de 100 ms (medido no teste E2E).
- [ ] **CA05 (RF08)** Testes unitários da nota: pesos 7 de 9 = 7,8; 1 de 3 = 3,3; 0 de 0 = sem nota; arredondamento meio para cima (pesos que dão 6,25 viram 6,3).
- [ ] **CA06 (RF09)** As notas 4,9 / 5,0 / 6,9 / 7,0 / 9,9 / 10,0 caem nas faixas certas.
- [ ] **CA07 (RF10–RF11)** Concluir a última tarefa abre o Fechamento; desfazer depois recalcula a nota sem reabrir a tela.
- [ ] **CA08 (RF12–RF13)** Testes de virada às 04:00: uma ação às 03:59 conta para o dia anterior; editar o dia anterior é permitido e o de dois dias atrás é bloqueado.
- [ ] **CA09 (RF14)** Testes de sequência: dia sem tarefas não quebra; nota 4,9 quebra; nota 5,0 mantém.
- [ ] **CA10 (RF16–RF17)** E2E com dois contextos: os critérios do protótipo passam no app real, e uma recarga offline mantém tudo.
- [ ] **CA11 (RF18)** Lighthouse aponta o app como instalável; a interface abre em modo avião depois do primeiro acesso.
- [ ] **CA12 (RF19)** Com notificações ativas e o dia aberto, o lembrete chega no horário; com o dia fechado, não chega.
- [ ] **CA13 (RF23)** Uma verificação com axe não aponta erros nas telas Hoje e Fechamento; com "reduzir movimento" ligado, não há partículas nem bounce.
- [ ] **CA14 (geral)** A CI roda lint, testes unitários e E2E a cada PR; o deploy acontece a partir da branch principal.

## 8. Riscos e perguntas abertas

**Riscos**

| Risco | Efeito | Plano |
| --- | --- | --- |
| Sincronização própria com falhas sutis (rede instável, reenvios) | Dados diferentes entre aparelhos | Protótipo antes de tudo; ids gerados no cliente; testes E2E com dois contextos |
| Navegador apaga o IndexedDB por falta de espaço | Perda de eventos ainda não enviados | Pedir armazenamento persistente (`navigator.storage.persist`) e enviar assim que houver rede |
| Web Push no iPhone só funciona com o PWA instalado | Lembrete não chega para quem usa pelo navegador | Avisar na tela de ajustes; o Fechamento também abre ao entrar no app depois do horário (RF10) |
| Relógio ou fuso diferente entre aparelhos | Evento cai no dia errado | Gravar a data local do dia no próprio evento, no momento da ação |
| Log de eventos cresce sem parar | Projeções mais lentas com o tempo | Volume pequeno no MVP; snapshot mensal fica para depois |
| Conta demo usada por várias pessoas ao mesmo tempo | Dados bagunçados | Restauração diária; a tela avisa que é uma conta compartilhada |
| Rive gratuito exporta com tela de abertura | Marca do Rive no app | RF22 é cortável; avaliar o plano pago só se for usar |
| Driver do Postgres converte tipos sozinho (data vira `Date`, `bigserial` vira texto) | Evento some da projeção sem erro; ordenação errada a partir do 10º evento | D10 e um teste que compara campo a campo o JSON enviado e o recebido (T6) |
| Contar eventos não prova que a projeção está certa | Bugs silenciosos passam nos testes | Os testes de sincronização sempre conferem a nota, não só a contagem (T5, T9) |
| Playwright não encerra quando sobe os servidores via `pnpm --filter` | CI travada | Subir com `node` direto e `cwd` (T1) |

**Perguntas abertas**

1. **Hospedagem da API e do Postgres:** decidida no T1, comparando os planos gratuitos ou baratos de Railway, Fly.io e Neon.
2. **IA que revisa os PRs:** em aberto; o Ricardo responde depois.
3. **Idioma da conta demo:** só pt-BR no MVP. *(decidido)*

## Tickets

Cada ticket tem no máximo ~500 linhas de lógica e vira um PR. Tamanho: P (até meio dia), M (1 a 2 dias).

| # | Ticket | Depende de | Tamanho | Paralelo? |
| --- | --- | --- | --- | --- |
| T0 | Protótipo da sincronização (descartável) — **concluído** | — | M | Não |
| T1 | Fundação do monorepo, CI e hospedagem | T0 | M | Não |
| T2 | Core: eventos, recorrência e virada do dia | T1 | M | Sim, com T3 e T4 |
| T3 | Core: nota, faixas, sequência e médias | T1 | P | Sim, com T2 e T4 |
| T4 | API: banco e login (Better Auth) | T1 | M | Sim, com T2 e T3 |
| T5 | Core: projeções a partir do log | T2, T3 | M | Sim, com T6 e T7a |
| T6 | API: endpoints de sincronização | T4 | M | Sim, com T5 e T7a |
| T7a | Web: tokens e componentes de base | T1 | M | Sim, com T5 e T6 |
| T7b | Web: componentes da nota e do histórico | T7a | M | Sim, com T8 e T10 |
| T8 | Web: banco local e eventos | T5 | M | Sim, com T7b e T10 |
| T10 | Web: telas de login e cadastro | T4, T7a | P | Sim, com T7b e T8 |
| T9 | Web: cliente de sincronização | T6, T8 | M | Sim, com T11 e T14 |
| T11 | Web: tela Tarefas | T7a, T8 | M | Sim, com T9 e T14 |
| T14 | Web: tela Histórico | T7b, T8 | M | Sim, com T9 e T11 |
| T12 | Web: tela Hoje | T7b, T8 | M | Sim, com T16 e T18 |
| T15 | PWA instalável e offline | T12 | P | Sim, com T13 |
| T16 | Web: Perfil e ajustes | T8, T10 | P | Sim, com T12 e T18 |
| T13 | Fechamento e virada do dia | T12 | M | Sim, com T15 |
| T17 | Lembrete por notificação push | T6, T15, T16 | M | Sim, com T19 e T20 |
| T18 | Conta demo | T5, T6, T10 | M | Sim, com T12 e T16 |
| T19 | Micro-interações e vibração | T12, T13 | P | Sim, com T17 e T20 |
| T20 | Acessibilidade e E2E finais | T13, T14 | M | Sim, com T17 e T19 |
| T21 | Mascote animado no Rive (cortável) | T12 + arquivo `.riv` | M | Sim, com T22 |
| T22 | Deploy final, README e vídeo | T17 a T20 | P | Sim, com T21 |

## Detalhe dos tickets

| # | Objetivo e áreas | Critérios de aceite | Como verificar |
| --- | --- | --- | --- |
| T1 | pnpm workspaces com `apps/web`, `apps/api` e `packages/core`; TypeScript, lint, Vitest, Playwright, CI no GitHub Actions; versões confirmadas; hospedagem escolhida; deploy do esqueleto. | CI verde num PR vazio; web e API no ar respondendo; versões e hospedagem anotadas na spec; o E2E sobe os servidores com `node` direto, sem `pnpm --filter`. | Abrir as URLs; ver o pipeline. |
| T2 | `packages/core`: tipos dos eventos, regras de recorrência (RF03, RF05), data local do dia com virada configurável e janela de edição (RF12, RF13). TDD. | CA03 e CA08 passam. | `pnpm test` do core; revisar casos de borda de fuso e virada. |
| T3 | `packages/core`: nota, arredondamento, faixas, sequência e médias (RF08, RF09, RF14). TDD. | CA05, CA06 e CA09 passam. | Testes do core; a fórmula fica isolada num arquivo só. |
| T4 | `apps/api`: Postgres com Drizzle, migrações, Better Auth (cadastro, login, sessão, sair) (RF01). | Testes de integração de cadastro e login; senha nunca aparece em log. | Testes da API; criar conta pela rota. |
| T5 | `packages/core`: projeções (tarefas do dia, dias, histórico) a partir do log, com ordem determinística (D4). TDD. | O mesmo log em ordens diferentes gera a mesma projeção; reprocessar todo o log com outra fórmula funciona; `LocalDate` tipada (D10); `compareEvents` num arquivo só; teste de propriedade sobre a projeção inteira, com semente fixa; teste que distingue evento no log de evento na projeção. | Testes com ordens aleatórias. |
| T6 | `apps/api`: tabela `events`, `POST /sync/push` idempotente, `GET /sync/pull` por cursor, só com sessão válida. | Reenvio não duplica e devolve o `server_seq` também dos ids que já existiam; trava por usuário (D9); pull paginado; parsers de `date` e `int8` no boot; teste compara campo a campo o JSON enviado e o recebido; o pull devolve só os eventos do próprio usuário, em ordem de `server_seq`. | Testes de integração; conferir no diff a checagem de `user_id`. |
| T7a | `apps/web`: tokens do design system no Tailwind, fonte, shadcn/ui; Button, Checkbox, Chip, SegmentedControl, BottomNav e o layout com rotas vazias. | Componentes iguais às regras de `docs/design-system/`; navegação entre rotas. | Comparar com o design system. |
| T7b | `apps/web`: ScoreRing, Mascote (4 SVGs), DayPill, HistoryCalendar, TaskRow. | Espessura e cor do anel por faixa; o mascote troca de expressão pela nota. | Página de componentes com as 4 faixas. |
| T8 | `apps/web`: banco Dexie (`events`, `outbox`, `meta`), uma função única para registrar eventos e hooks reativos de projeção. | Registrar um evento atualiza a projeção na tela; os dados sobrevivem à recarga; consultas por índice em `local_date`, sem carregar o log inteiro; `liveQuery`; dados remotos entram sem sobrescrever eventos existentes; `recordEvent` é a única porta de escrita. | Testes com IndexedDB simulado; DevTools, aba Application. |
| T9 | `apps/web`: cliente de sincronização (envio da fila, pull por cursor, nova tentativa com espera crescente), indicador offline e sincronizando, `storage.persist`. | CA10 passa com folga (D11); 401 aparece como sessão expirada, não como offline; o cursor nunca volta para trás; sem ciclos sobrepostos. | E2E com dois contextos e rede desligada. |
| T10 | `apps/web`: telas de login e cadastro, proteção das rotas, sair, id do aparelho. | CA01 passa. | E2E de login. |
| T11 | `apps/web`: tela Tarefas: criar, editar, arquivar, recorrência, peso, ordem por arrastar (RF03 a RF05). | O formulário valida nome e peso; arrastar gera `task_reordered`. | E2E de criação e edição; teste manual no celular. |
| T14 | `apps/web`: tela Histórico com seletor semana/mês, calendário, médias e sequências (RF15). | Cores e médias batem com as projeções para um log de teste. | E2E com log fixo. |
| T12 | `apps/web`: tela Hoje (RF06, RF07). | CA04 passa; layout igual a `docs/telas/hoje.dc.html`. | E2E offline; comparação visual. |
| T15 | `apps/web`: manifest, service worker, cache da interface (RF18). | CA11 passa. | Lighthouse; abrir em modo avião. |
| T16 | `apps/web`: Perfil e ajustes; evento `settings_updated` (RF20). | Mudar o horário da virada muda o dia local nas projeções. | E2E de ajustes. |
| T13 | `apps/web`: tela de Fechamento, gatilhos, virada automática e resumo do dia anterior (RF10 a RF13). | CA07 passa; layout igual a `docs/telas/fechamento.dc.html` nas 4 faixas. | E2E com relógio simulado. |
| T17 | `apps/api` e `apps/web`: Web Push (chaves VAPID, inscrição, job agendado que usa o `packages/core`) (RF19). | CA12 passa. | Teste com relógio simulado; teste manual com o app instalado. |
| T18 | `apps/api`: conta demo com 30 dias de eventos, rota `/api/demo`, restauração diária; botão na tela de login (RF02). | CA02 passa. | E2E "Entrar como demo"; rodar o job manualmente. |
| T19 | `apps/web`: Motion no check, no anel e no número; vibração; "reduzir movimento" (RF21). | Com "reduzir movimento" ligado, sem bounce nem partículas. | Teste manual nos dois modos. |
| T20 | Verificação com axe, E2E do fluxo completo e ajustes de contraste e rótulos (RF23). | CA13 e CA14 passam. | Relatório do axe na CI. |
| T21 | `apps/web`: mascote no Rive com a entrada "nota" (RF22). Depende do arquivo `.riv`. | As 4 expressões trocam pela nota; com "reduzir movimento", fica parado. | Teste manual; tamanho do bundle no PR. |
| T22 | Deploy final, README com arquitetura e decisões, vídeo de 1 minuto. | A métrica de sucesso do resumo está cumprida. | Checklist final. |

## Plano de execução

No máximo 3 agentes ao mesmo tempo; os tickets de uma mesma onda mexem em pastas ou arquivos diferentes. Uma onda só começa depois que a anterior passou na revisão.

1. **Onda 0:** T0 — concluído.
2. **Onda 1:** T1, sozinho.
3. **Onda 2:** T2, T3 e T4 (T2 e T3 em arquivos separados dentro de `packages/core`).
4. **Onda 3:** T5, T6 e T7a.
5. **Onda 4:** T7b, T8 e T10.
6. **Onda 5:** T9, T11 e T14.
7. **Onda 6:** T12, T16 e T18.
8. **Onda 7:** T13 e T15.
9. **Onda 8:** T17, T19 e T20.
10. **Onda 9:** T21 (cortável) e T22.

Os tickets de `packages/core` (T2, T3 e T5) seguem TDD. T6 começa pelos testes de integração e T9, pelo E2E com dois contextos.

## Revisão

Cada ticket vira um PR e só entra na branch principal quando:

- a CI está verde (lint, tipos, testes unitários e o E2E do ticket);
- os critérios de aceite e a verificação manual foram conferidos;
- uma segunda IA revisou o diff (a definir), procurando: regra de negócio fora do `packages/core`, eventos editados ou apagados (proibido), consultas sem filtro por `user_id` e cores fora dos tokens.

Se a revisão achar um erro na spec, a spec é corrigida antes de seguir. Um PR que passar de ~500 linhas de lógica volta para ser quebrado em dois.
