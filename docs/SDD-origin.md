# 📄 SDD v2 — AI Figma to Frontend Generator

---

# 1. Introdução

Este sistema é uma ferramenta web que converte telas criadas no Figma em código frontend (HTML e CSS), utilizando integração com API do Figma, processamento de estrutura de design e inteligência artificial (IA), com suporte futuro a MCP (Model Context Protocol).

O sistema tem como objetivo reduzir o tempo de desenvolvimento frontend e automatizar parte da tradução entre design e código, aproximando UX/UI e desenvolvimento.

---

# 2. Objetivo

O objetivo do sistema é:

- Importar projetos do Figma via URL
- Listar e selecionar frames (telas)
- Interpretar estrutura de design
- Gerar código HTML e CSS automaticamente
- Permitir visualização (preview) do resultado
- Permitir exportação do código gerado em múltiplos formatos (ZIP, Git)
- Evoluir para integração com IA e MCP para melhorias automáticas

---

# 3. Escopo (MVP e Evolução)

## ✔ MVP (primeira versão)

- Importação de URL do Figma
- Listagem de frames
- Seleção de tela
- Geração de HTML/CSS básico
- Preview do resultado
- Download do código em ZIP

---

## 🚀 Versões futuras

- Integração com IA para melhoria de código
- Integração MCP (tools de automação)
- Exportação para repositório Git local
- Push automático para GitHub
- Suporte a React / Tailwind
- Histórico de projetos
- Multiusuário
- Versionamento de telas geradas

---

# 4. Requisitos Funcionais (por feature)

---

## 🔹 RF01 — Importação de URL do Figma

O sistema deve permitir ao usuário inserir uma URL de um arquivo do Figma.

### Regras:

- Validar domínio figma.com
- Extrair file_key da URL
- Rejeitar URLs inválidas ou inacessíveis

### Resultado:

- Sistema identifica corretamente o projeto Figma

---

## 🔹 RF02 — Integração com API do Figma

O sistema deve consumir a API oficial do Figma para obter os dados do arquivo.

### Regras:

- Usar token de acesso no backend
- Buscar estrutura completa do arquivo
- Tratar erros de autenticação e permissões

### Resultado:

- JSON completo do Figma disponível para processamento

---

## 🔹 RF03 — Listagem de telas principais

O sistema deve listar as telas principais disponíveis no arquivo Figma para seleção do usuário.

### Regras

- Apenas frames principais devem ser exibidos

### Exibir:

- nome da tela
- ID do frame
- nome da página do Figma
- preview em miniatura
- Ordenação deve seguir a estrutura original do Figma
- Não carregar detalhes internos completos nesta etapa
- Dados completos da tela devem ser carregados apenas após seleção do usuário
- Resultado esperado

Usuário consegue identificar visualmente e selecionar corretamente a tela desejada para implementação.

## 🔹 RF04 — Seleção de frame

O usuário deve poder selecionar uma tela específica.

### Regras:

- Apenas um frame por vez
- Seleção enviada ao backend

### Resultado:

- Frame escolhido definido para processamento

---

## 🔹 RF04.1 — Normalização da Árvore do Figma

A árvore do Figma pode vir desorganizada, com groups, rectangles, vectors, layoutMode null e ordem dos children diferente da ordem visual. O sistema deve criar uma etapa de normalização antes do HTML/CSS.

### Regras:

- Ordenar elementos por x/y/width/height, não apenas pela ordem dos children originais.
- Detectar regiões principais por geometria.
- Converter rectangles de fundo em estilo do container pai.
- Separar árvore visual refinada da árvore semântica.
- Gerar HTML/CSS a partir da árvore normalizada.

---

## 🔹 RF05 — Extração de estrutura de layout

O sistema deve interpretar o frame selecionado.

### Regras:

- Identificar elementos:
  - textos
  - imagens
  - botões
  - containers

- Manter hierarquia do layout
- Preservar posições e dimensões

### Resultado:

- Estrutura convertida em árvore de elementos

---

## 🔹 RF06 — Geração de HTML

O sistema deve gerar HTML baseado na estrutura do frame.

### Regras:

- Utilizar tags semânticas quando possível
- Manter hierarquia do layout
- Código limpo e organizado

### Resultado:

- HTML equivalente à tela do Figma

---

## RF06.1 - Interpretacao e refinamento semantico do HTML

O sistema deve interpretar semanticamente a funcao dos elementos da tela antes da geracao visual, refinando o HTML gerado para produzir uma estrutura reutilizavel, acessivel, responsiva e adequada para manutencao futura.

### Regras gerais:

- Usar o HTML gerado na RF06 e a estrutura normalizada da RF05 como referencia
- Classificar elementos em uma arvore logica composta por tela, layout, regioes, secoes, componentes, elementos internos e decoracoes
- Nao depender apenas de aparencia, tamanho, cor ou posicao
- Considerar relacao entre componentes, proximidade visual, repeticao de padroes, hierarquia, conteudo textual, agrupamento e comportamento esperado
- Reduzir nomes genericos herdados do Figma, como group, rectangle e vector
- Gerar classes legiveis e orientadas ao papel do elemento na interface
- Nao derivar classes de texto a partir do conteudo exibido, como nomes, bancos, valores ou datas
- Usar classes por papel para textos, como title, subtitle, label, text, value ou classes de coluna quando estiverem em tabela
- Permitir que elementos repetidos com a mesma funcao visual compartilhem a mesma classe
- Nao adicionar IDs do Figma por padrao aos nomes de classe
- Usar IDs do Figma em classes apenas em etapa futura, se houver necessidade concreta de diferenciacao
- Iniciar com heuristicas locais e deterministicas
- Permitir evolucao futura com IA para revisar semantica, nomenclatura e organizacao
- Nao gerar CSS nesta etapa

### Regras de classificacao semantica:

