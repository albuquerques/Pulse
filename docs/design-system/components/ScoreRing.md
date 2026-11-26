# ScoreRing

Anel que mostra a nota do dia de 0 a 10; na tela Hoje, o mascote Pulse fica no centro dele.

## Faixas
| Faixa | Nota | Cor | Espessura |
| --- | --- | --- | --- |
| Baixa | 0,0 a 4,9 | `score-low` | `ring-low` |
| Média | 5,0 a 6,9 | `score-mid` | `ring-mid` |
| Alta | 7,0 a 9,9 | `score-high` | `ring-high` |
| Perfeita | 10,0 | `score-perfect` | `ring-perfect` |

Trilho em `surface-2`. O progresso é a nota ÷ 10, começando no topo e com pontas arredondadas.

## Movimento
Ao concluir ou desfazer uma tarefa, o anel anima até o novo valor em 240 ms e o número conta junto. Ao cruzar 5, 7 e 9, um pulso curto marca a troca de faixa.

## Acessibilidade
`role="img"` com o rótulo "Nota 7,8". A faixa nunca depende só da cor: o número e a expressão do mascote acompanham.
