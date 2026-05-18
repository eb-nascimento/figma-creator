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
- As media queries devem ajustar tambem o layout pai, nao apenas componentes filhos como sidebar, cards, campos e tabela.
- O sistema deve adaptar layouts em colunas para layouts empilhados em telas menores.
- O sistema deve permitir que tabelas tenham rolagem horizontal em telas pequenas.
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
- Quando houver sidebar como filha direta, o container pai deve controlar a direcao do layout e a reorganizacao responsiva.
- O seletor do layout principal deve ser sempre o seletor real existente no HTML final, e nao uma classe estrutural criada apenas no CSS.

#### Sidebar/Menu lateral

- Em desktop, pode permanecer lateral.
- Em tablet/mobile, pode ser ocultado, compactado ou preparado para drawer.
- O RF07.1 não precisa implementar a lógica JavaScript do drawer, apenas preparar o CSS quando aplicável.

#### Tabelas/Data grids

- Em telas pequenas, a tabela deve ficar dentro de um wrapper com `overflow-x: auto`.
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
- Quando necessario, o CSS pode permitir quebra de linha ou rolagem horizontal sem alterar a semantica do HTML.

### Decisoes tecnicas implementadas

- O gerador de CSS deve emitir uma camada propria `Responsiveness` com breakpoints em `1024px`, `768px` e `480px` somente quando os seletores existirem no HTML final.
- O HTML refinado nao deve depender de uma classe estrutural fixa como `.screen`; o container principal deve usar a classe real derivada da tela atual.
- O CSS base e responsivo deve gerar regras para o seletor real do container principal, como `.dashboard`, `.login`, `.landing-page` ou qualquer outra classe existente no HTML final.
- Ajustes de largura/flex da `.sidebar` dependem da existencia conjunta do container principal real e de `.sidebar`, evitando regras soltas em componentes sem pai responsivo.
- Nenhuma regra responsiva deve depender de nomes especificos de exemplo, como `.nova-movimentacao-entrada`.
- Novas classes estruturais so podem aparecer no CSS se tambem existirem no HTML refinado.
- Layouts de cards/KPIs identificados por `.valores` devem reduzir colunas no tablet e empilhar em mobile.
- Grupos de campos identificados por `.campos`, `.form-field`, `.form-control` e `.movement-form` devem receber regras para empilhamento e largura total em telas menores.
- Tabelas refinadas com `.table-wrapper` e `.table` devem manter rolagem horizontal no mobile e largura minima para preservar colunas.
- Segmented controls refinados com `.segmented-control` devem manter uso responsivo e sem quebra semantica.
- Sidebars devem receber comportamento responsivo sem exigir JavaScript nesta etapa: largura reduzida em tablet e navegacao horizontal compacta no mobile.
- O sistema deve evitar regras responsivas orfas, gerando CSS apenas para classes presentes no HTML refinado.
- A classificacao de cards de resumo deve ser local ao componente compacto. Telas, secoes grandes ou containers com tabelas/formularios descendentes nao podem ser classificados como KPI apenas por conterem valores monetarios aninhados.

### Critérios de Aceite

**Dado** que o sistema gerou HTML e CSS para uma tela com layout em colunas  
**Quando** a largura da viewport for reduzida  
**Então** o CSS deve adaptar o layout para evitar quebra visual.

**Dado** que a tela contenha tabela ou data grid  
**Quando** a tela for exibida em mobile  
**Então** a tabela deve permitir rolagem horizontal sem quebrar o layout.

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

## Prompt curto para Codex

Melhorar o RF08 — Preview do Resultado.

O preview deve renderizar HTML + CSS gerados de forma sincronizada, usando a versão final da árvore refinada. Ele deve atualizar após cada regeneração, evitar versões antigas, isolar o resultado da interface principal preferencialmente via iframe e exibir estados de carregamento e erro.

Incluir também suporte a preview responsivo com modos desktop, tablet e mobile, além de validação para evitar que CSS gerado afete a aplicação principal.

Manter o SDD atualizado com todas as alterações, adições e decisões técnicas aplicadas, sem remover ou regredir requisitos já existentes.

## 🔹 RF09 — Fidelidade de Sombras, Tamanho de Pais, Radii de Botão e Bordas de Tabela (Correções de Alta Fidelidade)

Este requisito estabelece as especificações técnicas para sanar divergências visuais e estruturais finas identificadas no CSS gerado em relação ao Figma original.

