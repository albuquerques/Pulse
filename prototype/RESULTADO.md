# T0 · Resultado

**Veredito: a sincronização própria se sustenta. O portão da Onda 0 está aberto — segue para o T1.**

Medido em 25/11/2026, macOS 27 (arm64), Node 26.10.0, pnpm 12.6.0, Postgres 18-alpine em
Docker (colima), Chromium 159 (Playwright 1.65.1). Esforço real: cerca de 3 h, bem abaixo do
limite de ~10 h.

Versões conferidas no registro, não supostas: hono 4.13.22, @hono/node-server 2.1.11,
dexie 4.4.7, vite 8.3.8, pg 8.23.1, typescript 5.9.3, @playwright/test 1.65.1.

## Critérios

| # | Critério | Resultado |
|---|---|---|
| 1 | A offline conclui 3 tarefas e a nota muda na hora | **Passou** — nota vai a 7,8 (7/9×10) sem nenhuma ida à rede; fila de envio em 3, `lastSeq` em 0 |
| 2 | B, online, conclui 1 tarefa diferente | **Passou** — nota 1,1 e fila drenada |
| 3 | A volta a ficar online: em até 5 s, A e B mostram os mesmos eventos e a mesma nota | **Passou** — 4 eventos e nota 8,9 nos dois lados |
| 4 | Reenviar o mesmo lote não duplica nada | **Passou** — o lote foi reenviado 3×; a contagem no Postgres ficou em 2 e o `accepted` voltou com os 2 ids nas três vezes |
| 5 | Recarregar A com a API inalcançável mantém os eventos e a nota | **Passou** — nota 4,4, 2 eventos e a fila intacta depois do reload; ao religar a API a fila drena sozinha |
| — | Propriedade: 20 ordens aleatórias dão sempre a mesma nota | **Passou** — mais 6 testes de unidade da nota e da virada do dia |

Total: 3 testes Playwright e 7 de unidade, verdes em 5 execuções seguidas.

### Tempo medido no critério 3

**1807–1813 ms** em cinco execuções (orçamento: 5000 ms). A variação é desprezível porque o
tempo é governado pelo `setInterval` de 2 s, não pela rede: A só descobre que voltou a ficar
online no próximo tique, e B só vê os eventos de A no tique seguinte ao dele.

O número bonito esconde um risco: no pior caso de fase os dois tiques se somam e a
convergência chega perto de **4 s** — 80% do orçamento, sem rede lenta nem lote grande no meio.
Passa, mas com pouca folga. Veja a recomendação T9-1.

## Problemas encontrados

### 1. O driver `pg` transforma `date` em `Date`, e isso quebrou a projeção (grave)

O sintoma eram os critérios 3 e 4 falhando juntos: A chegava aos 4 eventos, mas a nota ficava
presa em 7,8, e o re-push voltava 400.

A causa é uma só. O driver `pg` tem um parser para o tipo `date` e devolve um `Date` de
JavaScript. Ao serializar o pull, `local_date` virava `"2026-11-25T03:00:00.000Z"` em vez de
`"2026-11-25"`. Para o cliente, o evento passava a pertencer a um dia que não existe: ele
entrava no log (daí os 4 eventos) mas saía da projeção de hoje (daí a nota velha). E, reenviado
ao servidor, era rejeitado pela validação de formato.

Correção aqui: `select local_date::text as local_date`. O `client_ts` não tem o mesmo problema
porque já é convertido com `toISOString()`.

Isso vale tanto quanto os cinco critérios: **a dupla "evento entra no log mas desaparece da
projeção" é silenciosa.** Nada estourou, nenhum log apareceu; só a nota ficou errada. Sem o
teste de convergência olhando a nota, e não só a contagem de eventos, isso chegaria à produção.

### 2. O `webServer` do Playwright pendura quando o comando passa por `pnpm --filter`

A suíte terminava os três testes em ~11 s e o processo ficava vivo por minutos sem imprimir o
resumo das falhas. O `pnpm` não repassa o SIGTERM ao processo filho, então o Playwright esperava
para sempre pelos servidores. Com `command: "node src/index.ts"` + `cwd: "server"` o problema
sumiu. Não é bug do protótipo, mas vai doer no CI do T1 se repetirmos o padrão.

### 3. `bigserial` chega como string

`server_seq` vem do `pg` como `"1"`, não `1`. Convertido com `Number()` na borda do servidor.
Comparar essas strings — ou ordenar por elas — daria uma ordem lexicográfica errada a partir do
décimo evento. Já estava previsto, mas fica registrado.

### 4. `db.on("changes")` não existe no Dexie 4

É API do addon `dexie-observable`. O certo no Dexie 4 é `liveQuery`, que foi o que ficou.

## Recomendações

### T5 · Core: projeções a partir do log

- **T5-1.** Mantenha a projeção sobre um tipo de evento onde `local_date` é `string`
  `YYYY-MM-DD`, nunca `Date`. O problema 1 foi exatamente um `Date` entrando por uma borda que
  se dizia `string`. Vale um *branded type* (`type LocalDate = string & { __localDate: true }`)
  com uma única função de parse na fronteira, para o compilador cobrar.
- **T5-2.** `compareEvents` (ordem por `client_ts`, desempate por `id`) é a única fonte de ordem
  e merece ficar num arquivo só, exportada. Em `web/src/score.ts` ela já é o eixo de tudo.
- **T5-3.** O teste de propriedade das 20 ordens deve virar teste de primeira classe do
  `packages/core`, e rodar sobre a projeção inteira (tarefas do dia, dias, histórico), não só
  sobre a nota. Semente fixa, para que uma falha reproduza igual.
- **T5-4.** A projeção do dia precisa de um teste que distinga "evento no log" de "evento na
  projeção". Contar eventos não prova nada: o bug 1 passava nessa contagem.

