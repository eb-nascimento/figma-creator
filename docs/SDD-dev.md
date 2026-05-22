# Figma Creator - SDD Vivo

## Introducao

O Figma Creator e um sistema para gerar telas do Figma utilizando MCP, com o objetivo de reduzir o tempo de desenvolvimento do front-end.

## Como este SDD sera atualizado

Este SDD sera mantido como um documento vivo. Cada atualizacao deve documentar apenas a feature enviada para implementacao naquele momento, evitando antecipar especificacoes completas do sistema antes que elas sejam necessarias.

## RF01 - Importacao de URL do Figma

O sistema deve permitir ao usuario inserir uma URL de um arquivo do Figma.

### Regras

- Validar dominio `figma.com`.
- Extrair `file_key` da URL.
- Rejeitar URLs invalidas ou inacessiveis.
- Utilizar autenticacao OAuth do Figma para acesso as APIs protegidas, quando necessario.

### Resultado

- Sistema identifica corretamente o projeto Figma e valida acesso conforme autenticacao do usuario.

## RF02 - Integracao com API do Figma (OAuth 2.0)

O sistema deve consumir a API oficial do Figma utilizando autenticacao via OAuth 2.0.

### Regras

- Implementar fluxo OAuth 2.0 do Figma.
- Utilizar `client_id` e `client_secret` para troca de `authorization code` por `access_token`.
- Armazenar `access_token` de forma segura no backend, em sessao ou banco criptografado.
- Suportar `refresh token` quando disponivel.
- Nao utilizar mais Personal Access Token como metodo principal.
- Tratar erros de autenticacao, expiracao e revogacao de token.

### Fluxo OAuth

- Usuario clica em "Conectar com Figma".
- Sistema redireciona para autorizacao no Figma.
- Usuario autoriza o acesso.
- Figma retorna `authorization code`.
- Backend troca `code` por `access_token` via `client_secret`.
- API passa a ser consumida com token do usuario.

### Resultado

- Sistema acessa a API do Figma de forma autenticada por usuario via OAuth 2.0.

## RF03 - Listagem de telas principais

O sistema deve listar as telas principais disponiveis no arquivo Figma para selecao do usuario.

### Regras

- Apenas frames principais devem ser exibidos.
- Exibir nome da tela.
- Exibir ID do frame.
- Exibir nome da pagina do Figma.
- Exibir preview em miniatura.
- Ordenacao deve seguir a estrutura original do Figma.
- Nao carregar detalhes internos completos nesta etapa.
- Dados completos da tela devem ser carregados apenas apos selecao do usuario.

### Resultado

- Usuario consegue identificar visualmente e selecionar corretamente a tela desejada para implementacao.

## RF04 - Selecao de frame

O usuario deve poder selecionar uma tela principal especifica retornada pela listagem de frames.

### Regras

- Apenas um frame pode ser selecionado por vez.
- A selecao deve ser enviada ao backend.
- O backend deve validar se o `frame_id` pertence ao arquivo Figma informado.
- O frame selecionado deve manter os metadados retornados pela RF03.
- A selecao nao deve carregar nem processar a estrutura interna completa do frame nesta etapa.
- A interface deve indicar carregamento enquanto a selecao esta sendo validada.
- A interface deve evitar multiplos cliques de selecao durante a validacao.

### Resultado

- Frame escolhido definido como alvo para as proximas etapas de processamento.

## RF04.1 — Normalização da Árvore do Figma

A árvore do Figma pode vir desorganizada, com groups, rectangles, vectors, layoutMode null e ordem dos children diferente da ordem visual. O sistema deve criar uma etapa de normalização antes do HTML/CSS.

### Regras

- Ordenar elementos por x/y/width/height, não apenas pela ordem dos children originais.
- Detectar regiões principais por geometria.
- Converter rectangles de fundo em estilo do container pai.
- Separar árvore visual refinada da árvore semântica.
- Gerar HTML/CSS a partir da árvore normalizada.

## RF05 - Extracao de estrutura de layout

O sistema deve buscar a estrutura interna do frame selecionado e converter os nodes do Figma em uma arvore simplificada para processamento posterior.

### Regras

- A extracao deve ocorrer apenas apos a selecao de um frame valido.
- O backend deve buscar o subtree do frame selecionado na API do Figma.
- O backend deve validar se o `frame_id` pertence as telas principais do arquivo informado.
- A estrutura deve preservar hierarquia, posicao e dimensoes dos nodes.
- Nodes invisiveis devem ser ignorados.
- A estrutura deve mapear tipos principais como frame, container, group, text, image, shape, component e node.
- Textos devem incluir conteudo e informacoes tipograficas basicas quando disponiveis.
- Estilos devem incluir informacoes basicas de preenchimento, borda, opacidade e raio quando disponiveis.
- A interface deve indicar carregamento enquanto a estrutura esta sendo extraida.
- A extracao nao deve gerar HTML ou CSS nesta etapa.

### Resultado

- Sistema retorna uma arvore normalizada do frame selecionado e um resumo com total de nodes e tipos encontrados.

## RF06 - Geracao de HTML

O sistema deve gerar uma estrutura HTML inicial a partir da arvore normalizada produzida pela RF04.1.

### Regras

- A geracao de HTML deve depender de uma estrutura previamente extraida.
- A hierarquia da arvore normalizada deve ser preservada no HTML.
- Nodes do tipo frame devem ser convertidos para `section`.
- Nodes de container, group, component, shape e node devem ser convertidos para `div`.
- Nodes de texto devem ser convertidos para tags textuais semanticas quando possivel.
- Nodes de imagem devem ser convertidos para `img` com `alt` baseado no nome do node.
- Textos devem ser escapados para evitar HTML invalido ou inseguro.
- Classes CSS devem ser geradas de forma previsivel a partir do tipo, nome e ID do node.
- O HTML gerado nao deve conter estilos inline.
- A geracao de CSS fica fora desta etapa e sera tratada na RF07.

### Resultado

- Sistema retorna um documento HTML inicial em string, pronto para ser usado pelas proximas etapas de geracao visual.

## RF06.1 - Interpretacao e refinamento semantico do HTML (Etapa Pré-CSS)

