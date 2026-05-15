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
