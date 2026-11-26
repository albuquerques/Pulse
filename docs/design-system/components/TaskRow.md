# TaskRow

Linha de tarefa da tela Hoje: checkbox, nome e uma linha de detalhes.

## Conteúdo
- Nome da tarefa em `body`.
- Detalhes em `caption`, cor `ink-muted`: recorrência e peso ("Todo dia · peso 3").

## Estados
- **Pendente:** nome em `ink`.
- **Concluída:** nome em `ink-muted` com risco.

## Medidas
Fundo `surface-1` sobre `surface-0`, raio `radius-lg`, padding 10 × 14, altura mínima 52, espaço de 8 entre linhas.

## Comportamento
Tocar no checkbox conclui; tocar no resto da linha abre a edição da tarefa. Tarefas concluídas continuam na posição em que estavam: a lista não pula.
