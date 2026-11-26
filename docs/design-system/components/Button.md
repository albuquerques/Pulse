# Button

Botão de ação do Pulse, em três variantes: principal, secundário e escuro.

## Variantes
- **Principal** (`primary` + `on-primary`): a ação mais importante da tela, como "Fechar o dia". No máximo um por tela.
- **Secundário** (`surface-2` + `ink`): ações de apoio, como "Nova tarefa".
- **Escuro** (`ink` + `surface-0`): substitui o principal sobre fundos coloridos de faixa, como no fechamento do dia.

## Medidas
Altura 52 px (mínimo 44 de área de toque), padding lateral `space-6`, raio `radius-md`, texto `body-strong`. Botões de largura total dentro de telas usam a mesma altura.

## Estados
Pressionado: escala 96% em 120 ms e cor `primary-strong`. Sem estado desabilitado: se a ação não pode acontecer, explique na tela em vez de apagar o botão.

## Não fazer
- Dois botões principais lado a lado.
- Botão principal sobre fundo `lime` ou `primary` (use o escuro).