O sistema deve interpretar semanticamente a funcao dos elementos da tela antes da geracao visual. Esta etapa representa a **primeira camada de interpretação semântica**, sendo responsável por gerar uma base HTML inicial limpa, organizada, acessível e preparada para refinamentos posteriores com CSS, padrões visuais e IA.

### Regras gerais

- O refinamento deve usar o HTML gerado na RF06 e a estrutura normalizada da RF04.1 como referencia.
- As regras documentadas neste requisito representam os **critérios mínimos obrigatórios** da etapa pré-CSS. Refinamentos mais avançados (como nomeação final de classes, responsividade detalhada, componentização final, diferenciação avançada entre data grid/lista/grid e inferência completa de comportamento) poderão ser aprimorados em camadas posteriores.
- A etapa deve classificar os elementos em uma arvore logica composta por tela, layout, regioes, secoes, componentes, elementos internos e decoracoes.
- A classificacao nao deve depender apenas de aparencia, tamanho, cor ou posicao.
- A classificacao deve considerar relacao entre componentes, proximidade visual, repeticao de padroes, hierarquia, conteudo textual, agrupamento e comportamento esperado.
- Classes genéricas (como container, group, frame, layer, shape) devem ser substituídas por nomes funcionais, orientados ao papel do agrupamento na interface (ex: `sidebar-nav-group`, `summary-cards`, `form-fields`).
- Nomes genericos herdados do Figma, como `group`, `rectangle` e `vector`, devem ser removidos ou reduzidos quando possivel.
- Classes CSS devem ser legiveis e orientadas ao papel do elemento na interface.
- Classes de texto nao devem ser derivadas do conteudo exibido, como nomes, bancos, valores ou datas.
- Textos devem usar classes por papel, como `title`, `subtitle`, `label`, `text`, `value` ou classes de coluna quando estiverem em tabela.
- Elementos repetidos com a mesma funcao visual devem compartilhar a mesma classe sem sufixo numerico.
- IDs do Figma nao devem ser adicionados por padrao aos nomes de classe.
- IDs do Figma so devem ser usados em classes em uma etapa futura se houver necessidade concreta e justificada de diferenciacao.
- A primeira versao deve usar heuristicas locais e deterministicas.
- O refinamento deve permitir evolucao futura com IA para revisar semantica, nomenclatura e organizacao.
- O refinamento nao deve gerar CSS nesta etapa.
- O processo de interpretação deve ser totalmente agnóstico de domínio. Exceções e referências financeiras (como "movimentações", "entradas") servem apenas como exemplos. A solução deve interpretar padrões universais de interface (menus, formulários, botões, cards, tabelas, grids, etc) em qualquer tela do Figma, priorizando função, hierarquia e comportamento.

### Regras de classificacao semantica

- O sistema deve diferenciar titulos principais, titulos de secao, subtitulos, labels e textos comuns.
- O sistema deve diferenciar botoes de acao, botoes com icone, botoes de envio e botoes de navegacao.
- O sistema deve identificar formularios, campos de entrada, selects, comboboxes, radio buttons, checkboxes e textareas quando houver indicios suficientes.
- O sistema deve identificar e separar tabelas simples de data grids mais complexos.
- O sistema deve diferenciar menus laterais, menus superiores, menus inferiores e grupos de botoes.
- O sistema deve diferenciar cards informativos, cards de indicadores e cards puramente visuais.
- Cards estruturados com métricas/KPIs devem ser identificados como componentes de resumo (`summary cards`).
- A tela principal (root) jamais deve ser classificada como um único componente específico (como um summary card), devendo evitar consumir blocos maiores de layout acidentalmente.
- O sistema deve identificar padrões recorrentes e gerar componentes reutilizáveis como: sidebar, toolbar, data grid, form field, segmented control, summary card, button, icon button, content section, layout grid e card grid.
- O sistema deve diferenciar icones funcionais e icones meramente decorativos.
- O sistema deve diferenciar componentes funcionais e elementos puramente visuais.

### Regras de HTML semantico

- Menus laterais devem ser gerados preferencialmente com `aside` e `nav`.
- Menus fixados na lateral da tela devem ser classificados como sidebar, usando `aside` com `nav` interno.
- Menus superiores, inferiores ou grupos de navegacao devem usar `nav` quando houver funcao de navegacao.
- Formularios devem ser gerados com `form`.
- Botoes devem ser gerados com `button`.
- Acoes de envio identificadas, como salvar, devem usar `button` com `type="submit"` quando estiverem dentro de formulario.
- Campos devem usar `input`, `select` ou `textarea` conforme a funcao identificada.
- Campos de data devem ser gerados como `input type="date"` ou componente equivalente de date picker.
- Campos de valor monetario devem ser gerados como `input` com `inputmode="decimal"` quando forem editaveis.
- Campos de categoria e metodo devem ser gerados como `select` ou combobox quando forem opcoes selecionaveis. Sempre gerar um `option` inicial (ex: vazio, desabilitado ou com placeholder) caso exista uma indicação visual ou placeholder.
- Campos de descricao devem ser gerados como `textarea` quando forem editaveis.
- O formato de datas, quando detectado a partir de textos do Figma, deve ser convertido para o formato HTML padrao (ex: `yyyy-mm-dd`).
- Escolhas exclusivas, como "Entrada" e "Saída", devem ser geradas como radio group, segmented control ou toggle group, utilizando `<fieldset>` e `<input type="radio">`.
- Tabelas devem usar `table`, `thead`, `tbody`, `tr`, `th` e `td`.
- Grupos identificados como tabela, cabecalho e linha devem ser refinados para estrutura de tabela quando houver padrao tabular.
- Tabelas associadas a ações (como filtro, busca, paginação, ordenação ou carregamento) devem ser tratadas em conjunto como um Data Grid.
- A estrutura de um Data Grid deve conter, na ordem: cabeçalho da seção, toolbar de ações, wrapper da tabela, tabela semântica e ações secundárias.
- Ações secundárias (como botões "Mostrar mais" ou paginação) devem obrigatoriamente aparecer depois da tabela no DOM, independentemente da posição visual do design via CSS.
- Celulas de tabela devem usar classes de coluna, como `col-descricao`, `col-categoria`, `col-metodo`, `col-valor` e `col-data`.
- Cabecalhos de tabela devem receber `scope="col"` quando representarem colunas.
- Titulos devem respeitar hierarquia correta com `h1`, `h2` e `h3`.
- `h1` deve ser reservado para o titulo principal da tela ou de uma secao de alto nivel.
- Textos de botao, valores monetarios, labels, datas, opcoes e nomes de indicadores nao devem ser gerados como `h1`.
- Valores monetarios e indicadores devem usar elementos como `strong`, `span`, `p` ou `small`, conforme o papel semantico.
- Cards de indicadores devem usar estrutura como `article`, label em `span` e valor principal em `strong`.
- Textos internos de botoes devem ser renderizados como elementos neutros, como `span` com classe `button-label`, e nao como heading.
- Elementos `button` devem ser limitados a controles pequenos, com nome de acao, icone direto ou texto de acao.
- O refinamento deve evitar elementos `button` aninhados.
- Grupos que contem multiplas acoes devem permanecer como containers, nao como `button`.
- Containers grandes nao devem ser convertidos para `button` apenas por conterem icones em algum descendente.