- Diferenciar titulos principais, titulos de secao, subtitulos, labels e textos comuns
- Diferenciar botoes de acao, botoes com icone, botoes de envio e botoes de navegacao
- Identificar formularios, campos de entrada, selects, comboboxes, radio buttons, checkboxes e textareas quando houver indicios suficientes
- Diferenciar tabelas simples e data grids com filtro, paginacao, ordenacao ou carregamento incremental
- Diferenciar menus laterais, menus superiores, menus inferiores e grupos de botoes
- Diferenciar cards informativos, cards de indicadores e cards puramente visuais
- Identificar cards de indicadores/KPI como componentes de resumo, nao como blocos genericos
- Diferenciar grids de layout, grids de conteudo e estruturas flex
- Diferenciar icones funcionais e icones meramente decorativos
- Diferenciar componentes funcionais e elementos puramente visuais

### Regras de HTML semantico:

- Menus laterais devem ser gerados preferencialmente com aside e nav
- Menus fixados na lateral da tela devem ser classificados como sidebar, usando aside com nav interno
- Menus superiores, inferiores ou grupos de navegacao devem usar nav quando houver funcao de navegacao
- Formularios devem ser gerados com form
- Botoes devem ser gerados com button
- Acoes de envio identificadas, como salvar, devem usar button com type="submit" quando estiverem dentro de formulario
- Campos devem usar input, select ou textarea conforme a funcao identificada
- Campos de data devem ser gerados como input type="date" ou componente equivalente de date picker
- Campos de valor monetario devem ser gerados como input com inputmode="decimal" quando forem editaveis
- Campos de categoria e metodo devem ser gerados como select ou combobox quando forem opcoes selecionaveis
- Campos de descricao devem ser gerados como textarea quando forem editaveis
- Escolhas como entrada/saida devem ser geradas como radio group ou segmented control, conforme a estrutura visual
- Tabelas devem usar table, thead, tbody, tr, th e td
- Grupos identificados como tabela, cabecalho e linha devem ser refinados para estrutura de tabela quando houver padrao tabular
- Tabelas com filtro, ordenacao, paginacao ou carregamento incremental devem ser classificadas como data grid simples
- Data grids devem separar toolbar, filtros, tabela e acoes como carregar mais
- Celulas de tabela devem usar classes de coluna, como col-descricao, col-categoria, col-metodo, col-valor e col-data
- Cabecalhos de tabela devem receber scope="col" quando representarem colunas
- Titulos devem respeitar hierarquia correta com h1, h2 e h3
- h1 deve ser reservado para o titulo principal da tela ou de uma secao de alto nivel
- Textos de botao, valores monetarios, labels, datas, opcoes e nomes de indicadores nao devem ser gerados como h1
- Valores monetarios e indicadores devem usar elementos como strong, span, p ou small, conforme o papel semantico
- Cards de indicadores devem usar estrutura como article, label em span e valor principal em strong
- Textos internos de botoes devem ser renderizados como elementos neutros, como span com classe button-label, e nao como heading
- Elementos button devem ser limitados a controles pequenos, com nome de acao, icone direto ou texto de acao
- Evitar elementos button aninhados
- Manter grupos com multiplas acoes como containers, nao como button
- Nao converter containers grandes em button apenas por conterem icones descendentes

### Regras para elementos decorativos:

- Elementos decorativos como fundos, bordas, sombras, formas e camadas visuais devem ser convertidos preferencialmente em CSS
- Evitar divs desnecessarias para elementos genericos como shape ou group quando nao houver funcao semantica, estrutural ou interativa
- Omitir shapes decorativos sem conteudo, filhos ou funcao interativa do HTML refinado
- Permitir que icones repetidos compartilhem a mesma classe base sem sufixo numerico
- Padronizar icones funcionais com classes como icon e variacoes por funcao
- Marcar icones puramente decorativos como decorativos em etapa de acessibilidade
- Evitar classes genericas como group, shape e icon-graphic quando for possivel identificar funcao real, como sidebar-nav, filter-button, summary-card, movement-form, form-field, data-grid-toolbar e load-more-button

### Regras de acessibilidade:

- Botoes apenas com icone devem incluir aria-label
- aria-label de botoes com icone deve ser descritivo e funcional, evitando labels genericos como "Acao"
- Icones decorativos dentro de botoes devem usar aria-hidden="true"
- Campos de formulario devem possuir label associado
- Grupos de radio buttons ou checkboxes devem usar fieldset e legend quando aplicavel
- Icones decorativos devem usar aria-hidden="true"
- A hierarquia de titulos deve ser correta e nao deve pular niveis sem necessidade
- Tabelas devem associar corretamente cabecalhos e celulas
- A ordem do DOM deve priorizar leitura, acessibilidade e manutencao, mesmo que a ordem visual das camadas no Figma seja diferente
- Titulos de secao devem aparecer no HTML antes do conteudo principal da secao correspondente

### Regras de responsividade:

- Considerar adaptacao do layout para diferentes resolucoes
- Layouts em colunas no desktop devem prever reorganizacao parcial em tablet
- Secoes devem poder ser empilhadas no mobile quando necessario
- Tabelas devem prever scroll horizontal ou conversao futura para cards em telas pequenas
- Menus laterais devem poder evoluir para drawer, bottom navigation ou menu compacto

### Regras de tokens visuais:

- Preparar a extracao de tokens visuais a partir do Figma
- Tokens devem incluir cores, tipografia, espacamentos, raios de borda, sombras, tamanhos e estados visuais dos componentes
- Tokens devem ser reutilizados no codigo para evitar estilos repetitivos, inconsistentes ou acoplados a posicao exata dos elementos no Figma

### Resultado:

- HTML semanticamente refinado, organizado por componentes e preparado para geracao de CSS
- A entrega esperada nao deve ser uma reproducao estatica puramente visual, mas uma estrutura de codigo reutilizavel, acessivel, responsiva e sustentavel

---

## RF07 - Geracao de CSS

O sistema deve gerar CSS correspondente ao layout.

### Regras:

