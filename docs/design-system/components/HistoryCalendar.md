# HistoryCalendar

Calendário mensal do histórico, com cada dia colorido pela faixa da nota.

## Conteúdo
Cabeçalho com o mês e a média do mês; semana começando na segunda (S T Q Q S S D); células de 36 px com raio `radius-md`.

## Estados da célula
Mesmos do `DayPill`: cor da faixa nos dias passados, anel `primary` em hoje, borda `border` nos futuros. Dias sem tarefas ficam como futuros (sem cor), sem quebrar a sequência.

## Comportamento
Tocar num dia abre o resumo. Acima do calendário, o `SegmentedControl` alterna entre semana, mês e ano.