### Regras para elementos decorativos

- Elementos decorativos como fundos, bordas, sombras, formas e camadas visuais devem ser convertidos preferencialmente em CSS.
- O HTML deve evitar `divs` desnecessarias para elementos genericos como `shape` ou `group` quando nao houver funcao semantica, estrutural ou interativa.
- Shapes decorativos sem conteudo, filhos ou funcao interativa devem ser omitidos do HTML refinado.
- Icones repetidos podem compartilhar a mesma classe base sem sufixo numerico.
- Icones funcionais devem receber classes padronizadas como `icon` e variacoes por funcao.
- Icones puramente decorativos devem ser marcados como decorativos em etapa de acessibilidade.
- Classes genericas como `group`, `shape` e `icon-graphic` devem ser evitadas quando for possivel identificar funcao real, como `sidebar-nav`, `filter-button`, `summary-card`, `movement-form`, `form-field`, `data-grid-toolbar` e `load-more-button`.

### Regras de acessibilidade

- O sistema deve evitar textos genéricos em labels e legends. Rótulos como "Opções" devem ser trocados por rótulos funcionais inferidos do contexto (ex: "Tipo de filtro", "Opções de status").
- Botões somente com ícone devem possuir `aria-label` descritivo.
- Ícones decorativos, especialmente quando acompanhados de texto descritivo no mesmo container ou botão, devem usar `aria-hidden="true"`.
- Campos de formulário devem possuir `<label>` explícito associado.
- Grupos de opções (como conjuntos de rádio ou checkboxes) devem usar `<fieldset>` e `<legend>`.
- A hierarquia de títulos (`h1`, `h2`, `h3`, etc) deve ser lógica e não deve pular níveis sem necessidade.
- Tabelas devem associar corretamente cabeçalhos e células através do atributo `scope` no `th` (`col` ou `row`).
- A ordem do DOM deve sempre priorizar leitura, acessibilidade e manutenção. Títulos e cabeçalhos de seção devem ser forçados a aparecer no DOM antes do conteúdo principal correspondente, garantindo a ordem semântica.
- Áreas importantes e regiões principais devem ser identificadas claramente com tags semânticas apropriadas: `<main>`, `<section>`, `<aside>`, `<header>`, `<footer>` ou `<nav>`, conforme a função estrutural do agrupamento.
- Quando uma `<section>` possuir um título claro, deve-se considerar o uso de `aria-labelledby` para associar estruturalmente a região ao seu heading correspondente.

### Regras de responsividade

- A interpretacao deve considerar adaptacao do layout para diferentes resolucoes.
- Layouts em colunas no desktop devem prever reorganizacao parcial em tablet.
- Secoes devem poder ser empilhadas no mobile quando necessario.
- Tabelas devem prever scroll horizontal ou conversao futura para cards em telas pequenas.
- Menus laterais devem poder evoluir para drawer, bottom navigation ou menu compacto.

### Regras de tokens visuais

- O refinamento deve preparar a extracao de tokens visuais a partir do Figma.
- Tokens devem incluir cores, tipografia, espacamentos, raios de borda, sombras, tamanhos e estados visuais dos componentes.
- Tokens devem ser reutilizados no codigo para evitar estilos repetitivos, inconsistentes ou acoplados a posicao exata dos elementos no Figma.

### Resultado

- Sistema retorna um HTML semanticamente refinado, organizado por componentes e preparado para a geracao de CSS da RF07.
- A entrega esperada nao deve ser uma reproducao estatica puramente visual, mas uma estrutura de codigo reutilizavel, acessivel, responsiva e sustentavel.

## RF07 - Geração Unificada de HTML e CSS (Single Source of Truth)

Para evitar divergência entre estrutura e estilo, a arquitetura do sistema exige que o HTML e o CSS sejam produzidos a partir de uma **mesma árvore intermediária refinada**.

### Fluxo de Geração

1. **Normalizacao Visual:** Ocorre na etapa de Normalizacao Visual (RF04.1), produzindo uma arvore ordenada por geometria com regioes e layouts inferidos.
2. **Refinamento da Árvore:** O sistema interpreta a árvore visual refinada e gera uma árvore semântica e visual consolidada, injetando as tags, classes, componentes, modificadores e tokens diretamente nos nós.
3. **Mutação Coordenada:** Se a análise visual/CSS exigir que um elemento precise de um contêiner (wrapper) para fins de responsividade (ex: `.table-wrapper` para transbordo horizontal), esse nó deve ser explicitamente adicionado Ã  árvore refinada antes da geração do código final.
4. **Produção Dupla:** A partir dessa árvore consolidada, o sistema gera o HTML e o CSS de forma coordenada, garantindo que o CSS consuma exatamente as classes declaradas nos nós e o HTML renderize a mesma estrutura.
5. **Fallback:** O sistema pode manter a geração isolada de HTML ou CSS para fins de debug e compatibilidade, mas o fluxo principal de exportação deve ser sincronizado e integrado.

### Validação Pós-Geração

A arquitetura exige uma validação de coerência após a geração do par HTML+CSS:

