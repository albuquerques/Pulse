# Pulse

App de rotina web (PWA) em que cada dia recebe uma nota de 0,0 a 10,0. Funciona 100% offline e sincroniza entre aparelhos. Projeto de portfólio do Ricardo.

## Fontes da verdade

- **Spec do MVP:** https://claude.ai/artifact/NtiyyPPXCpEiLi4BryoD24 (requisitos RF, critérios CA, decisões D, tickets T e ondas).
- **Design system Pulse:** https://claude.ai/artifact/JYhRvC36pk39znP9oQRgRd (tokens e componentes).
- **Telas de referência:** https://claude.ai/artifact/AFjviLeMRVpY1oA1wa82S4 (página "v1 · Chapado").

Se o código e a spec discordarem, pare e avise. A spec é corrigida primeiro.

## Como trabalhamos

- Um ticket por vez, um PR por ticket, até ~500 linhas de lógica (testes, docs e config não contam). Passou disso: proponha quebrar.
- Comece em modo plan: liste arquivos, passos e testes antes de escrever código.
- Regra de negócio testável segue TDD: escreva o teste a partir dos critérios de aceite, veja falhar, implemente até passar.
- Não mexa em arquivos fora das áreas do ticket. Não adicione dependência sem dizer por quê.
- Não invente versões de bibliotecas: confira a versão instalada ou a documentação atual.
- Ao terminar: rode lint, tipos e testes; descreva no PR o que mudou, como verificar e o que ficou de fora.

## Regras de arquitetura (não negociáveis)

1. **Eventos são imutáveis.** Toda mudança é um evento novo com `id` (uuid) gerado no aparelho. Nunca edite nem apague eventos.
2. **Estado é projeção.** Nota, faixas, sequência e histórico são calculados a partir do log de eventos.
3. **Ordem determinística.** Projeções ordenam por `client_ts` e, no empate, por `id`. O mesmo log em qualquer ordem de chegada gera o mesmo resultado.
4. **Regra de negócio só em `packages/core`**, sem depender de interface, banco ou rede. Web e API importam dele.
5. **Toda consulta no servidor filtra por `user_id`** da sessão. Nunca confie em `user_id` vindo do cliente.
6. **Offline primeiro.** A interface lê e escreve no IndexedDB; a rede só sincroniza. Nenhuma ação do usuário espera o servidor.
7. **Data do dia vai no evento** (`local_date`), calculada no momento da ação com a virada configurada (padrão 04:00).

## Estrutura (a partir do T1)

- `apps/web`: PWA em React + Vite + TanStack Router + Tailwind + Dexie.
- `apps/api`: Hono + Postgres (Drizzle) + Better Auth.
- `packages/core`: eventos, recorrência, nota, faixas, sequência, projeções.
- `prototype/`: código descartável do T0. Não importe nada dele.

## Interface

- Texto da interface em português do Brasil. Código, nomes de variáveis e commits em inglês.
- Cores, raios, espaçamentos e fonte só pelos tokens do design system. Nada de hex solto.
- Contraste mínimo 4,5:1 em texto e 3:1 em controles; botões reais com `aria-label`; respeitar "reduzir movimento".

## Comandos

Definidos no T1. Atualize esta seção quando existirem (instalar, dev, testes, lint, E2E, migrações).