- Utilizar flexbox ou grid quando necessário
- Aplicar cores, espaçamentos e tipografia do Figma
- Evitar estilos inline
- **Ícones e Vetores Inline Reais (Sem Spans Vazios):** Gerar tags SVG inline para elementos identificados como `VECTOR`/ícones, preservando as propriedades `fill`, `stroke`, `opacity`, `stroke-width`, `width`, `height` e caminhos (`path` ou `vectorData`) reais do Figma para garantir a máxima fidelidade visual, sem usar spans vazios ou ícones genéricos substitutos.
- **Fallback de Vetores Sem Caminho:** Caso um nó `VECTOR` não contenha dados de caminho válidos, marcar o nó explicitamente com `data-svg-fallback="true"`, renderizar um retângulo tracejado correspondente às suas dimensões reais e registrar um aviso (`console.warn`) de fallback explícito.
- **Root Layout Fluido:** O frame principal (raiz) do Figma deve receber `width: 100%`, `max-width: 1920px` e `min-height: 100vh` para garantir adaptabilidade em resoluções ultra-wide.
- **Elementos e Contêineres Flexíveis:** Evitar larguras fixas em cards, formulários, wrappers, seções e campos, definindo largura fluida de `100%`, `max-width` limitante ou `flex-basis` de acordo com a geometria de referência do Figma.
- Preservar estritamente `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing` e `text-align` por elemento nas folhas de estilo.
- Utilizar coordenadas `x/y/width/height` de elementos filhos e contêineres para calcular dinamicamente propriedades de `padding`, `margin`, `gap` e alinhamentos contextuais.
- Preservar altura de linhas, bordas, background, cor e alinhamento por célula de tabela. Aplicar padding interno e alinhamentos específicos para cards, botões e campos.
- Quando necessário, criar seletores CSS específicos por modificador ou `[data-figma-id="xxx"]` para garantir que o estilo original de componentes específicos não seja sobrescrito por regras genéricas.
- **Sobrescrita de Media Queries (Alta Prioridade):** As regras CSS responsivas nos breakpoints de `1024px`, `768px` e `480px` devem obrigatoriamente utilizar a diretiva `!important` em suas propriedades de layout, largura e altura para garantir a correta sobrescrita de seletores específicos e IDs do Figma (`[data-figma-id]`).

### Resultado:

- CSS funcional e visualmente próximo do design

---

## RF07.1 — Responsividade do Código Gerado

O sistema deve gerar regras responsivas para que o HTML e o CSS convertidos a partir do Figma possam se adaptar a diferentes tamanhos de tela, quando houver estrutura suficiente para inferir o comportamento responsivo.

### Objetivo

Permitir que o código gerado tenha uma base responsiva mínima, contemplando desktop, tablet e mobile, sem depender apenas do preview para simular larguras de tela.

### Regras Funcionais

- O sistema deve analisar a estrutura refinada da tela para identificar regiões principais, como menu, conteúdo, formulários, cards, tabelas, listas e grids.
- O sistema deve identificar dinamicamente a classe raiz/container principal da tela na arvore refinada.
- As regras responsivas do layout macro devem ser aplicadas a essa classe raiz detectada no HTML final.
- A classe `.nova-movimentacao-entrada` deve ser tratada apenas como exemplo de uma tela especifica, nunca como regra fixa.
- A mesma logica deve funcionar para qualquer tela importada do Figma, como dashboard, formulario, landing page, login, painel administrativo ou tela mobile.
- O sistema deve gerar CSS responsivo com base no layout identificado.
- O sistema deve utilizar `media queries` quando necessário.
- O container principal da tela deve receber estrutura responsiva coerente, usando flex ou grid quando houver regioes como sidebar, conteudo, formulario, cards ou tabela.
- As media queries devem ajustar sizing e contenção do layout pai e dos filhos sem inverter automaticamente `flex-direction` entre `row` e `column`.
- O sistema deve adaptar layouts em colunas para layouts empilhados em telas menores.
- O sistema deve manter tabelas contidas no parent em telas pequenas.
- O sistema deve reorganizar grids de cards para uma ou duas colunas conforme o espaço disponível.
- O sistema deve adaptar formulários para uma coluna em telas menores.
- O sistema deve preservar a responsividade de sidebar, cards, campos, formulario, tabela/data-grid e segmented-control.
- O sistema deve prever comportamento para menus laterais, como ocultar, compactar ou preparar para drawer/bottom navigation.
- A sidebar so deve receber regras de largura, flex ou compactacao quando o container pai possuir estrutura compativel para esse comportamento.
- O sistema não deve quebrar a estrutura semântica do HTML ao aplicar responsividade.
- O CSS responsivo deve ser gerado de forma sincronizada com o HTML final e com os estilos do RF07.
- HTML e CSS devem permanecer sincronizados pela mesma arvore refinada.

### Breakpoints mínimos sugeridos

- Desktop: acima de `1024px`
- Tablet: até `1024px`
- Mobile: até `768px`
- Mobile pequeno: até `480px`, quando necessário

### Regras por tipo de componente

#### Layout principal

- Em desktop, preservar a estrutura mais próxima do Figma.
- Em tablet, reduzir colunas quando necessário.
- Em mobile, empilhar regiões principais.
- O container raiz da tela deve ser identificado dinamicamente a partir da arvore refinada e da classe real emitida no HTML final.
- Quando houver sidebar como filha direta, o container pai deve preservar a direcao estrutural extraida e controlar apenas sizing/contenção responsiva sem mutacao automatica de `row`/`column`.
- O seletor do layout principal deve ser sempre o seletor real existente no HTML final, e nao uma classe estrutural criada apenas no CSS.

#### Sidebar/Menu lateral

- Em desktop, pode permanecer lateral.
- Em tablet/mobile, pode ser ocultado, compactado ou preparado para drawer.
- O RF07.1 não precisa implementar a lógica JavaScript do drawer, apenas preparar o CSS quando aplicável.

#### Tabelas/Data grids

- Em telas pequenas, a tabela deve permanecer contida no wrapper pai, encolhendo e quebrando conteudo quando necessario em vez de impor largura maior que o container.
- O sistema não deve transformar tabela em cards automaticamente, salvo se essa regra for definida em etapa futura.

#### Cards

- Grupos de cards devem usar grid responsivo.
- Em telas largas, podem aparecer em múltiplas colunas.
- Em mobile, devem ser empilhados ou reduzidos para uma coluna.

#### Formulários

