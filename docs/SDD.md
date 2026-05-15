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

## RF03 — Listagem de telas principais

O sistema deve listar as telas principais disponíveis no arquivo Figma para seleção do usuário.

Regras
* Apenas frames principais devem ser exibidos
Exibir:
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

## 🔹 RF07 — Geração de CSS

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
