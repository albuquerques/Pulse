# Hospedagem do Pulse

**Status:** recomendação do T1, aguardando aprovação. Nenhuma conta foi criada e nada foi
publicado. Pesquisa feita em 26/11/2026.

**Recomendação: Fly.io servindo a interface pelo próprio processo da API, com o Postgres no Neon
Free.** Custo esperado: **US$ 0 a 2 por mês**.

## O que precisa ser hospedado

1. A interface, que é um pacote de arquivos estáticos (build do Vite).
2. A API Node, que é um processo persistente (Hono) e precisa rodar um job agendado — o lembrete
   da RF19 e a restauração da conta demo da RF02.
3. O Postgres.

## O critério que decide

**`/api` tem que sair da mesma origem da interface em produção.** O login do T4 usa Better Auth com
cookie de sessão; origens diferentes significam `SameSite=None`, CORS com credenciais e exposição
ao bloqueio de cookies de terceiros no Safari. É problema evitável, e o protótipo já mostrou que a
mesma origem também é o que deixa o E2E simular a API fora do ar sem derrubar o servidor de
desenvolvimento (recomendação T9-6 do `prototype/RESULTADO.md`).

Os outros critérios: custo mensal no uso do MVP, se o plano gratuito dorme e quanto demora para
acordar, e suporte a job agendado.

## Comparação

| Opção | Papel | Custo no uso do MVP | Dorme? | Job agendado | Mesma origem para `/api` |
| --- | --- | --- | --- | --- | --- |
| **Fly.io** | API + interface | `shared-cpu-1x` 256 MB a **US$ 2,19/mês**, dentro dos **US$ 5/mês** de uso do plano Free (com cartão; sem cartão são US$ 1 de crédito e até 3 máquinas) | Só se o auto-stop for ligado | No próprio processo Node, que é persistente | **Nativo**: um domínio só, sem proxy |
| **Railway** | API + Postgres | Hobby a **US$ 5/mês** com US$ 5 de crédito de uso; o plano Free dá US$ 1/mês | **O Free dorme** em 5 a 10 min sem tráfego e acorda na requisição seguinte; Hobby e Pro ficam sempre de pé | O cron da plataforma exige um processo que **encerra**, então não serve para a API; o job fica dentro do processo | Precisa de domínio próprio e roteamento configurado |
| **Neon** | Postgres | Free: 1 GB por projeto, 20 GB na conta, 100 CU-h/mês. Pago (Launch) a US$ 0,106/CU-h | **Suspende em 5 min** e isso **não pode ser desligado** no Free; religa em centenas de milissegundos | — | — |
| **Cloudflare Pages** | Interface | Free | Não | — | **Não resolve**: o `_redirects` só faz proxy para caminhos do próprio site, não para origem externa. Exigiria uma Pages Function ou um Worker |
| **Netlify** | Interface | Free | Não | — | Faz proxy com status 200 para origem externa; timeout de 26 s por requisição |
| **Vercel** | Interface | Hobby é **só para uso não comercial** | Não | **Uma vez por dia** no Hobby, com precisão de hora | Faz proxy por `rewrites` |

## Por que Fly.io com a interface dentro da API

**1. A mesma origem deixa de ser um problema a resolver.** O Hono serve os arquivos do build com
fallback de SPA. A interface e `/api/*` saem do mesmo domínio por construção: nenhum proxy, nenhuma
regra de reescrita, nenhum cabeçalho de CORS, nenhuma dúvida sobre `SameSite`. É uma peça a menos
para manter e um modo de falhar a menos no T4.

O custo é não ter CDN na frente dos arquivos. A decisão D5 da spec já diz que o app fica atrás de
login e não tem SEO, e o T15 vai colocar um service worker que serve a interface do cache local.
Para um MVP de portfólio com um usuário, não há o que ganhar com CDN aqui.

**2. O custo fica perto de zero.** Uma máquina `shared-cpu-1x` de 256 MB custa US$ 2,19/mês contra
os US$ 5/mês de uso que o plano Free cobre, e o Postgres sai da conta por ficar no Neon.

**3. O job agendado mora no processo da API**, que é persistente e sempre de pé. Nenhuma das outras
opções faz isso melhor: o cron do Railway precisa de um processo que encerra — incompatível com um
servidor HTTP, segundo a própria documentação — e o do Vercel Hobby roda uma vez por dia, o que não
atende um lembrete com horário configurável.

**4. O que elimina cada descartada:**

- **Vercel**: licença Hobby só para uso não comercial e cron uma vez por dia.
- **Cloudflare Pages**: justamente o critério que mais importa. `_redirects` não faz proxy para
  origem externa; daria para resolver com uma Function, mas é código a mais para manter só para
  obter o que o Fly dá de graça.
- **Netlify**: funciona (proxy com status 200), mas acrescenta uma segunda plataforma e um timeout
  de 26 s para resolver um problema que desaparece ao servir tudo de um processo.
- **Railway Free**: dorme em 5 a 10 minutos. Para um app offline-first isso não quebra nada, mas
  o Hobby a US$ 5/mês é mais caro que o Fly para o mesmo resultado.
- **Postgres no Railway**: junta banco e API no mesmo orçamento de crédito; o Neon Free sai de graça.

## Riscos registrados

| Risco | Efeito | Plano |
| --- | --- | --- |
| O Neon Free suspende em 5 min e não dá para desligar | O primeiro `push` depois de uma pausa paga algumas centenas de milissegundos | Aceitável: nada na interface espera o servidor (regra 6 da arquitetura). Se incomodar, o Launch custa a partir de US$ 0,106/CU-h |
| Os US$ 5/mês de uso do Fly são política de plano, não contrato | A conta pode passar a cobrar | Acompanhar o painel no primeiro mês; o teto é baixo (US$ 2,19) |
| Servir arquivos estáticos pelo Node é mais lento que um CDN | Primeiro carregamento um pouco mais lento | O T15 põe a interface no cache do service worker; medir no Lighthouse do CA11 |
| Uma máquina só, sem redundância | Queda derruba a sincronização | O app continua funcionando offline; a fila de envio drena quando a API volta |

**Plano B**, se o deploy no Fly travar: Railway Hobby a US$ 5/mês com a API e o Postgres no mesmo
projeto, mantendo a interface servida pelo processo da API.

## O que depende do Ricardo

Nada foi feito ainda. Depois da aprovação:

1. Criar a conta no Fly.io e adicionar cartão (é o que libera os US$ 5/mês de uso).
2. Criar a conta no Neon e um projeto Postgres.
3. Rodar o `fly launch` inicial, que cria o app e escolhe a região (`gru`, São Paulo).
4. Guardar `DATABASE_URL` e o segredo de sessão como segredos do Fly, e o token de deploy como
   segredo do GitHub.

Eu preparo `fly.toml`, `Dockerfile`, o `serveStatic` na API e o workflow de release depois disso.

## Fontes

- [Fly.io — pricing](https://docs.fly.io/about/pricing)
- [Neon — pricing](https://neon.com/pricing)
- [Railway — pricing](https://railway.com/pricing)
- [Railway — cron jobs](https://docs.railway.com/reference/cron-jobs)
- [Netlify — rewrites e proxies](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/)
- [Cloudflare Pages — redirects](https://developers.cloudflare.com/pages/configuration/redirects/)
- [Vercel — uso e preço de cron jobs](https://vercel.com/docs/cron-jobs/usage-and-pricing)
