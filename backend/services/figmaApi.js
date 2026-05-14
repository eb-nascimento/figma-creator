class FigmaApiError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = "FigmaApiError";
    this.statusCode = statusCode;
  }
}

async function fetchFigmaFile(fileKey, options = {}) {
  const token = options.accessToken;
  const fetchImpl = options.fetchImpl || fetch;

  if (!token) {
    throw new FigmaApiError("Usuario nao autenticado com Figma.", 401);
  }

  const response = await fetchImpl(`https://api.figma.com/v1/files/${fileKey}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new FigmaApiError("Token do Figma invalido, expirado ou revogado.", 401);
  }

  if (response.status === 403) {
    throw new FigmaApiError("Sem permissao para acessar o arquivo do Figma.", 403);
  }

  if (response.status === 404) {
    throw new FigmaApiError("Arquivo do Figma nao encontrado ou inacessivel.", 404);
  }

  if (!response.ok) {
    throw new FigmaApiError("Erro ao consultar a API do Figma.", 502);
  }

  return response.json();
}

module.exports = {
  FigmaApiError,
  fetchFigmaFile,
};