### T6 · API: endpoints de sincronização

- **T6-1.** Normalize os tipos na saída: `local_date::text`, `client_ts` em ISO,
  `server_seq` em `Number()`. Melhor ainda, registre parsers explícitos no Drizzle/pg para
  `date` e `int8` no boot, de uma vez, em vez de lembrar disso em cada consulta.
- **T6-2.** Um teste de integração que compare o JSON do pull com o JSON que o cliente enviou,
  campo por campo. Esse teste pega o bug 1 na hora; nenhum teste de contagem pega.
- **T6-3.** O `insert ... on conflict (id) do nothing` seguido de um `select ... where id = any($2)`
  resolveu a idempotência com um round-trip a mais. Funciona e é simples; se virar gargalo, troque
  pelo `insert ... on conflict do nothing returning id, server_seq` unido a um select só dos que
  não voltaram. **Não** devolva só os recém-inseridos: o cliente precisa do `server_seq` dos ids
  que já existiam para limpar a fila depois de um reenvio.
- **T6-4.** O pull precisa de paginação de verdade. Aqui já tem `limit 500` com `hasMore`, e o
  cliente lacera até esvaziar. Sem isso, o primeiro pull de uma conta antiga trava a tela.
- **T6-5.** Com sessão real, `user_id` sai do `c.get("user")` e **nunca** do corpo. O protótipo já
  ignora o `user_id` do cliente; mantenha isso visível no diff do PR, como o ticket pede.
- **T6-6.** Vale um índice único `(user_id, server_seq)` e cuidado com o buraco de concorrência do
  `bigserial`: duas transações podem confirmar fora de ordem, e um cliente que leu até o seq N
  pode perder um evento de seq N-1 confirmado depois. No MVP (um usuário, lotes pequenos) o risco
  é baixo, mas é o calo clássico de cursor por sequência — anote como risco e, se aparecer, troque
  por um cursor de duas partes (`server_seq` + confirmação por transação).

### T8 · Web: camada Dexie

- **T8-1.** `recordEvent` como **única** porta de escrita, gravando o evento e a entrada na fila
  na mesma transação, funcionou bem. Mantenha essa assinatura e não deixe nenhum outro caminho
  escrever em `events`.
- **T8-2.** `liveQuery`, não `db.on("changes")` (problema 4). Uma `liveQuery` por projeção, com o
  cálculo puro vindo do `packages/core`.
- **T8-3.** Indexe `local_date`. No protótipo a tela faz `db.events.toArray()` e projeta tudo em
  memória — aceitável com 10 eventos, inviável com um ano de histórico. No T8 a consulta deve
  partir de `where("local_date").equals(hoje)` para a tela Hoje, e de um intervalo para o
  Histórico.
- **T8-4.** `ingestRemote` filtra por chaves já conhecidas antes do `bulkAdd`. Alternativa mais
  curta é `bulkPut`, mas ela **sobrescreveria** um evento existente, o que fere a regra 1
  (eventos são imutáveis). Fique com o filtro.
- **T8-5.** Chame `navigator.storage.persist()` — não está aqui e entra no T9/T15. Sem isso o
  Safari pode descartar o IndexedDB e o critério 5 deixa de valer no mundo real.

### T9 · Web: cliente de sincronização

- **T9-1.** O `setInterval` de 2 s é o que define a convergência, e no pior caso de fase chega a
  ~4 s (ver acima). Para o CA10 ter folga: sincronize também no `visibilitychange` e no `focus`,
  e considere um canal do servidor para o cliente (SSE no `/sync/stream`) em vez de depender só
  do intervalo. Se ficar no polling, 2 s com o app em foco e um intervalo maior em segundo plano.
- **T9-2.** A guarda de reentrância (`running` + `rerun`) é obrigatória. Sem ela os gatilhos
  (evento novo, `online`, intervalo) disparam ciclos sobrepostos que enviam o mesmo lote duas
  vezes. A idempotência do servidor salva do estrago, mas o desperdício é real.
- **T9-3.** Falta a espera crescente que o ticket do T9 pede. Aqui um erro só marca o estado como
  `offline` e espera o próximo tique de 2 s — ou seja, bate na API caída a cada 2 s, para sempre.
  Implemente o recuo exponencial com teto (2 s → 30 s) e zere no primeiro sucesso.
- **T9-4.** O cursor só avança (`if (lastSeq > after)`). Mantenha: uma resposta atrasada que
  chegue depois de uma mais nova não pode rebobinar o cursor e fazer o cliente reprocessar tudo.
- **T9-5.** Separe "API inalcançável" de "API respondeu erro". Um 500 ou um 401 precisam de
  tratamento diferente de um `fetch` que falhou: o indicador de offline mentir sobre um 401
  (sessão expirada) deixa a pessoa achando que é a internet dela.
- **T9-6.** `page.route("**/sync/**", r => r.abort())` com API e página na mesma origem (Vite com
  proxy) é o jeito de testar offline sem matar o servidor de desenvolvimento. Vale manter esse
  arranjo no `apps/web` para o CA10.

## O que este protótipo **não** provou

- Recarga sem rede nenhuma (não só com a API bloqueada): depende do service worker, é T15.
- Login e isolamento entre contas: T4 e T10. Aqui o `user_id` é fixo.
- Recorrência, fechamento do dia, virada automática, histórico: T2, T13, T14.
- Conflito de verdade, porque não existe: cada conta tem um usuário e eventos só são
  adicionados. Se um dia houver edição compartilhada, esta decisão (D1) precisa voltar à mesa.
- Volume. O maior log testado tem 4 eventos. O pull já pagina, mas nada aqui foi medido com
  milhares de eventos — e a tela projetando `toArray()` inteiro não escala (T8-3).
