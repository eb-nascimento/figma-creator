# 📄 SDD v2 — AI Figma to Frontend Generator

---

# 1. Introdução

Este sistema é uma ferramenta web que converte telas criadas no Figma em código frontend (HTML e CSS), utilizando integração com API do Figma, processamento de estrutura de design e inteligência artificial (IA), com suporte futuro a MCP (Model Context Protocol).

O sistema tem como objetivo reduzir o tempo de desenvolvimento frontend e automatizar parte da tradução entre design e código, aproximando UX/UI e desenvolvimento.

---

# 2. Objetivo

O objetivo do sistema é:

* Importar projetos do Figma via URL
* Listar e selecionar frames (telas)
* Interpretar estrutura de design
* Gerar código HTML e CSS automaticamente
* Permitir visualização (preview) do resultado
* Permitir exportação do código gerado em múltiplos formatos (ZIP, Git)
* Evoluir para integração com IA e MCP para melhorias automáticas

---

# 3. Escopo (MVP e Evolução)

## ✔ MVP (primeira versão)

* Importação de URL do Figma
* Listagem de frames
* Seleção de tela
* Geração de HTML/CSS básico
* Preview do resultado
* Download do código em ZIP

---

## 🚀 Versões futuras

* Integração com IA para melhoria de código
* Integração MCP (tools de automação)
* Exportação para repositório Git local
* Push automático para GitHub
* Suporte a React / Tailwind
* Histórico de projetos
* Multiusuário
* Versionamento de telas geradas

---

# 4. Requisitos Funcionais (por feature)

---

## 🔹 RF01 — Importação de URL do Figma

O sistema deve permitir ao usuário inserir uma URL de um arquivo do Figma.

### Regras:

* Validar domínio figma.com
* Extrair file_key da URL
* Rejeitar URLs inválidas ou inacessíveis

### Resultado:

* Sistema identifica corretamente o projeto Figma

---

## 🔹 RF02 — Integração com API do Figma

O sistema deve consumir a API oficial do Figma para obter os dados do arquivo.

### Regras:

* Usar token de acesso no backend
* Buscar estrutura completa do arquivo
* Tratar erros de autenticação e permissões

### Resultado:

* JSON completo do Figma disponível para processamento

---

## 🔹 RF03 — Listagem de telas principais

O sistema deve listar as telas principais disponíveis no arquivo Figma para seleção do usuário.

### Regras
* Apenas frames principais devem ser exibidos
### Exibir:
* nome da tela
* ID do frame
* nome da página do Figma
* preview em miniatura
* Ordenação deve seguir a estrutura original do Figma
* Não carregar detalhes internos completos nesta etapa
* Dados completos da tela devem ser carregados apenas após seleção do usuário
* Resultado esperado

Usuário consegue identificar visualmente e selecionar corretamente a tela desejada para implementação.

## 🔹 RF04 — Seleção de frame

O usuário deve poder selecionar uma tela específica.

### Regras:

* Apenas um frame por vez
* Seleção enviada ao backend

### Resultado:

* Frame escolhido definido para processamento

---

## 🔹 RF05 — Extração de estrutura de layout

O sistema deve interpretar o frame selecionado.

### Regras:

* Identificar elementos:

  * textos
  * imagens
  * botões
  * containers
* Manter hierarquia do layout
* Preservar posições e dimensões

### Resultado:

* Estrutura convertida em árvore de elementos

---

## 🔹 RF06 — Geração de HTML

O sistema deve gerar HTML baseado na estrutura do frame.

### Regras:

* Utilizar tags semânticas quando possível
* Manter hierarquia do layout
* Código limpo e organizado

### Resultado:

* HTML equivalente à tela do Figma

---

## RF06.1 - Interpretacao e refinamento semantico do HTML

O sistema deve interpretar semanticamente a funcao dos elementos da tela antes da geracao visual, refinando o HTML gerado para produzir uma estrutura reutilizavel, acessivel, responsiva e adequada para manutencao futura.

### Regras gerais:

* Usar o HTML gerado na RF06 e a estrutura normalizada da RF05 como referencia
* Classificar elementos em uma arvore logica composta por tela, layout, regioes, secoes, componentes, elementos internos e decoracoes
* Nao depender apenas de aparencia, tamanho, cor ou posicao
* Considerar relacao entre componentes, proximidade visual, repeticao de padroes, hierarquia, conteudo textual, agrupamento e comportamento esperado
* Reduzir nomes genericos herdados do Figma, como group, rectangle e vector
* Gerar classes legiveis e orientadas ao papel do elemento na interface
* Nao derivar classes de texto a partir do conteudo exibido, como nomes, bancos, valores ou datas
* Usar classes por papel para textos, como title, subtitle, label, text, value ou classes de coluna quando estiverem em tabela
* Permitir que elementos repetidos com a mesma funcao visual compartilhem a mesma classe
* Nao adicionar IDs do Figma por padrao aos nomes de classe
* Usar IDs do Figma em classes apenas em etapa futura, se houver necessidade concreta de diferenciacao
* Iniciar com heuristicas locais e deterministicas
* Permitir evolucao futura com IA para revisar semantica, nomenclatura e organizacao
* Nao gerar CSS nesta etapa

### Regras de classificacao semantica:

* Diferenciar titulos principais, titulos de secao, subtitulos, labels e textos comuns
* Diferenciar botoes de acao, botoes com icone, botoes de envio e botoes de navegacao
* Identificar formularios, campos de entrada, selects, comboboxes, radio buttons, checkboxes e textareas quando houver indicios suficientes
* Diferenciar tabelas simples e data grids com filtro, paginacao, ordenacao ou carregamento incremental
* Diferenciar menus laterais, menus superiores, menus inferiores e grupos de botoes
* Diferenciar cards informativos, cards de indicadores e cards puramente visuais
* Identificar cards de indicadores/KPI como componentes de resumo, nao como blocos genericos
* Diferenciar grids de layout, grids de conteudo e estruturas flex
* Diferenciar icones funcionais e icones meramente decorativos
* Diferenciar componentes funcionais e elementos puramente visuais

### Regras de HTML semantico:

* Menus laterais devem ser gerados preferencialmente com aside e nav
* Menus fixados na lateral da tela devem ser classificados como sidebar, usando aside com nav interno
* Menus superiores, inferiores ou grupos de navegacao devem usar nav quando houver funcao de navegacao
* Formularios devem ser gerados com form
* Botoes devem ser gerados com button
* Acoes de envio identificadas, como salvar, devem usar button com type="submit" quando estiverem dentro de formulario
* Campos devem usar input, select ou textarea conforme a funcao identificada
* Campos de data devem ser gerados como input type="date" ou componente equivalente de date picker
* Campos de valor monetario devem ser gerados como input com inputmode="decimal" quando forem editaveis
* Campos de categoria e metodo devem ser gerados como select ou combobox quando forem opcoes selecionaveis
* Campos de descricao devem ser gerados como textarea quando forem editaveis
* Escolhas como entrada/saida devem ser geradas como radio group ou segmented control, conforme a estrutura visual
* Tabelas devem usar table, thead, tbody, tr, th e td
* Grupos identificados como tabela, cabecalho e linha devem ser refinados para estrutura de tabela quando houver padrao tabular
* Tabelas com filtro, ordenacao, paginacao ou carregamento incremental devem ser classificadas como data grid simples
* Data grids devem separar toolbar, filtros, tabela e acoes como carregar mais
* Celulas de tabela devem usar classes de coluna, como col-descricao, col-categoria, col-metodo, col-valor e col-data
* Cabecalhos de tabela devem receber scope="col" quando representarem colunas
* Titulos devem respeitar hierarquia correta com h1, h2 e h3
* h1 deve ser reservado para o titulo principal da tela ou de uma secao de alto nivel
* Textos de botao, valores monetarios, labels, datas, opcoes e nomes de indicadores nao devem ser gerados como h1
* Valores monetarios e indicadores devem usar elementos como strong, span, p ou small, conforme o papel semantico
* Cards de indicadores devem usar estrutura como article, label em span e valor principal em strong
* Textos internos de botoes devem ser renderizados como elementos neutros, como span com classe button-label, e nao como heading
* Elementos button devem ser limitados a controles pequenos, com nome de acao, icone direto ou texto de acao
* Evitar elementos button aninhados
* Manter grupos com multiplas acoes como containers, nao como button
* Nao converter containers grandes em button apenas por conterem icones descendentes

### Regras para elementos decorativos:

* Elementos decorativos como fundos, bordas, sombras, formas e camadas visuais devem ser convertidos preferencialmente em CSS
* Evitar divs desnecessarias para elementos genericos como shape ou group quando nao houver funcao semantica, estrutural ou interativa
* Omitir shapes decorativos sem conteudo, filhos ou funcao interativa do HTML refinado
* Permitir que icones repetidos compartilhem a mesma classe base sem sufixo numerico
* Padronizar icones funcionais com classes como icon e variacoes por funcao
* Marcar icones puramente decorativos como decorativos em etapa de acessibilidade
* Evitar classes genericas como group, shape e icon-graphic quando for possivel identificar funcao real, como sidebar-nav, filter-button, summary-card, movement-form, form-field, data-grid-toolbar e load-more-button