- Campos lado a lado no desktop devem ser empilhados no mobile.
- Inputs, selects e textareas devem ocupar `width: 100%`.

#### Segmented control

- Segmented controls devem manter opcoes acessiveis e compactas em telas menores.
- Quando necessario, o CSS pode permitir quebra de linha sem alterar a semantica do HTML.

### Decisoes tecnicas implementadas

- O gerador de CSS deve emitir uma camada propria `Responsiveness` com breakpoints em `1024px`, `768px` e `480px` somente quando os seletores existirem no HTML final.
- O HTML refinado nao deve depender de uma classe estrutural fixa como `.screen`; o container principal deve usar a classe real derivada da tela atual.
- O CSS base e responsivo deve gerar regras para o seletor real do container principal, como `.dashboard`, `.login`, `.landing-page` ou qualquer outra classe existente no HTML final.
- Ajustes de largura/flex da `.sidebar` dependem da existencia conjunta do container principal real e de `.sidebar`, evitando regras soltas em componentes sem pai responsivo.
- Nenhuma regra responsiva deve depender de nomes especificos de exemplo, como `.nova-movimentacao-entrada`.
- Novas classes estruturais so podem aparecer no CSS se tambem existirem no HTML refinado.
- Layouts de cards/KPIs identificados por `.valores` devem reduzir colunas no tablet e empilhar em mobile.
- Grupos de campos identificados por `.campos`, `.form-field`, `.form-control` e `.movement-form` devem receber regras para empilhamento e largura total em telas menores.
- Tabelas refinadas com `.table-wrapper` e `.table` devem permanecer contidas no mobile, sem largura minima que exceda o wrapper.
- Segmented controls refinados com `.segmented-control` devem manter uso responsivo e sem quebra semantica.
- Sidebars devem receber comportamento responsivo sem exigir JavaScript nesta etapa por sizing e contenção, sem forcar navegacao horizontal compacta no mobile.
- O sistema deve evitar regras responsivas orfas, gerando CSS apenas para classes presentes no HTML refinado.
- A classificacao de cards de resumo deve ser local ao componente compacto. Telas, secoes grandes ou containers com tabelas/formularios descendentes nao podem ser classificados como KPI apenas por conterem valores monetarios aninhados.

### Critérios de Aceite

**Dado** que o sistema gerou HTML e CSS para uma tela com layout em colunas  
**Quando** a largura da viewport for reduzida  
**Então** o CSS deve adaptar o layout para evitar quebra visual.

**Dado** que a tela contenha tabela ou data grid  
**Quando** a tela for exibida em mobile  
**Então** a tabela deve encolher e quebrar conteúdo sem exceder o wrapper pai.

**Dado** que a tela contenha cards em grupo  
**Quando** a largura disponível for reduzida  
**Então** os cards devem se reorganizar em menos colunas ou em coluna única.

**Dado** que a tela contenha formulário com múltiplos campos  
**Quando** a tela for exibida em mobile  
**Então** os campos devem ser empilhados e ocupar a largura disponível.

**Dado** que o CSS responsivo foi gerado  
**Quando** o HTML e o CSS forem renderizados  
**Então** não deve haver seletores órfãos, tokens inexistentes ou quebra da estrutura semântica.

### Observação Técnica

O RF07.1 deve atuar como complemento do RF07. O RF07 gera o CSS base; o RF07.1 define as regras responsivas. O RF08, posteriormente, apenas permitirá visualizar/testar essas regras em diferentes larguras de preview.

Manter o SDD atualizado com todas as alterações, adições e decisões técnicas aplicadas, sem remover ou regredir requisitos já existentes.

---

# RF08 — Preview do Resultado

O sistema deve permitir que o usuário visualize, em tempo real, o resultado da conversão da tela do Figma em HTML e CSS, garantindo uma conferência visual rápida entre o layout original e o código gerado.

## Objetivo

Permitir que o usuário valide visualmente a tela convertida antes de copiar, exportar ou continuar refinando o código.

## Regras Funcionais

- O sistema deve renderizar o HTML e o CSS gerados em uma área de preview.
- O preview deve ser atualizado sempre que o HTML ou CSS for regenerado.
- O preview deve usar o HTML e o CSS finais sincronizados pela mesma árvore refinada.
- O sistema deve evitar renderizar CSS ou HTML de versões antigas após uma nova geração.
- O usuário deve conseguir identificar rapidamente se a estrutura visual gerada está coerente com o Figma.
- O preview deve funcionar para diferentes tipos de tela, como dashboards, formulários, landing pages, sistemas administrativos, telas mobile e páginas com tabelas/cards.
- O preview deve isolar o código renderizado para não interferir na interface da própria aplicação.
- O sistema deve tratar erros de renderização, exibindo mensagem clara quando o HTML ou CSS não puder ser exibido.
- Após qualquer refinamento de HTML, CSS ou árvore intermediária, o preview deve ser atualizado com a versão mais recente.
- O SDD deve permanecer atualizado com todas as alterações, adições e decisões técnicas aplicadas.

## Possíveis Recursos

### 1. Preview em tempo real

Renderizar automaticamente o resultado sempre que o HTML ou CSS for atualizado.

### 2. Botão de atualizar preview

Permitir atualização manual, caso o usuário queira controlar quando renderizar.

### 3. Isolamento por iframe

Renderizar o resultado dentro de um iframe para evitar conflito entre o CSS gerado e o CSS da aplicação.

### 4. Preview responsivo

Permitir alternar entre visualizações:

- Desktop
- Tablet
- Mobile

### 5. Estado de carregamento

Exibir loading enquanto o preview está sendo montado.

### 6. Estado de erro

Exibir erro quando HTML ou CSS estiverem inválidos, vazios ou incompatíveis.

### 7. Comparação com Figma

Em uma etapa futura, permitir visualizar o layout original ao lado do preview gerado.

### 8. Atualização sincronizada

Garantir que o preview sempre use a versão mais recente do HTML + CSS gerados juntos.

### 9. Reset do preview

Permitir limpar ou reinicializar a área de preview.

### 10. Segurança

Evitar execução indevida de scripts no preview, principalmente se o HTML gerado vier de entrada externa.

