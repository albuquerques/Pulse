# BottomNav

Navegação principal: uma pílula escura flutuante no rodapé das telas.

## Itens
Hoje, Histórico, Nova tarefa (+), Tarefas e Perfil, sempre nessa ordem.

## Estados
- **Ativo:** círculo `lime` com ícone `on-lime`.
- **Inativo:** ícone em `score-mid-body` sobre `ink`.
- **Adicionar:** sempre `primary`, um pouco mais largo (56 px).

## Medidas
Fundo `ink`, raio `radius-full`, padding 8, itens de 48 px. Fica 16 px acima da borda inferior e não esconde o último item da lista (o conteúdo ganha espaço extra embaixo).

## Ícones
Traço 2 com pontas arredondadas, no estilo Lucide, 22 px.

## Acessibilidade
`nav` com `aria-label`; cada item com `aria-label` e o ativo com `aria-current="page"`.