- Garantir que toda classe presente nas regras do CSS gerado exista no HTML exportado.
- Garantir que componentes relevantes do HTML (botões, inputs, grids) possuam suporte de estilo no CSS quando estritamente necessário.
- Garantir que todo token referenciado via variável `var(--token)` tenha sido devidamente declarado no pseudo-seletor `:root`.
- Garantir ausência de seletores órfãos ou classes antigas.

O código CSS gerado deve ser organizado em camadas: Tokens, Base/Reset, Layout, Components, States/Modifiers e Responsiveness.

### Regras de Tokens Visuais (Design Tokens)

- O sistema deve extrair cores reais do Figma (Fills, Strokes, Textos) e declarar no bloco `:root`.
- Uso **obrigatório** de tokens semânticos baseados na função e no brilho (ex: `--color-surface`, `--color-border`, `--color-text`, `--color-text-secondary`, `--color-primary`).
- Proibido o uso de nomes puramente sequenciais/genéricos (ex: `--color-1`, `--color-2`).

### Regras de Layout e Posicionamento (Layout System)

- **Flex e Grid Contextuais:** O layout deve refletir fielmente a tela, usando `display: grid` ou `display: flex` estritamente conforme o contexto do componente. É proibido aplicar `auto-fit` genérico para todas as seções.
- As tags e estruturas nativas (tabelas, listas, thead, tbody, tr, td) devem manter seu comportamento de bloco/tabela, sem flexbox indiscriminado.

### Regras de Fidelidade Visual

- O CSS deve usar os dados visuais reais do Figma: posicao `x/y`, largura, altura, ordem visual, alinhamento, espacamentos, cores, bordas, raios, sombras, camadas, z-index, hierarquia visual e auto layout/frame quando existirem.
- A ordem semantica do HTML deve ser preservada, evitando reordenação artificial no CSS que possa quebrar a acessibilidade e a semântica do documento.
- E proibido aplicar cores fortes, dimensoes ou pesos visuais em classes genericas como `.subtitle`, `.text`, `.value` ou `.button` sem confirmar que esse uso corresponde ao elemento real no Figma.
- E proibido centralizar telas, limitar largura com `max-width` ou aplicar `margin: 0 auto` por padrao quando isso nao existir ou nao puder ser inferido do frame original.
- A responsividade deve derivar da estrutura visual real do frame, nao de suposicoes genericas.
- A geracao so deve ser considerada concluida apos validacao visual contra o layout original, preferencialmente via RF08.
- A normalizacao deve preservar efeitos visuais do Figma, como sombras, e fills de texto para uso posterior no CSS.
- O CSS base de componentes genericos deve ser neutro; estilos fortes devem vir de regras especificas extraidas dos nodes.
- E proibido gerar regras de `order` por `:nth-child` para compensar artificialmente o posicionamento, pois isso quebra a semântica e a acessibilidade da página.
- **Ícones e Vetores Inline Reais (Sem Spans Vazios):** Gerar tags SVG inline para elementos identificados como `VECTOR`/ícones, preservando as propriedades `fill`, `stroke`, `opacity`, `stroke-width`, `width`, `height` e caminhos (`path` ou `vectorData`) reais do Figma para garantir a máxima fidelidade visual, sem usar spans vazios ou ícones genéricos substitutos.
- **Fallback de Vetores Sem Caminho:** Caso um nó `VECTOR` não contenha dados de caminho válidos, marcar o nó explicitamente com `data-svg-fallback="true"`, renderizar um retângulo tracejado correspondente às suas dimensões reais e registrar um aviso (`console.warn`) de fallback explícito.
- **Root Layout Fluido e Escala Zoom:** O frame principal (raiz) do Figma deve receber `width: 100%`, `max-width: 1920px` e `min-height: 100vh`. No preview, deve ser aplicada escala fluida por meio de regras de `@media` e propriedade `zoom` (ex: 0.85 para 1440px, 0.75 para 1200px, 0.65 para 1024px e resetando para `zoom: 1 !important` em 768px de mobile) de forma a garantir perfeita visibilidade sem quebras.
- **Modo Visual-First e Elementos Flexíveis:** Priorizar a fidelidade ao Figma tratando separadamente componentes visuais pequenos (botões, inputs, selects, botões de menu, summary-cards ou elementos com altura < 200px) e containers macro. Componentes pequenos recebem `height` fixo estrito e `box-sizing: border-box` para evitar stretch vertical indevido. O uso de `flex-basis` e `width` é condicionado à direção do pai: no pai `column`, evita-se `flex-basis` (definindo `width: 100%` com `max-width` ou largura absoluta se < 250px) para não converter largura em altura indevida. Containers macro recebem `min-height` para crescer com conteúdo, evitando o uso simultâneo e conflituoso de `height + min-height + padding`.
- **Tipografia Fiel e Clamping:** Preservar estritamente `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing` e `text-align` por elemento. Títulos e fontes maiores ou iguais a 18px devem utilizar a função `clamp()` baseada no viewport (vw) para escalarem de forma fluida no preview desktop.
- **Geometria Dinâmica e Inferência Inteligente:** Utilizar as coordenadas `x/y/width/height` para calcular dinamicamente `padding`, `margin`, `gap` e `flex-direction`. A inferência de direção de fluxo flexbox (`flex-direction: row` ou `column`) deve analisar se algum par de elementos adjacentes apresenta uma variação vertical (`y`) significativa maior que 25px ou 40% de sua altura, forçando `column` em vez de agrupar cegamente em `row` se o contêiner de elementos for vertical (ex: `.data-grid`).
- **Preservação de Tabelas:** Manter a altura de linhas, bordas, background, cores e alinhamento por célula de tabela. Células de tabela (`th` e `td`) devem receber padding geométrico capado a no máximo 12px vertical e 16px horizontal, evitando distorções. Contêineres de tabela (`table`, `tr`, `thead`, `tbody`) ignoram paddings e gaps geométricos. O alinhamento das células é vertical centralizado (`vertical-align: middle`) com linhas divisórias inferiores (`border-bottom: 1px solid var(--color-border)`).
- **Correção Cromática e Sombras:** O mapeamento de cores RGBA do Figma não deve inverter as variáveis `g` e `b` de verde/azul, garantindo correspondência exata.
- **Seletores data-figma-id:** Quando necessário, criar seletores CSS específicos por modificador ou `[data-figma-id="xxx"]` para garantir que o estilo original de componentes específicos não seja sobrescrito por regras genéricas.
- **Decoupling de Responsividade (Modo Visual-First):** Para preservar a integridade e fidelidade do layout original em telas de notebook/desktop (como em 1024px), a responsividade agressiva com `width: 100% !important` e desestruturação de componentes é totalmente desativada em 1024px, confiando na escala fluida do `zoom`. Regras responsivas agressivas aplicam-se apenas a partir de `@media (max-width: 768px)` e `@media (max-width: 480px)` com o uso de `!important` para sobrescrever propriedades de layout específicas e IDs do Figma (`[data-figma-id]`).

