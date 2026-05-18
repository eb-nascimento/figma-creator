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

O sistema deve gerar uma estrutura HTML inicial a partir da arvore normalizada produzida pela RF05.

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

- O refinamento deve usar o HTML gerado na RF06 e a estrutura normalizada da RF05 como referencia.
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
1. **Refinamento da Árvore:** O sistema interpreta a árvore extraída do Figma e gera uma árvore semântica e visual refinada, injetando as tags, classes, componentes, modificadores e tokens diretamente nos nós.
2. **Mutação Coordenada:** Se a análise visual/CSS exigir que um elemento precise de um contêiner (wrapper) para fins de responsividade (ex: `.table-wrapper` para transbordo horizontal), esse nó deve ser explicitamente adicionado à árvore refinada antes da geração do código final.
3. **Produção Dupla:** A partir dessa árvore consolidada, o sistema gera o HTML e o CSS de forma coordenada, garantindo que o CSS consuma exatamente as classes declaradas nos nós e o HTML renderize a mesma estrutura.
4. **Fallback:** O sistema pode manter a geração isolada de HTML ou CSS para fins de debug e compatibilidade, mas o fluxo principal de exportação deve ser sincronizado e integrado.

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

### Regras de Estilo de Componentes (Component Styling)
- O CSS deve diferenciar claramente componente raiz, elemento filho, estado e modificador.
- **Evitar especificidade acidental e estilos globais sujos:** Classes genéricas (ex: `.subtitle`, `.button`, `.icon`, `.form-control`) não devem receber dimensões fixas (widths, heights, margins arbitrárias) ou posicionamentos absolutos do Figma. Devem conter apenas estilos inerentes ao componente base.
- **Componentes Completos Reutilizáveis:** O gerador deve injetar bases de estilo profissionais para componentes identificados como `.sidebar-nav`, `.movimentacoes`, `.campos`, `.segmented-control`, `.summary-card__label` e `.summary-card__value`.
- **Layouts Coerentes de Telas:** Containers principais devem ter regras coerentes de fluxo continuo aplicadas ao seletor real emitido no HTML final, sem depender de uma tela de exemplo ou de uma classe fixa como `.screen`.
- **Consistência de Estrutura:** Se o CSS exigir wrappers para responsividade (como `.table-wrapper` ou `.content-area`), a estrutura do HTML gerado (Refiner) deve ser consistentemente atualizada para incluir esses wrappers e suas respectivas classes.
- **Formulários:** A classe `.form-control` é estritamente designada como classe de componente interativo nativo (aplicada em `input`, `select`, `textarea`), não como um contêiner (wrapper).
- **Outros:** `.button`, `.summary-card`, `.sidebar`, `.segmented-control`, `.icon` (ícones devem receber propriedades inerentes como `flex-shrink: 0`, `display`, e controle rígido de `width`/`height`).
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
- Adaptar grupos de cards/KPIs (`.valores`, `.summary-card`) para menos colunas em tablet e uma coluna em mobile.
- Adaptar grupos de campos e formularios (`.campos`, `.form-field`, `.form-control`, `.movement-form`) para largura total e empilhamento em telas menores.
- Manter tabelas/data grids utilizaveis no mobile com `.table-wrapper { overflow-x: auto; }` e largura minima da tabela.
- Preservar responsividade de segmented controls (`.segmented-control`) sem alterar a semantica do HTML.
- Adaptar sidebar sem JavaScript nesta etapa: largura compacta em tablet e navegacao horizontal com overflow em mobile.
- Preservar o fluxo semantico do HTML: a responsividade deve ser aplicada por CSS, sem trocar tags semanticas por divs genericas.
- Preservar a geracao sincronizada de HTML + CSS pela mesma arvore refinada.
- A classificacao de cards de resumo deve ser local ao componente compacto. Containers grandes, telas ou secoes com tabelas/formularios descendentes nao podem virar KPI apenas por conterem valores monetarios aninhados.

### Regras de Seletores e Validação (Sem Órfãos)
- **Validação:** O gerador deve obrigatoriamente validar todo o CSS contra o HTML gerado (string parse). É estritamente proibido gerar seletores órfãos (que não existem no HTML gerado) ou heranças de nomes obsoletos (ex: `.main-layout`, `.fundo`, `.button-select`).
- O gerador deve corrigir seletores inválidos (ex: união cega de classes `.form-field.form-field--valor.label`). O sistema usará preferencialmente seletores descendentes limpos.
- **Especialização Controlada:** Modificadores e classes muito específicas só devem receber as diferenças de estilo (ex: larguras e cores específicas), preservando o CSS base daquele componente sem duplicação de atributos (ex: não duplicar os atributos comuns de botão dentro de `.button--primary`).
- Os tokens consumidos pelas regras CSS devem **garantidamente** ter sido declarados na camada de `:root`, evitando variáveis vazias. O gerador de CSS deve injetar *fallbacks* padrão no `:root` (ex: `--color-text-secondary`) caso o motor não tenha extraído essas cores do Figma. O token do fundo da página deve usar explicitamente `--color-surface-alt` sempre que este diferir do surface principal, prevenindo falhas de contaste de fundos genéricos.
