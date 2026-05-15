const fs = require('fs');
let devContent = fs.readFileSync('docs/SDD-dev.md', 'utf8');
if(devContent.charCodeAt(0) === 0xFEFF) { devContent = devContent.slice(1); }
devContent = devContent.split('## RF07')[0].trim();

const newSection = `

## RF07 - Geração de CSS

O sistema deve gerar o CSS correspondente ao layout processado, utilizando como base a árvore normalizada e as marcações de classe (className) oriundas da etapa de refinamento (RF06.1).

### Regras de Tokens Visuais (Design Tokens)
- O sistema deve varrer o projeto para extrair um dicionário de cores (Fills, Strokes e textos) utilizadas repetidamente.
- Cores de alta repetição devem ser nomeadas utilizando heurísticas semânticas simples (ex: --color-primary, --color-surface).
- Outras cores devem receber nomes baseados em matizes aproximadas (ex: --color-blue-500, --color-gray-100). Deve-se evitar o uso excessivo de literais hexadecimais puros no nome da variável.
- Outras propriedades (como tipografia e espaçamento) não exigem tokenização estrita nesta primeira versão.

### Regras de Nomenclatura e Sincronia
- As classes CSS geradas devem ter exata paridade com as classes produzidas na etapa de HTML (RF06.1).
- O processo de refino (RF06.1) passará a injetar a propriedade de classe diretamente no nó estrutural (node.className), garantindo que tanto o gerador de HTML quanto o de CSS leiam a mesmíssima fonte de verdade sem recálculos.
- O gerador de CSS deve aplicar desduplicação (merger). Propriedades oriundas de nós com a mesma classe devem ser aglutinadas em um único bloco limpo no arquivo final.

### Regras de Layout e Posicionamento
- Evitar o uso de estilos inline (style=""), priorizando classes externas.
- **Com Auto Layout:** Nós do Figma com Auto Layout devem gerar display: flex, com mapeamento exato de gap, padding e alinhamentos (justify-content, align-items).
- **Sem Auto Layout:** Elementos soltos (coordenadas absolutas) NÃO devem ser renderizados usando position: absolute. O sistema deve inferir display: flex base e deduzir margens (margin) para simular a posição visual através de fluxo relativo, viabilizando melhor comportamento responsivo.

### Resultado
- O sistema retorna um arquivo/string CSS limpo, contendo declaração de tokens no :root e regras flexbox/margin otimizadas, preparado para renderização e exportação.
`;

fs.writeFileSync('docs/SDD-dev.md', devContent + newSection, 'utf8');
