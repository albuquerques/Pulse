# Telas de referência

Exportadas do canvas "Pulse — Telas e componentes" (página "v1 · Chapado") no Claude Design.

- `hoje.dc.html`: tela Hoje (390 × 860).
- `fechamento.dc.html`: tela Fechamento do dia, com as 4 faixas em `renderVals()` (390 × 860).

Os arquivos usam o formato do Claude Design: HTML com `{{variáveis}}`, `<sc-for>` (repetição), `<sc-if>` (condição) e `<dc-import name="Pulse">` (o mascote). Não rodam sozinhos. Use-os para ler a estrutura, os textos, as medidas e as cores de cada tela. As cores devem ser mapeadas para os tokens de `docs/design-system/tokens.json`, não copiadas como hex.

O mascote no código vem de `docs/design-system/mascote/*.svg` (um SVG por faixa).
