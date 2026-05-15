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
