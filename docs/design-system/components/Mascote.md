# Mascote

O Pulse, mascote e rosto do app, mostra a faixa da nota pela expressão, pela postura e pela cor.

## Expressões
| Faixa | Corpo | Rosto | Extras |
| --- | --- | --- | --- |
| Baixa | Amassado, inclinado −6°, `score-low-body` | Pálpebra caída, pupila para baixo, boca "o" | Topete murcho, zzz |
| Média | Normal, `score-mid-body` | Olhando de lado, sorriso leve | — |
| Alta | Esticado, inclinado +5°, `score-high-body` | Olhos fechados de alegria, boca aberta, bochechas | Mãos, traços de alegria |
| Perfeita | Esticado e pulando, `score-perfect-body` | Olhos de estrela, boca aberta | Mãos, topete `lime`, brilhos |

Cada corpo tem um tom escuro na base (`score-*-shade`).

## Construção
Toda expressão sai das mesmas peças: corpo de marshmallow, topete em forma de batimento (gira no pivô da base), olhos ovais com pupila móvel, bocas, mãos e efeitos. As medidas estão na folha de construção do mascote no Claude Design.

## Uso
- Tela Hoje: 96 px dentro do `ScoreRing`, reagindo em tempo real.
- Fechamento do dia: 224 px, protagonista da animação.
- Nunca menor que 48 px.

## Animação (Rive)
Um único personagem com a nota como entrada; as expressões são estados de uma state machine. Camadas: sombra, corpo, topete, olho_esq e olho_dir (branco, pupila, pálpebra), boca, bochechas, mãos, fx.