## Critérios de Aceite

### Cenário 1 — Renderização do preview

**Dado** que o sistema gerou HTML e CSS válidos  
**Quando** o usuário acessar a área de preview  
**Então** a tela convertida deve ser renderizada visualmente.

### Cenário 2 — Atualização após regeneração

**Dado** que o usuário regenerou o HTML ou o CSS  
**Quando** a geração for concluída  
**Então** o preview deve ser atualizado com a versão mais recente.

### Cenário 3 — Tratamento de erro

**Dado** que o HTML ou CSS possua erro de renderização  
**Quando** o sistema tentar exibir o preview  
**Então** deve apresentar uma mensagem de erro clara, sem quebrar a aplicação.

### Cenário 4 — Preview responsivo

**Dado** que o usuário alterne entre desktop, tablet e mobile  
**Quando** selecionar um modo de visualização  
**Então** o preview deve ajustar a largura de exibição conforme o dispositivo escolhido.

### Cenário 5 — Isolamento do preview

**Dado** que o preview seja renderizado  
**Quando** o CSS gerado for aplicado  
**Então** ele não deve afetar a interface principal da aplicação.

## Observação Técnica

Preferencialmente, o preview deve ser renderizado em `iframe` usando o HTML e CSS finais sincronizados. Isso reduz conflitos de estilo, melhora o isolamento e permite validar o resultado visual com mais segurança.

## Decisão Técnica Aplicada

- O servidor pode servir páginas estáticas adicionais da pasta `frontend/`, mantendo a rota principal `/` para o Figma Creator.
- A implementação deve converter o contexto MCP do Figma para HTML/CSS nativo do projeto, sem instalar React, Tailwind ou dependências novas.
- A estrutura deve preservar semântica e acessibilidade: formulário real, radio group para entrada/saída, cards de resumo com `article`, tabela com `thead`, `tbody` e `th scope="col"`, além de sidebar com `aside` e `nav`.
- A página estática serve como validação visual isolada e não deve interferir no fluxo principal de importação, geração e preview.

## Prompt curto para Codex

Melhorar o RF08 — Preview do Resultado.

O preview deve renderizar HTML + CSS gerados de forma sincronizada, usando a versão final da árvore refinada. Ele deve atualizar após cada regeneração, evitar versões antigas, isolar o resultado da interface principal preferencialmente via iframe e exibir estados de carregamento e erro.

Incluir também suporte a preview responsivo com modos desktop, tablet e mobile, além de validação para evitar que CSS gerado afete a aplicação principal.

Manter o SDD atualizado com todas as alterações, adições e decisões técnicas aplicadas, sem remover ou regredir requisitos já existentes.

## 🔹 RF09 — Fidelidade de Sombras, Tamanho de Pais, Radii de Botão e Bordas de Tabela (Correções de Alta Fidelidade)

Este requisito estabelece as especificações técnicas para sanar divergências visuais e estruturais finas identificadas no CSS gerado em relação ao Figma original.

### Regras de Sombras e Textos