### Regras de Sombras e Textos
- **Sombras de Texto (text-shadow):** Elementos identificados como texto (`text`, `span`, `p`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`) com efeitos de `DROP_SHADOW` no Figma devem mapear esses efeitos para a propriedade CSS `text-shadow` em vez de `box-shadow`.
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

## RF10 — Integração com IA para Melhoria do Código Gerado

O sistema deve permitir o uso de IA para revisar, melhorar e refinar o código HTML/CSS gerado a partir do Figma, sem substituir a estrutura base da conversão e sem alterar elementos essenciais sem solicitação do usuário.

### Objetivo

Apoiar a melhoria da qualidade do código gerado, tornando-o mais limpo, organizado, semântico e visualmente mais próximo do Figma, especialmente quando a geração determinística não conseguir resolver todos os detalhes de estilização.

### Regras Funcionais

- A IA deve atuar como uma etapa posterior à geração base de HTML/CSS.
- A IA pode revisar HTML, CSS e metadados da árvore refinada.
- A IA pode sugerir melhorias de semântica, nomenclatura, organização e reaproveitamento de classes.
- A IA pode melhorar a fidelidade visual do CSS, considerando estilos extraídos do Figma.
- A IA pode corrigir problemas de radius, espaçamentos, tamanhos, alinhamentos, tabela, botões, cards, inputs, selects, SVGs e hierarquia visual.
- A IA pode utilizar os dados da árvore Figma, árvore normalizada, HTML gerado, CSS gerado e, futuramente, imagem/screenshot de referência.
- A IA não deve alterar a estrutura base do HTML sem solicitação explícita do usuário.
- A IA não deve remover `data-figma-id`, classes semânticas ou elementos necessários para rastreabilidade.
- A IA não deve apagar regras funcionais já geradas sem justificar a alteração.
- A IA deve preservar o objetivo do modo atual:
  - `visual-first`: priorizar semelhança visual com o Figma;
  - `responsivo`: priorizar adaptação web;
  - `semântico`: priorizar estrutura limpa e acessível.
- A IA deve poder operar em dois modos:
  - **Sugestão**: aponta melhorias sem aplicar automaticamente.
  - **Aplicação**: aplica ajustes no código gerado.
- Toda alteração aplicada pela IA deve manter HTML e CSS sincronizados.
- A IA deve retornar resumo curto do que foi alterado.
- O sistema deve evitar que a IA reescreva tudo desnecessariamente.
- O sistema deve registrar quando uma melhoria não puder ser aplicada por falta de dados do Figma.

### Restrições

- A IA não deve inventar componentes que não existam no Figma.
- A IA não deve trocar o layout principal sem autorização.
- A IA não deve remover elementos visuais importantes para simplificar o código.
- A IA não deve quebrar a rastreabilidade entre Figma, HTML e CSS.
- A IA não deve alterar o SDD ou regras do sistema sem solicitação específica.

### Entradas possíveis para IA

- Árvore original do Figma.
- Árvore normalizada/refinada.
- HTML gerado.
- CSS gerado.
- Modo de geração usado.
- Logs de propriedades ignoradas.
- Screenshot ou imagem de referência, em etapa futura.

### Saídas esperadas

- HTML/CSS revisado.
- Lista curta de melhorias aplicadas.
- Alertas sobre pontos não corrigidos.
- Código mais limpo, fiel e profissional.

### Critérios de Aceite

**Dado** que o sistema gerou HTML e CSS  
**Quando** o usuário solicitar melhoria com IA  
**Então** a IA deve revisar o código sem remover a estrutura base.

**Dado** que existam estilos do Figma não aplicados corretamente  
**Quando** a IA revisar o CSS  
**Então** ela deve tentar corrigir propriedades como radius, cores, fontes, tamanhos, bordas, sombras e espaçamentos.

**Dado** que o HTML possua `data-figma-id`  
**Quando** a IA melhorar o código  
**Então** esses identificadores devem ser preservados.

**Dado** que a IA não consiga corrigir um ponto visual  
**Quando** finalizar a revisão  
**Então** deve registrar o motivo de forma objetiva.

**Dado** que o modo seja `visual-first`  
**Quando** a IA aplicar melhorias  
**Então** deve priorizar fidelidade visual ao Figma, não responsividade.

### Observação Técnica

A IA deve ser tratada como uma camada de refinamento, não como substituta da extração, normalização e geração base. A geração determinística continua responsável por criar a estrutura inicial; a IA atua para melhorar qualidade, fidelidade e acabamento.

## 🔹 RF11 — Integração MCP (Model Context Protocol)

O sistema deve expor funções como ferramentas (tools) via MCP.

### Tools previstas:

- getFigmaFrames(fileKey)
- getFrameStructure(frameId)
- generateHTML(structure)
- generateCSS(structure)

### Resultado:

- IA consegue interagir com o sistema como ferramenta

---

## 🔹 RF12 — Exportação do código gerado (NOVA FEATURE)

O sistema deve permitir exportar o código gerado em diferentes formatos.

### 12.1 Exportação em ZIP

- Gerar pacote contendo:
  - index.html
  - styles.css
  - assets (se houver)

- Disponibilizar download para o usuário

### Resultado:

- Usuário baixa projeto frontend pronto

---

### 12.2 Exportação para repositório Git local

- Criar estrutura de projeto automaticamente
- Inicializar repositório Git
- Criar commit inicial com código gerado

### Resultado:

- Projeto pronto versionado localmente

---

### 12.3 Exportação para GitHub (evolução futura)

- Criar repositório via API do GitHub
- Enviar arquivos automaticamente
- Retornar link do repositório

### Resultado:

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