### Regras de acessibilidade:

* Botoes apenas com icone devem incluir aria-label
* aria-label de botoes com icone deve ser descritivo e funcional, evitando labels genericos como "Acao"
* Icones decorativos dentro de botoes devem usar aria-hidden="true"
* Campos de formulario devem possuir label associado
* Grupos de radio buttons ou checkboxes devem usar fieldset e legend quando aplicavel
* Icones decorativos devem usar aria-hidden="true"
* A hierarquia de titulos deve ser correta e nao deve pular niveis sem necessidade
* Tabelas devem associar corretamente cabecalhos e celulas
* A ordem do DOM deve priorizar leitura, acessibilidade e manutencao, mesmo que a ordem visual das camadas no Figma seja diferente
* Titulos de secao devem aparecer no HTML antes do conteudo principal da secao correspondente

### Regras de responsividade:

* Considerar adaptacao do layout para diferentes resolucoes
* Layouts em colunas no desktop devem prever reorganizacao parcial em tablet
* Secoes devem poder ser empilhadas no mobile quando necessario
* Tabelas devem prever scroll horizontal ou conversao futura para cards em telas pequenas
* Menus laterais devem poder evoluir para drawer, bottom navigation ou menu compacto

### Regras de tokens visuais:

* Preparar a extracao de tokens visuais a partir do Figma
* Tokens devem incluir cores, tipografia, espacamentos, raios de borda, sombras, tamanhos e estados visuais dos componentes
* Tokens devem ser reutilizados no codigo para evitar estilos repetitivos, inconsistentes ou acoplados a posicao exata dos elementos no Figma

### Resultado:

* HTML semanticamente refinado, organizado por componentes e preparado para geracao de CSS
* A entrega esperada nao deve ser uma reproducao estatica puramente visual, mas uma estrutura de codigo reutilizavel, acessivel, responsiva e sustentavel

---

## RF07 - Geracao de CSS

O sistema deve gerar CSS correspondente ao layout.

### Regras:

* Utilizar flexbox ou grid quando necessário
* Aplicar cores, espaçamentos e tipografia do Figma
* Evitar estilos inline

### Resultado:

* CSS funcional e visualmente próximo do design

---

## 🔹 RF08 — Preview do resultado

O sistema deve permitir visualizar o resultado gerado.

### Regras:

* Renderizar HTML + CSS em tempo real
* Atualizar preview após regeneração

### Resultado:

* Usuário visualiza a tela convertida

---

## 🔹 RF09 — Integração com IA (melhoria de código)

O sistema pode utilizar IA para melhorar o código gerado.

### Regras:

* IA pode reorganizar HTML/CSS
* IA pode sugerir melhorias de semântica
* IA não pode alterar estrutura base sem solicitação

### Resultado:

* Código mais limpo e profissional

---

## 🔹 RF10 — Integração MCP (Model Context Protocol)

O sistema deve expor funções como ferramentas (tools) via MCP.

### Tools previstas:

* getFigmaFrames(fileKey)
* getFrameStructure(frameId)
* generateHTML(structure)
* generateCSS(structure)

### Resultado:

* IA consegue interagir com o sistema como ferramenta

---

## 🔹 RF11 — Exportação do código gerado (NOVA FEATURE)

O sistema deve permitir exportar o código gerado em diferentes formatos.

### 11.1 Exportação em ZIP

* Gerar pacote contendo:

  * index.html
  * styles.css
  * assets (se houver)
* Disponibilizar download para o usuário

### Resultado:

* Usuário baixa projeto frontend pronto

---

### 11.2 Exportação para repositório Git local

* Criar estrutura de projeto automaticamente
* Inicializar repositório Git
* Criar commit inicial com código gerado

### Resultado:

* Projeto pronto versionado localmente

---

### 11.3 Exportação para GitHub (evolução futura)

* Criar repositório via API do GitHub
* Enviar arquivos automaticamente
* Retornar link do repositório

### Resultado:

* Projeto publicado automaticamente no GitHub

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

* Exportação React
* Exportação Tailwind
* Editor visual do código gerado
* Histórico de versões
* Colaboração em tempo real
* Deploy automático

---

# 8. Observação de engenharia

Este SDD segue abordagem incremental (living document), sendo atualizado continuamente conforme novas funcionalidades são implementadas no sistema.
