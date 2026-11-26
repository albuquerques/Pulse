# Pulse

Pulse é um app de rotina em que concluir tarefas é satisfatório e cada dia termina com uma nota de 0,0 a 10,0. A identidade é vívida e lúdica, mas nunca infantil: lilás claro, roxo e verde-limão, com o mascote Pulse como rosto do produto.

Esta é a primeira versão do sistema, criada a partir das decisões de produto (sem código ou arquivos de marca anteriores). Valores podem mudar quando as telas forem desenhadas no Figma.

## Princípios

- **Recompensa, nunca punição.** Nota baixa recebe calma e acolhimento ("amanhã é outro dia"), nunca vermelho, alerta ou tristeza. `danger` é só para erros do sistema.
- **A nota se lê de relance.** Três camadas mostram a faixa ao mesmo tempo: a expressão do mascote, a cor do corpo e a espessura e cor do anel.
- **O verde-limão é especial.** `lime` aparece só em recompensas (sequência de dias, faixa alta, brilhos). Se estiver em todo lugar, deixa de recompensar.
- **Separar por superfície, não por linhas.** Cartões `surface-1` sobre `surface-0`; `border` só quando a superfície não basta.

## Voz

Português do Brasil, curto, caloroso, na segunda pessoa ("você"). Verbos primeiro nos botões: "Fechar o dia", "Nova tarefa". Mensagens do fechamento por faixa: "Amanhã é outro dia", "Bom ritmo", "Dia forte", "Dia perfeito". Sem exclamações em excesso, sem culpa.

## Cores

- Fundo `surface-0`, cartões `surface-1`, trilhos e áreas de apoio `surface-2`.
- Texto `ink`; apoio e tarefas concluídas `ink-muted` com risco.
- Ação principal `primary` com texto `on-primary`; hover `primary-strong`. Uma ação principal por tela.
- Recompensa `lime` com texto `on-lime`.
- Borda de controles vazios (checkbox pendente, campos) em `control-border`, com contraste de pelo menos 3:1.
- O tema escuro é o mesmo sistema em índigo profundo; todos os tokens trocam juntos.

## A nota e o mascote

| Faixa | Nota | Anel | Espessura | Corpo / base do mascote | Expressão |
| --- | --- | --- | --- | --- | --- |
| Baixa | 0,0 a 4,9 | `score-low` | `ring-low` | `score-low-body` / `score-low-shade` | Sonolento: pálpebra caída, pupila para baixo, boca "o", zzz |
| Média | 5,0 a 6,9 | `score-mid` | `ring-mid` | `score-mid-body` / `score-mid-shade` | Olhando de lado, sorriso leve |
| Alta | 7,0 a 9,9 | `score-high` | `ring-high` | `score-high-body` / `score-high-shade` | Olhos fechados de alegria, boca aberta, bochechas `blush`, mãos |
| Perfeita | 10,0 | `score-perfect` | `ring-perfect` | `score-perfect-body` / `score-perfect-shade` | Olhos de estrela, pulando, topete `lime`, brilhos |

O mascote Pulse tem corpo de marshmallow (cantos bem arredondados, laterais levemente infladas, base reta), um topete em forma de batimento, olhos ovais grandes com pupila móvel e um tom escuro na base (`score-*-shade`) para dar volume. Ele mora no centro do anel. Na nota perfeita as cores se invertem (corpo roxo, anel verde): esse visual não aparece em nenhum outro lugar. A referência de construção (peças, medidas e as quatro expressões) é a folha de construção do mascote no Claude Design; as figuras do grupo **Mascote** e o componente `Mascote` seguem essa folha.

## Componentes

Cada componente tem prévia e regras de uso; as telas Hoje e Fechamento do dia no Claude Design mostram todos juntos.

- **Ações:** `Button` (principal, secundário, escuro), `Checkbox`.
- **Tarefas:** `TaskRow`.
- **Nota:** `ScoreRing`, `Mascote`, `Chip` (sequência e faixas).
- **Histórico:** `DayPill`, `HistoryCalendar`, `SegmentedControl`.
- **Navegação:** `BottomNav`.

Telas de Histórico e Tarefas ainda não foram desenhadas: devem nascer no código a partir destes componentes.

## Tipografia

Uma família, **Bricolage Grotesque** (Google Fonts, pesos 400 a 700), com números tabulares na nota para ela não "pular" ao contar. Nota em `score-xl` (fechamento) e `score-lg` (tela Hoje); interface em `title`, `heading`, `body`, `body-strong`, `label` e `caption`.

## Forma e espaço

Cantos generosos: `radius-md` em linhas de tarefa e botões, `radius-lg` em cartões, `radius-full` em chips e checkbox. Espaçamento em passos de 4px (`space-1` a `space-8`); o anel da nota ganha `space-8` de respiro.

## Movimento

- **Rápido (120ms):** toque, hover, check aparecendo.
- **Base (240ms):** anel subindo, número contando, troca de expressão.
- **Celebração (600 a 1200ms):** fechamento do dia, só nesta tela.
- Curva padrão com leve "overshoot" nas recompensas; saídas sem bounce.
- Mascote: piscar e respirar em repouso, no Rive, com a nota como entrada.
- Com "reduzir movimento" ativo: sem partículas nem bounce, só troca de estado com fade.

## Iconografia

Ícones de traço arredondado (Lucide ou Phosphor), 20px na interface, traço em `ink` ou `ink-muted`. Sem emoji na interface; o único rosto do app é o mascote.

## Acessibilidade

Texto com contraste mínimo de 4,5:1 nos dois temas (`ink-muted` sobre `surface-0`: 5,4:1; `on-primary` sobre `primary`: 5,0:1). A faixa nunca é comunicada só por cor: a expressão e o número sempre acompanham.