### Regras de Estilo de Componentes (Component Styling)

- O CSS deve diferenciar claramente componente raiz, elemento filho, estado e modificador.
- **Evitar especificidade acidental e estilos globais sujos:** Classes genéricas (ex: `.subtitle`, `.button`, `.icon`, `.form-control`) não devem receber dimensões fixas (widths, heights, margins arbitrárias) ou posicionamentos absolutos do Figma. Devem conter apenas estilos inerentes ao componente base.
- **Componentes Completos Reutilizáveis:** O gerador deve injetar bases de estilo profissionais para componentes identificados como `.sidebar-nav`, `.movimentacoes`, `.campos`, `.segmented-control`, `.summary-card__label` e `.summary-card__value`.
- **Layouts Coerentes de Telas:** Containers principais devem ter regras coerentes de fluxo continuo aplicadas ao seletor real emitido no HTML final, sem depender de uma tela de exemplo ou de uma classe fixa como `.screen`.
- **Consistência de Estrutura:** Se o CSS exigir wrappers para responsividade (como `.table-wrapper` ou `.content-area`), a estrutura do HTML gerado (Refiner) deve ser consistentemente atualizada para incluir esses wrappers e suas respectivas classes.
- **Reset Visual de Campos e Escala de Botões (Visual Reset & Control Sizing):**
  - **Aparência Nativa:** Aplicar `appearance: none` e remover bordas, margins, paddings, backgrounds e fontes nativos para `input`, `select`, `textarea`, `button`, `fieldset` e `label`.
  - **Herança e Delegação:** O CSS de contêineres identificados como campos de formulário (`.form-field`) deve transferir seus atributos visuais (como `background-color`, `border`, `border-radius`, `box-shadow`, tipografia e `padding`) para o controle interno real (`[data-figma-id="xxx-control"]`), mantendo o contêiner externo `.form-field` neutro para fins de layout flexbox.
  - **Sizing de Botão e inputs:** Botões nativos e de classes de botões específicos devem usar `box-sizing: border-box`, largura fluida com `max-width` limitante baseado nas dimensões reais do Figma, e altura fixa `height` para botões (zerando conflitos de paddings verticais) e inputs.
  - **Escalabilidade Responsiva de Controles:** Reduzir dinamicamente nos breakpoints de `1024px`, `768px` e `480px` as fontes de controles, gaps e paddings, além de forçar alturas adequadas nos inputs e botões (`min-height` e `height`) para perfeito manuseio em telas móveis.
- **Botões:** O estilo base `.button` deve prever uma cor de texto universal e comportamentos de hover/active. Além do base, botões mais específicos/reais identificados do Figma (ex: `.button-mostrar-mais`, `.button-filtro`, `.button-salvar`) devem receber especializações adequadas ao invés de classes vazias, priorizando seus tokens.

## RF07.1 - Responsividade do Codigo Gerado

O sistema deve complementar o CSS base do RF07 com regras responsivas geradas a partir do HTML refinado e da arvore semantica consolidada.

### Regras implementadas

- Gerar a camada `Responsiveness` com breakpoints em `1024px`, `768px` e `480px`.
- Emitir regras responsivas somente para seletores presentes no HTML final, evitando seletores orfaos.
- Identificar dinamicamente a classe raiz/container principal na arvore refinada e confirmar o seletor real no HTML final antes de gerar regras de layout macro.
- Aplicar as regras responsivas do layout pai ao seletor real detectado, sem criar classe estrutural nova somente no CSS.
- Gerar regras para o layout pai usando a classe real da tela atual, por exemplo `.dashboard`, `.login` ou `.landing-page`, sem depender de `.nova-movimentacao-entrada` ou `.screen`.
- Tratar `.nova-movimentacao-entrada` apenas como exemplo de uma tela especifica, nunca como regra fixa.
- Garantir que a mesma logica funcione para dashboard, formulario, landing page, login, painel administrativo, tela mobile ou qualquer outro frame importado do Figma.
- Ajustar a sidebar com largura/flex apenas quando existir um container principal real capaz de controlar a direcao do layout.
- Responsividade nao pode inverter automaticamente `flex-direction` de `row` para `column` nem de `column` para `row`; a direcao extraida da estrutura/Figma deve ser preservada salvo mudanca estrutural explicitamente solicitada.
- Adaptar grupos de cards/KPIs (`.valores`, `.summary-card`) para menos colunas em tablet e uma coluna em mobile.
- Adaptar grupos de campos e formularios (`.campos`, `.form-field`, `.form-control`, `.movement-form`) para largura total e empilhamento em telas menores.
- Manter tabelas/data grids utilizaveis no mobile sem permitir que a tabela exceda o wrapper pai; a tabela deve encolher, quebrar conteudo quando necessario e permanecer limitada a `max-width: 100%`.
- Preservar responsividade de segmented controls (`.segmented-control`) sem alterar a semantica do HTML.
- Adaptar sidebar sem JavaScript nesta etapa por sizing e contenção, sem forcar navegacao horizontal ou inverter a direcao estrutural em breakpoint.
- Preservar o fluxo semantico do HTML: a responsividade deve ser aplicada por CSS, sem trocar tags semanticas por divs genericas.
- Preservar a geracao sincronizada de HTML + CSS pela mesma arvore refinada.
- A classificacao de cards de resumo deve ser local ao componente compacto. Containers grandes, telas ou secoes com tabelas/formularios descendentes nao podem virar KPI apenas por conterem valores monetarios aninhados.

### Regras de Seletores e Validação (Sem Órfãos)

