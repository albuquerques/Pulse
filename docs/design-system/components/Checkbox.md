# Checkbox

Círculo que conclui uma tarefa com um toque; é o controle mais usado do app.

## Estados
- **Pendente:** borda 2,5 px `control-border` sobre `surface-1`.
- **Pressionado:** sem borda, `surface-2`, escala 90%.
- **Concluído:** `primary` com check `on-primary`.

## Medidas
32 px na prancha de componentes, 28 px dentro da linha de tarefa; área de toque sempre de 44 px.

## Movimento
Toque: encolhe a 90% em 120 ms, enche de roxo e o check se desenha em 240 ms. Ao concluir, o anel da nota sobe na mesma hora. Desfazer é tocar de novo.

## Acessibilidade
É um botão com `aria-label` ("Concluir tarefa" / "Desmarcar tarefa"), nunca um div clicável. Com "reduzir movimento", só troca de estado.
