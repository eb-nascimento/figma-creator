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

async function fetchFigmaImages(fileKey, ids, options = {}) {
  const token = options.accessToken;
  const fetchImpl = options.fetchImpl || fetch;
  const frameIds = Array.isArray(ids) ? ids.filter(Boolean) : [];

  if (!token) {
    throw new FigmaApiError("Usuario nao autenticado com Figma.", 401);
  }

  if (frameIds.length === 0) {
    return {};
  }

  const requestUrl = new URL(`https://api.figma.com/v1/images/${fileKey}`);
  requestUrl.searchParams.set("ids", frameIds.join(","));
  requestUrl.searchParams.set("format", "png");
  requestUrl.searchParams.set("scale", "1");

  const response = await fetchImpl(requestUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new FigmaApiError("Token do Figma invalido, expirado ou revogado.", 401);
  }

  if (response.status === 403) {
    throw new FigmaApiError("Sem permissao para gerar previews do Figma.", 403);
  }

  if (response.status === 404) {
    throw new FigmaApiError("Arquivo do Figma nao encontrado ou inacessivel.", 404);
  }

  if (!response.ok) {
    throw new FigmaApiError("Erro ao gerar previews do Figma.", 502);
  }

  const payload = await response.json();
  return payload.images || {};
}

async function fetchFigmaNodes(fileKey, ids, options = {}) {
  const token = options.accessToken;
  const fetchImpl = options.fetchImpl || fetch;
  const nodeIds = Array.isArray(ids) ? ids.filter(Boolean) : [];

  if (!token) {
    throw new FigmaApiError("Usuario nao autenticado com Figma.", 401);
  }

  if (nodeIds.length === 0) {
    return {};
  }

  const requestUrl = new URL(`https://api.figma.com/v1/files/${fileKey}/nodes`);
  requestUrl.searchParams.set("ids", nodeIds.join(","));

  const response = await fetchImpl(requestUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    throw new FigmaApiError("Token do Figma invalido, expirado ou revogado.", 401);
  }

  if (response.status === 403) {
    throw new FigmaApiError("Sem permissao para acessar os nodes do Figma.", 403);
  }

  if (response.status === 404) {
    throw new FigmaApiError("Arquivo ou node do Figma nao encontrado.", 404);
  }

  if (!response.ok) {
    throw new FigmaApiError("Erro ao consultar os nodes do Figma.", 502);
  }

  const payload = await response.json();
  return payload.nodes || {};
}

module.exports = {
  FigmaApiError,
  fetchFigmaFile,
  fetchFigmaImages,
  fetchFigmaNodes,
};