- **Validação:** O gerador deve obrigatoriamente validar todo o CSS contra o HTML gerado (string parse). É estritamente proibido gerar seletores órfãos (que não existem no HTML gerado) ou heranças de nomes obsoletos (ex: `.main-layout`, `.fundo`, `.button-select`).
- O gerador deve corrigir seletores inválidos (ex: união cega de classes `.form-field.form-field--valor.label`). O sistema usará preferencialmente seletores descendentes limpos.
- **Especialização Controlada:** Modificadores e classes muito específicas só devem receber as diferenças de estilo (ex: larguras e cores específicas), preservando o CSS base daquele componente sem duplicação de atributos (ex: não duplicar os atributos comuns de botão dentro de `.button--primary`).
- Os tokens consumidos pelas regras CSS devem **garantidamente** ter sido declarados na camada de `:root`, evitando variáveis vazias. O gerador de CSS deve injetar _fallbacks_ padrão no `:root` (ex: `--color-text-secondary`) caso o motor não tenha extraído essas cores do Figma. O token do fundo da página deve usar explicitamente `--color-surface-alt` sempre que este diferir do surface principal, prevenindo falhas de contaste de fundos genéricos.

## RF08 - Preview do Resultado

O sistema deve renderizar o HTML refinado e o CSS gerado em uma area de preview isolada da interface principal.

### Regras implementadas

- Renderizar o preview em `iframe` usando `srcdoc`.
- Injetar o CSS gerado em um bloco `<style>` dentro do HTML refinado.
- Usar `sandbox=""` no iframe para bloquear scripts na implementacao inicial.
- Atualizar o preview automaticamente quando o HTML refinado ou o CSS gerado/exportado mudarem.
- Exibir estado de espera quando ainda nao houver HTML refinado e CSS disponiveis.
- Exibir estado de montagem e estado de erro quando o preview nao puder ser renderizado.
- Limpar o iframe ao trocar estrutura, HTML ou CSS para evitar preview de versao antiga.
- Oferecer modos Desktop, Tablet e Mobile ajustando apenas a largura do contenedor do iframe.
- Preservar o isolamento para impedir que o CSS gerado afete a interface do Figma Creator.
- Permitir paginas estaticas de validacao visual servidas a partir de `frontend/`, sem afetar a rota principal do Figma Creator.
- A tela de referencia deve preservar estrutura semantica: formulario com campos reais, radio group para entrada/saida, cards de resumo com `article`, tabela com `thead`, `tbody`, `th scope="col"` e sidebar com `aside`/`nav`.

## RF09 - Fidelidade de Sombras, Tamanho de Pais, Radii de Botão e Bordas de Tabela (Correções de Alta Fidelidade)

Este requisito estabelece as especificações técnicas para sanar divergências visuais e estruturais finas identificadas no CSS gerado em relação ao Figma original.

### Regras de Sombras e Textos