- **Sombras de Texto (text-shadow):** Elementos identificados como texto (`text`, `span`, `p`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`) com efeitos de `DROP_SHADOW` no Figma devem mapear esses efeitos para a propriedade CSS `text-shadow` em vez de `box-shadow`.
- **Stroke de Texto:** Strokes extraidos de nos de texto devem atingir os glifos com `-webkit-text-stroke` no CSS base. Overlays e merge nao devem converter stroke textual em `border` retangular do elemento.
- **Omissão do Parâmetro Spread:** A propriedade `text-shadow` não suporta o parâmetro `spread` do CSS. O gerador deve omitir o spread-radius na montagem da string de sombra para evitar que o navegador rejeite a regra de estilo.
- **Evitar Sombras Quadradas em Textos:** Nenhum elemento de texto puro ou wrapper de texto puro deve renderizar `box-shadow` retangular.

### Regras de Dimensionamento de Pais (Min-Height vs Height)

- **Crescimento de Nós Pai:** Divs ou elementos que atuam como contêineres pai (possuem nós filhos) e não são classificados como componentes pequenos (como botões ou inputs) devem, no modo `visual-first`, herdar a altura original do Figma como `min-height` em vez de um `height` rígido fixo. Isso garante que o nó pai expanda dinamicamente e jamais fique menor do que os seus filhos.

### Regras de Radii e Sombras de Botão e Wrappers

- **Mesclagem de Fundo Robusta:** Na normalização visual, a identificação de formas de fundo (`isBackgroundShape`) deve empregar um limiar de cobertura geométrica reduzido (de 0.85 para 0.70) para tolerar pequenas distorções de caixas delimitadoras causadas por sombras ou ícones salientes.
- **Casamento de Contexto de Componente:** Se o elemento pai tem nome que sugere componente interativo ou campo (`botao`, `btn`, `button`, `salvar`, `cancelar`, `campo`, `field`, `input`, `select`, `segmented`, `card`), o limiar de cobertura de formas sem filhos para identificação como fundo é reduzido para 0.50.
- **Herança de Radius Incondicional:** Ao mesclar um retângulo de fundo no pai, o `borderRadius`, `fills`, `strokes` e `effects` do fundo devem sobrescrever incondicionalmente as propriedades correspondentes do pai, garantindo que o border-radius do botão seja compilado no CSS final.

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
- A IA deve retornar resumo curto das alteracoes e alertas objetivos quando nao conseguir corrigir algo por falta de dados ou ausencia de MCP.

### Implementacao inicial

- O backend expoe `POST /api/generate/ai/context` para montar um pacote de contexto RF10.
- O pacote inclui prompt, restricoes, modo ativo, estrutura Figma normalizada, HTML, CSS, logs e link MCP opcional.
- A interface pode oferecer botao especifico para gerar contexto IA/MCP, mas deve reaproveitar a URL do Figma informada no inicio do fluxo, sem criar campo adicional de link nesta etapa.
- Esta etapa nao chama provedor de IA nem exige MCP ativo; ela prepara o contexto para uso interno/agente/dev e preserva o fluxo local quando MCP nao estiver disponivel.
- Exportacao unificada, ZIP, Git ou GitHub ficam para RF posterior e nao devem aparecer na UI desta etapa.

---

## RF11 - Uso de MCP/Figma como Fonte de Contexto Visual

O Model Context Protocol (MCP) deve ser suportado pelo sistema como uma fonte de contexto opcional para obter contexto detalhado diretamente do Figma, apoiando as ferramentas de inteligencia artificial ou agentes internos na melhoria do codigo gerado.

### Regras Funcionais

- **Nao Obrigatoriedade:** O uso de MCP e estritamente opcional. O sistema nao deve exigir que o usuario final tenha o MCP configurado para operacoes deterministicas basicas do parser.
- **Contexto Visual:** O sistema pode usar o MCP/Figma para obter contexto detalhado do frame ou no selecionado, como propriedades visuais refinadas, dimensoes, gaps e preenchimentos do design original.
- **Entrada do Link:** O usuario informa o link completo do frame ou no do Figma diretamente na interface do software.
- **Leitura pelo Backend:** O backend identifica o frame/no a partir do link informado e coleta o contexto visual via MCP/Figma quando disponivel.
- **Papel Complementar:** O MCP funciona estritamente como fonte de contexto complementar, integrando-se e enriquecendo a arvore extraida, a normalizacao e a geracao de codigo base. O MCP nao substitui o parser deterministico, a geracao JS local ou a IA em si.

### Resultado

- O backend consegue ler contexto de alta fidelidade visual do Figma via MCP, alimentando o pipeline interno sem depender de ferramentas externas do usuario.

---

## RF11.1 - Agent Runner para Geracao Automatizada via IA/MCP

O backend do software deve conter um **Agent Runner** (orquestrador de IA) que coordene a geracao e a melhoria automatizada do codigo (HTML/CSS) dentro da propria aplicacao, de forma integrada, sem exigir que o usuario utilize ferramentas ou interfaces externas (como Codex, VS Code, Claude ou Cursor) ou execute prompts de forma manual.

### Objetivo

Automatizar a interacao com a IA de forma transparente no backend do sistema, combinando a precisao do parser JavaScript com o refinamento estetico gerado pela IA alimentada por contexto visual.

### Regras Funcionais

- **Orquestrador Interno (Agent Runner):** O backend do software coordena o fluxo de ponta a ponta de forma autonoma. O usuario nao precisa abrir editores externos, copiar prompts ou configurar agentes locais.
- **Fluxo Automatizado Interno:** O backend coleta contexto visual via MCP/Figma quando disponivel, monta o pacote com HTML/CSS deterministico JS, arvore original, arvore normalizada, logs e modo ativo responsivo, invoca o provedor de IA integrado e salva a resposta como versao candidata IA/MCP sem substituir a versao JS original.
- **Reuso da Sessao OAuth Figma:** O Agent Runner deve reutilizar a mesma sessao OAuth usada nas etapas de importacao/extracao do Figma. O token de acesso nao deve ser esperado em cookie separado; deve ser recuperado pela sessao `figma_creator_session` e renovado pelo fluxo OAuth existente quando aplicavel.
- **Patches Figma Deterministicos:** Quando o contexto Figma/API estiver disponivel, o backend deve extrair patches `figma-mcp` diretamente do `rawDocument` do Figma para seletores `[data-figma-id]`, com acabamento visual seguro como cores, bordas, raios e efeitos quando presentes. Esses patches devem ser gerados independentemente das sugestoes livres da IA.
- **Sem Overlay Geometrico no Consolidado Semantico:** Geometria plana e escala tipografica fixa do Figma (`position`, `left`, `top`, `width`, `height`, `font-size` e `line-height`) ja tratadas pela geracao base nao devem ser reaplicadas como overlay no merge sobre HTML semantico refinado, pois podem quebrar fluxo de formularios, tabelas e textos.
- **Origem `figma-mcp` Reservada:** Apenas patches extraidos deterministicamente do Figma/API real podem usar `source: figma-mcp`. Quando a IA sugerir ou inferir um patch e tentar classifica-lo como `figma-mcp`, o backend deve rebaixar a origem para `ai-merge-agent` e preservar no relatorio que foi uma sugestao da IA, nao um valor real do Figma.
- **Metadados da Versao Candidata:** A versao candidata salva no backend deve conter HTML, CSS, origem `ia-mcp`, link do Figma, modo ativo, timestamp, logs, metadados estruturais do frame e referencia explicita a versao JS usada como base.
- **Persistencia do Contexto Visual para Merge:** A versao candidata IA/MCP deve preservar em memoria o `mcpContext` completo usado pelo Agent Runner, incluindo `rawDocument` quando disponivel, para que o RF11.2 consiga aplicar a camada visual real do Figma. O merge nao deve reconstruir o contexto apenas a partir de metadados resumidos do frame.
- **Camada Visual da Arvore Normalizada:** Alem do `rawDocument`, o RF11.2 deve usar a propria arvore normalizada que gerou o HTML como fonte visual deterministica, pois ela compartilha os mesmos `data-figma-id` do HTML final. No consolidado semantico, essa camada deve complementar acabamento seguro como cores, bordas, radii e efeitos sem reintroduzir geometria plana, escala tipografica fixa ou posicionamento absoluto que quebrem o fluxo do CSS base.
- **Interface de Comparacao:** O usuario pode visualizar e comparar a versao JS deterministica original com a versao candidata IA/MCP em paineis de visualizacao dupla diretamente no frontend.
- **Log de Debug de Ponta a Ponta:** O backend deve registrar em `logs/figma-creator-debug.log` as etapas executadas e os artefatos gerados do inicio ao fim do fluxo: frames importados, estrutura Figma extraida, arvore normalizada, HTML base, HTML refinado, CSS base, contexto IA, versao candidata IA/MCP, patches, merge consolidado e exportacao. O log deve indicar se a IA real foi executada, se houve fallback deterministico e se o contexto Figma/MCP real foi coletado.
- **Diagnostico de Fallback IA:** Quando o provedor de IA estiver configurado, mas a resposta cair em fallback deterministico, o Agent Runner deve registrar o motivo tecnico da falha de IA, como erro HTTP, resposta vazia, JSON invalido ou campos obrigatorios ausentes.
- **Refinamento Visual Responsivo:** O Agent Runner deve pedir que a IA recupere acabamento visual com resultado web bonito, responsivo e legivel quando o parser deterministico nao representar bem o design, sem trocar a estrutura final e usando patches especificos rastreaveis por `data-figma-id`.
- **Protecao de Segredos no Log:** O log de debug nunca deve gravar tokens OAuth, client secret, API keys, cookies ou credenciais. Deve registrar apenas estados booleanos ou descricoes seguras, como `GEMINI_API_KEY configurada: Sim/Nao`.

### Resultado

O software gera uma versao candidata automatizada com apoio de IA/MCP, salva o resultado no backend e permite comparacao com a versao JS deterministica.

---

## RF11.2 - Merge Hibrido e Consolidacao do Codigo Gerado

O sistema deve consolidar o codigo gerado antes da exportacao por meio de um processo de **Merge Hibrido baseado em Patches Seletivos com AI Merge Agent**, comparando e combinando a estrutura deterministica da versao JS principal com as melhorias de fidelidade visual da versao candidata IA/MCP, **sem concatenacao de CSS**.

### Objetivo

Produzir uma versao final limpa com CSS base JS enriquecido apenas por patches visuais seguros e validados, gerados e revisados pelo AI Merge Agent, preservando organizacao, rastreabilidade, fidelidade visual e estrutura semantica do pipeline deterministico.

### Modelo de Merge: Patches Seletivos com AI Merge Agent

A versao IA/MCP **nao** deve ser aplicada como bloco HTML/CSS completo por cima da base JS. O HTML final consolidado deve continuar sendo o HTML JS deterministico, por ser mais organizado, semantico e rastreavel. A versao IA/MCP deve ser usada como referencia visual e insumo comparativo.

O **AI Merge Agent** participa da etapa de merge, mas nao substitui o Agent Runner RF11.1 nem pode substituir livremente o HTML final. Ele compara as versoes disponiveis, analisa o contexto visual do Figma/MCP e retorna exclusivamente patches estruturados.

### Entradas do AI Merge Agent

O AI Merge Agent deve comparar:

- HTML e CSS base JS deterministico;
- HTML e CSS candidato IA/MCP;
- arvore normalizada do frame Figma;
- logs e metadados da execucao;
- contexto visual Figma/MCP, quando disponivel.

### Formato dos patches

Cada patch deve conter:

- `selector` - seletor existente no HTML JS final, preferencialmente `[data-figma-id="N:M"]`;
- `props` - propriedades CSS propostas;
- `source` - origem do ajuste, como `figma-mcp`, `ai-merge-agent` ou `deterministic-fallback`;
- `reason` - motivo objetivo do patch;
- `confidence` - confianca numerica ou categorizada;
- `figmaId` - referencia ao `data-figma-id`, quando houver.

A IA deve retornar patches estruturados, nunca codigo livre concatenado. Se a API de IA nao estiver disponivel, o backend pode usar um gerador deterministico de patches como fallback, mantendo o mesmo contrato.

### Regras Funcionais

- **Base Estrutural Imutavel (JS):** O HTML da versao JS deterministica e preservado integralmente. Atributos `data-figma-id`, classes semanticas, arvore normalizada e conteineres nao devem ser alterados pelo merge.
- **Referencia Visual IA/MCP:** A versao IA/MCP serve para apontar diferencas visuais e oportunidades de ajuste, nao para substituir a estrutura final.
- **Prioridade do Contexto Figma Real:** Patches `figma-mcp` extraidos do documento real do Figma devem ser combinados aos patches do AI Merge Agent e ter prioridade sobre inferencias `ia-inference` ou ajustes esteticos genericos.
- **Prioridade do Raw Document:** Em conflito de seletor/propriedade, patches com origem interna `figma-raw-document` vencem patches sugeridos pela IA, inclusive quando a IA usar valores diferentes para a mesma propriedade.
- **Patches como Unica Fonte de Mudanca CSS:** O merge aplica somente patches aceitos e validados nas regras CSS da base JS.
- **Preferencia por `data-figma-id`:** Seletores por `data-figma-id` vencem classes genericas sempre que existirem no HTML final.
- **Efetividade Visual do Patch:** Antes de aceitar um patch, o backend deve verificar se ele altera o estilo efetivo apos a cascata CSS. Patches aceitos nao podem ser apenas diferencas textuais anuladas por regras posteriores mais especificas.
- **Aplicacao com Precedencia Controlada:** Patches aceitos devem substituir declaracoes existentes no seletor correto ou ser aplicados em uma secao final `/* AI/MCP Applied Patches */`, preferencialmente por `[data-figma-id]`, garantindo precedencia visual real no CSS consolidado.
- **Preservacao do Fluxo no Consolidado:** O consolidado nao deve ficar pior que o candidato por reintroduzir posicionamento absoluto do Figma sobre HTML semantico; overlays deterministicos de merge devem preservar fluxo e legibilidade antes de buscar pixelizacao.
- **Promocao de Seletor:** Quando um patch chegar em classe generica, mas o HTML possuir elementos correspondentes com `data-figma-id`, o merge deve promover o patch para os seletores `[data-figma-id="..."]` correspondentes. Nao deve aceitar patch em classe se uma regra posterior por `data-figma-id` sobrescrever a mesma propriedade.
- **Validacao por Seletor:** Se o patch nao tiver seletor correspondente no HTML JS final, deve ser rejeitado ou enviado ao relatorio.
- **Aplicacao Controlada pelo Backend:** O backend aplica patches somente apos validacao estrutural.
- **Limpeza Pos-Merge:** O backend deve remover ou rejeitar seletores orfaos, propriedades duplicadas e estilos genericos conflitantes.
- **Validacao CSS por Seletores Reais:** A validacao de seletores orfaos deve analisar apenas seletores CSS reais, evitando regex simples sobre o CSS inteiro que confunda valores como `0.05`, `1.5`, `28px` ou `rgba(...)` com classes.
- **Sem Invencao de Estilos:** A IA nao deve inventar shadows, transitions, borders, radius ou efeitos sem base no Figma/MCP, na arvore normalizada, no candidato IA/MCP ou sem aprovacao explicita.
- **Refinamento Visual IA Rastreavel:** Patches `ai-visual-refinement` podem recuperar acabamento visual como `box-shadow`, `border-radius`, `letter-spacing` e `transition` quando tiverem seletor especifico rastreavel por `data-figma-id`, confianca minima validada pelo backend e nenhum conflito com valor deterministico do Figma.
- **Seletores Globais Bloqueados:** Seletores amplos como `button`, `.button`, `th`, `td`, `tr`, `label`, `span`, `input`, `textarea`, `select`, `.form-field`, `.table`, `.summary-card`, `.summary-value`, `.summary-label`, `a`, `p` e `div` nao devem receber patches sem validacao explicita de escopo.
- **Hierarquia de Conflito:** estrutura JS vence estrutura IA/MCP; `data-figma-id` vence classe generica; estilo Figma/MCP vence embelezamento generico da IA; patch seguro vence concatenacao.
- **Relatorio de Merge:** O sistema deve gerar relatorio com patches aceitos, rejeitados, conflitos e motivos, incluindo seletor, propriedades, origem, confianca e `figmaId` quando houver.
- **Auditoria em Arquivo `.log`:** O resultado do merge deve ser gravado no log de debug com HTML/CSS base, HTML/CSS candidato, HTML/CSS consolidado, relatorio, patches aceitos/rejeitados, resumo de diferencas reais e status do provedor de IA usado.
- **Botoes de Copia no Orquestrador IA & Agent Runner:** Todo bloco completo de codigo ou texto tecnico exibido deve possuir botao de copiar, incluindo HTML/CSS base, HTML/CSS candidato, HTML/CSS consolidado e relatorio/patches completos. A copia deve capturar o conteudo completo, nao apenas linhas visiveis, e exibir feedback simples `Copiado`.
- **Relevancia Visual Obrigatoria:** O merge deve comparar CSS base e CSS consolidado, registrar diferencas reais e avisar `nenhum patch visual relevante foi aplicado` quando nao houver melhoria perceptivel.
- **Alerta de Baixa Efetividade:** Se menos de 5 patches efetivos forem aplicados, o sistema deve alertar `Merge sem melhoria visual relevante`.
- **Bloqueio de Decoracao Generica:** `box-shadow`, `transition`, `border-radius` e `letter-spacing` devem vir de `figma-mcp` ou de refinamento visual IA rastreavel `ai-visual-refinement`; embelezamentos genericos sem escopo e sem rastreabilidade devem ser rejeitados.
- **Preview Auditavel:** O preview do Orquestrador deve indicar a versao renderizada (base JS, candidata IA/MCP ou consolidada), hash e timestamp, forcar recarregamento quando HTML/CSS mudar e oferecer botao `Recarregar preview`.
- **Comparacao Identica:** Quando duas versoes comparadas tiverem HTML/CSS identicos, a interface deve exibir aviso para evitar falsa interpretacao visual.
- **Exclusividade de Consumo:** A exportacao (RF12) deve consumir exclusivamente a versao consolidada valida do RF11.2, impedindo exportacao direta de versoes candidatas brutas.
- **Rastreabilidade de Exportacao:** As exportacoes ZIP/Git devem registrar no log de debug quais arquivos consolidados foram exportados, caminho/arquivo de saida e logs tecnicos relevantes da exportacao.

### Resultado

O sistema gera uma versao final consolidada e validada: HTML JS rastreavel preservado, CSS base JS enriquecido por patches visuais seguros validados pelo backend e relatorio de auditoria do merge, pronta para exportacao.

---

## RF12 - Exportacao do codigo gerado (NOVA FEATURE)

O sistema deve permitir exportar o codigo gerado em diferentes formatos. A exportacao deve consumir **exclusivamente** a versao de codigo final consolidada e validada pelo RF11.2, impedindo a exportacao direta de versoes candidatas brutas ou inacabadas.

### 12.1 Exportacao em ZIP

- Gerar pacote contendo a versao consolidada do RF11.2:
  - index.html
  - styles.css
  - assets (se houver)
- Disponibilizar download para o usuario

### Resultado

- Usuario baixa projeto frontend pronto e consolidado.

---

### 12.2 Exportacao para repositorio Git local

- Criar estrutura de projeto automaticamente com base no codigo consolidado do RF11.2
- Inicializar repositorio Git
- Criar commit inicial com o codigo gerado consolidado

### Resultado

- Projeto pronto versionado localmente com o codigo de merge hibrido.

---

### 12.3 Exportacao para GitHub (evolucao futura)

- Criar repositorio via API do GitHub
- Enviar arquivos automaticamente a partir do codigo consolidado do RF11.2
- Retornar link do repositorio

### Resultado

- Projeto publicado automaticamente no GitHub

---
# 5. Requisitos Não Funcionais

## RNF01 — Performance

O sistema deve processar e retornar frames em até 5 segundos.

## RNF02 — Segurança

Tokens de API devem ser armazenados apenas no backend.

## RNF03 — Usabilidade

Interface deve ser simples e guiada por fluxo linear.

## RNF04 — Escalabilidade

Arquitetura deve permitir adição futura de novos formatos de exportação.

## RNF05 — Manutenibilidade

Código e SDD devem evoluir juntos de forma incremental.

---

# 6. Arquitetura do Sistema

Frontend (HTML/CSS/JS)
↓
Backend (Node.js + Express)
↓
Figma API
↓
Parser de estrutura
↓
IA / MCP Layer
↓
Gerador de HTML/CSS
↓
Exportador (ZIP / Git / GitHub)

---

# 7. Evolução futura

- Exportação React
- Exportação Tailwind
- Editor visual do código gerado
- Histórico de versões
- Colaboração em tempo real
- Deploy automático

---

# 8. Observação de engenharia

Este SDD segue abordagem incremental (living document), sendo atualizado continuamente conforme novas funcionalidades são implementadas no sistema.