- **Sombras de Texto (text-shadow):** Elementos identificados como texto (`text`, `span`, `p`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`) com efeitos de `DROP_SHADOW` no Figma devem obrigatoriamente mapear esses efeitos para a propriedade CSS `text-shadow` em vez de `box-shadow`.
- **Stroke de Texto:** Strokes extraidos de nos de texto devem ser renderizados sobre os glifos com `-webkit-text-stroke` quando o CSS base os aplicar. Merge e overlays visuais nao devem transformar stroke textual em `border` retangular do elemento.
- **Remoção de Parâmetro Spread:** A propriedade `text-shadow` não suporta o parâmetro `spread` do CSS. O gerador deve omitir o spread-radius na montagem da string de sombra para evitar que o navegador rejeite a regra de estilo.
- **Evitar Sombras Quadradas em Textos:** Nenhum elemento de texto puro ou wrapper de texto puro deve renderizar `box-shadow` retangular simulando uma sombra que deveria cobrir o formato dos caracteres da fonte.

### Regras de Dimensionamento de Pais (Min-Height vs Height)

- **Crescimento de Nós Pai:** Divs ou elementos que atuam como contêineres pai (possuem nós filhos) e não são classificados como componentes pequenos (como botões ou inputs) devem, no modo `visual-first`, herdar a altura original do Figma como `min-height` em vez de um `height` rígido fixo. Isso garante que, caso o conteúdo interno cresça, sofra quebras de linha ou sofra pequenas variações de renderização de fontes, o nó pai expanda dinamicamente e jamais fique menor do que os seus filhos.

### Regras de Radii e Sombras de Botão e Wrappers

- **Mesclagem de Fundo Robusta:** Na normalização visual, a identificação de formas de fundo (`isBackgroundShape`) deve empregar um limiar de cobertura geométrica reduzido (de 0.85 para 0.70) para tolerar pequenas distorções de caixas delimitadoras causadas por sombras ou ícones salientes.
- **Casamento de Contexto de Componente:** Se o elemento pai tem nome que sugere componente interativo ou campo (`botao`, `btn`, `button`, `salvar`, `cancelar`, `campo`, `field`, `input`, `select`, `segmented`, `card`), o limiar de cobertura de formas sem filhos para identificação como fundo é reduzido para 0.50.
- **Herança de Radius Incondicional:** Ao mesclar um retângulo de fundo no pai, o `borderRadius`, `fills`, `strokes` e `effects` do fundo devem sobrescrever incondicionalmente as propriedades correspondentes do pai (que podem estar inicialmente indefinidas ou vazias no nó de agrupamento do Figma), garantindo que o border-radius do botão seja compilado no CSS final.

### Regras de Linhas e Bordas de Tabela

- **Desativação de Bordas Genéricas em Visual-First:** No modo `visual-first`, as células da tabela (`td` e `th`) não devem receber a regra de borda inferior padrão (`border-bottom`) de reset genérico caso o design do Figma já possua bordas explícitas extraídas dos nós, evitando a renderização de múltiplas linhas horizontais indesejadas e coladas no meio do item.

## RF10 - Integracao com IA para Melhoria do Codigo Gerado

O sistema deve permitir uso de IA para revisar e melhorar HTML/CSS gerados sem substituir a extracao, a normalizacao, a arvore refinada ou a geracao base.

### Estrategia com Figma MCP

- A IA pode usar contexto adicional do Figma via MCP quando disponivel.
- O MCP e recurso opcional para ambiente de desenvolvimento/agentes, nao obrigacao do usuario final.
- O fluxo MCP parte de link exato do Figma informado pelo usuario/dev para frame, no ou componente.
- Exemplo de uso: `Use o MCP do Figma para ler este frame: @link-do-figma`.
- A IA deve usar o MCP para apoiar fidelidade visual, comparacao com o design e melhoria de HTML/CSS.
- O MCP complementa o contexto; nao substitui arvore extraida, normalizacao visual, arvore semantica nem geracao base.
- Para usuario final futuro, o fluxo ideal deve ser integracao propria com Figma/API/OAuth, sem exigir VS Code, Codex, Dev Mode ou configuracao manual de MCP.
- Quando o MCP nao estiver disponivel, o sistema continua usando HTML, CSS, arvore Figma extraida, arvore normalizada e logs.

### Regras

- A IA deve preservar estrutura base, `data-figma-id`, rastreabilidade e o modo ativo `responsive`.
- A geracao ativa deve expor apenas o modo responsivo. O Figma orienta identidade visual, acabamento e hierarquia, mas fidelidade literal nao deve forcar geometria fixa quando ela piorar legibilidade, encaixe de titulos ou controles web.
- No modo responsivo ativo, nenhum descendente pode exceder o parent por dimensao propria. Divs, textos, imagens, formularios, tabelas e controles devem receber limites de sizing/overflow de conteudo coerentes com `max-width: 100%`, `max-height: 100%`, `min-width: 0`, `min-height: 0` e quebra de conteudo quando necessario.
- Patches de merge/IA nao podem trocar `flex-direction` para obter responsividade; direcao de fluxo e contrato estrutural da arvore extraida, nao acabamento visual.
- A IA pode revisar HTML, CSS, metadados, logs, screenshots e contexto MCP opcional.
- Toda alteracao aplicada pela IA deve manter HTML e CSS sincronizados.
- A IA nao deve inventar componentes, trocar layout principal, remover elementos visuais importantes ou apagar regras funcionais sem justificativa.
- A IA deve retornar resumo curto das alteracoes e alertas objetivos quando nao conseguir corrigir algo por falta de dados ou ausencia de MCP.

### Implementacao inicial

- Backend expõe `POST /api/generate/ai/context` para montar um pacote de contexto RF10.
- O pacote inclui prompt, restricoes, modo ativo, estrutura Figma normalizada, HTML, CSS, logs e link MCP opcional.
- A interface pode oferecer botao especifico para gerar contexto IA/MCP, mas deve reaproveitar a URL do Figma informada no inicio do fluxo, sem criar campo adicional de link nesta etapa.
- Esta etapa nao chama provedor de IA nem exige MCP ativo; ela prepara o contexto para uso interno/agente/dev e preserva o fluxo local quando MCP nao estiver disponivel.
- Exportacao unificada, ZIP, Git ou GitHub ficam para RF posterior e nao devem aparecer na UI desta etapa.

## RF11 - Uso de MCP/Figma como Fonte de Contexto Visual

O MCP/Figma deve ser tratado como fonte opcional de contexto visual para agentes internos e IA, complementando a arvore extraida, a normalizacao e a geracao deterministica.

### Regras

- O MCP nao deve ser obrigatorio para o usuario final.
- O backend pode usar o link do Figma para coletar contexto visual adicional quando disponivel.
- O MCP nao substitui parser, normalizacao, geracao JS local ou IA; apenas complementa o contexto.

## RF11.1 - Agent Runner para Geracao Automatizada via IA/MCP

O backend deve conter um Agent Runner interno para coordenar geracao e melhoria automatizada com IA/MCP sem exigir ferramentas externas do usuario.

### Regras

- O Agent Runner monta pacote com contexto Figma/MCP, HTML/CSS JS deterministico, arvore original, arvore normalizada, logs e modo ativo responsivo.
- O Agent Runner deve reutilizar a sessao OAuth Figma existente (`figma_creator_session`) para recuperar/renovar o access token; nao deve depender de cookie separado com token.
- Quando o contexto Figma/API estiver disponivel, o backend deve extrair patches `figma-mcp` diretamente do `rawDocument` para seletores `[data-figma-id]`, sem depender apenas das sugestoes da IA.
- No merge sobre HTML semantico refinado, os patches Figma deterministicos devem ficar restritos a acabamento visual seguro. Geometria plana e escala tipografica fixa (`position`, `left`, `top`, `width`, `height`, `font-size` e `line-height`) ja tratadas pela geracao base nao devem ser reaplicadas como overlay, pois quebram fluxo de formularios, tabelas e textos.
- `source: figma-mcp` e reservado a patches extraidos deterministicamente do Figma/API real. Sugestoes da IA que aleguem essa origem devem ser rebaixadas para `ai-merge-agent`.
- O Agent Runner pode invocar um provedor de IA integrado.
- A resposta da IA deve ser salva como versao candidata IA/MCP, sem substituir a versao JS original.
- A candidata IA/MCP deve preservar em memoria o `mcpContext` completo usado pelo Agent Runner, incluindo `rawDocument` quando disponivel; o RF11.2 deve consumir esse contexto completo, nao apenas metadados resumidos do frame.
- O RF11.2 tambem deve usar a arvore normalizada que gerou o HTML como fonte visual deterministica, pois seus IDs batem com os `data-figma-id` do HTML final.
- A interface pode comparar versao JS deterministica e versao candidata IA/MCP.
- O backend deve registrar em `logs/figma-creator-debug.log` os artefatos do fluxo inteiro: frames, estrutura Figma, arvore normalizada, HTML base/refinado, CSS, contexto IA, candidata IA/MCP, patches, merge consolidado e exportacao.
- O log deve indicar se a IA real foi executada, se houve fallback deterministico e se o contexto Figma/MCP real foi coletado, sem gravar tokens, cookies, secrets ou API keys.
- Quando a IA real estiver configurada e cair em fallback deterministico, o Agent Runner deve registrar o motivo tecnico da falha, como erro HTTP, resposta vazia, JSON invalido ou campos obrigatorios ausentes.
- O Agent Runner deve pedir refinamento visual responsivo e esteticamente cuidado para recuperar acabamento que o parser deterministico nao representar bem, mantendo patches especificos e rastreaveis por `data-figma-id`.

## RF11.2 - Merge Hibrido e Consolidacao do Codigo Gerado

O sistema deve consolidar o codigo gerado antes da exportacao por meio de **Merge Hibrido baseado em Patches Seletivos com AI Merge Agent**, comparando a estrutura deterministica JS com a fidelidade visual da candidata IA/MCP, sem concatenar CSS.

### Objetivo

Produzir uma versao final limpa com CSS base JS enriquecido apenas por patches visuais seguros e validados, preservando organizacao, rastreabilidade, fidelidade visual e estrutura semantica.

### Modelo de Merge

A versao IA/MCP nao deve ser aplicada como bloco HTML/CSS completo. O HTML final consolidado deve continuar sendo o HTML JS deterministico. A versao IA/MCP deve ser usada como referencia visual e insumo comparativo.

O AI Merge Agent participa do merge, mas nao substitui o Agent Runner RF11.1 nem pode substituir livremente o HTML final. Ele compara as versoes e retorna exclusivamente patches estruturados.

### Entradas do AI Merge Agent

- HTML e CSS base JS deterministico.
- HTML e CSS candidato IA/MCP.
- Arvore normalizada do frame Figma.
- Logs e metadados da execucao.
- Contexto visual Figma/MCP, quando disponivel.

### Formato dos patches

Cada patch deve conter:

- `selector` existente no HTML JS final, preferencialmente `[data-figma-id="N:M"]`.
- `props` com propriedades CSS propostas.
- `source` com origem do ajuste.
- `reason` com motivo objetivo.
- `confidence` com confianca.
- `figmaId` quando houver `data-figma-id`.

A IA deve retornar patches estruturados, nunca codigo livre concatenado.

### Regras

- O HTML JS deterministico e a base estrutural vencem a estrutura IA/MCP.
- A versao IA/MCP serve como referencia visual, nao como substituta do HTML final.
- Patches `figma-mcp` extraidos do Figma real devem ser combinados aos patches do AI Merge Agent e ter prioridade sobre inferencias `ia-inference`.
- Em conflito de seletor/propriedade, patches internos `figma-raw-document` vencem patches sugeridos pela IA.
- O backend aplica somente patches aceitos apos validacao.
- Patches sem seletor correspondente no HTML JS final devem ser rejeitados ou enviados ao relatorio.
- Seletores por `data-figma-id` vencem classes genericas.
- Antes de aceitar um patch, o backend deve validar se ele altera o estilo efetivo apos a cascata CSS.
- Patches aceitos devem substituir declaracoes no seletor correto ou entrar em uma secao final `/* AI/MCP Applied Patches */`, preferencialmente por `[data-figma-id]`, para garantir precedencia visual real.
- O consolidado nao deve ficar pior que o candidato por reintroduzir posicionamento absoluto do Figma sobre HTML semantico; overlays deterministicos de merge devem preservar fluxo e legibilidade antes de buscar pixelizacao.
- Patches em classe generica devem ser promovidos para `[data-figma-id]` quando o HTML possuir essa rastreabilidade; nao aceitar patch em classe se regra posterior por `data-figma-id` sobrescrever a mesma propriedade.
- O backend deve remover ou rejeitar seletores orfaos, propriedades duplicadas e estilos genericos conflitantes.
- A validacao de seletores orfaos deve analisar apenas seletores CSS reais, sem confundir valores numericos como `0.05`, `1.5`, `28px` ou `rgba(...)` com classes.
- A IA nao deve inventar shadows, transitions, borders, radius ou efeitos sem base no Figma/MCP, na arvore normalizada, no candidato IA/MCP ou sem aprovacao explicita.
- Patches `ai-visual-refinement` podem recuperar acabamento visual como `box-shadow`, `border-radius`, `letter-spacing` e `transition` quando tiverem seletor especifico rastreavel por `data-figma-id`, confianca minima validada pelo backend e nenhum conflito com valor deterministico do Figma.
- Em conflito: estrutura JS vence estrutura IA/MCP; `data-figma-id` vence classe generica; estilo Figma/MCP vence embelezamento generico da IA; patch seguro vence concatenacao.
- O sistema deve gerar relatorio com patches aceitos, rejeitados, conflitos e motivos.
- O merge deve registrar no arquivo `.log` HTML/CSS base, HTML/CSS candidato, HTML/CSS consolidado, relatorio, patches aceitos/rejeitados, resumo de diferencas reais e status do provedor IA.
- No Orquestrador IA & Agent Runner, todo bloco completo de codigo ou texto tecnico deve ter botao de copiar, incluindo HTML/CSS base, HTML/CSS candidato, HTML/CSS consolidado e relatorio/patches completos. A copia deve capturar o conteudo completo e exibir feedback `Copiado`.
- O merge deve comparar CSS base e CSS consolidado, registrar diferencas reais e avisar `nenhum patch visual relevante foi aplicado` quando nao houver melhoria perceptivel.
- Se menos de 5 patches efetivos forem aplicados, o sistema deve alertar `Merge sem melhoria visual relevante`.
- `box-shadow`, `transition`, `border-radius` e `letter-spacing` devem vir de `figma-mcp` ou de refinamento visual IA rastreavel `ai-visual-refinement`; embelezamentos genericos sem escopo e sem rastreabilidade devem ser rejeitados.
- O preview do Orquestrador deve indicar versao renderizada, hash e timestamp, forcar recarregamento quando HTML/CSS mudar e oferecer botao `Recarregar preview`.
- Quando duas versoes comparadas tiverem HTML/CSS identicos, a interface deve exibir aviso.

### Resultado

HTML JS rastreavel preservado, CSS base JS enriquecido por patches seguros validados pelo backend e relatorio de auditoria pronto para exportacao.

## RF12 - Exportacao do codigo gerado

A exportacao deve consumir exclusivamente a versao consolidada valida do RF11.2, impedindo exportacao direta de versoes candidatas brutas ou inacabadas.

As exportacoes ZIP/Git devem registrar no log de debug quais arquivos consolidados foram exportados, destino e logs tecnicos relevantes.
