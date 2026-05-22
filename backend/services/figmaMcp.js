const { fetchFigmaNodes } = require("./figmaApi");
const { isFigmaHostname } = require("./figmaUrl");

class FigmaMcpError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "FigmaMcpError";
    this.statusCode = statusCode;
  }
}

function parseFigmaLink(linkStr) {
  const link = typeof linkStr === "string" ? linkStr.trim() : "";
  if (!link) {
    throw new FigmaMcpError("Link do Figma nao informado.");
  }

  let url;
  try {
    url = new URL(link);
  } catch {
    throw new FigmaMcpError("Link do Figma invalido.");
  }

  if (!["http:", "https:"].includes(url.protocol) || !isFigmaHostname(url.hostname)) {
    throw new FigmaMcpError("Link do Figma deve pertencer ao dominio figma.com.");
  }

  const fileKeyMatch = url.pathname.match(/\/(?:file|design)\/([a-zA-Z0-9]+)/);
  const fileKey = fileKeyMatch ? fileKeyMatch[1] : null;

  const rawNodeId = url.searchParams.get("node-id") || "";
  const nodeId = rawNodeId ? rawNodeId.replace("-", ":") : null;

  return {
    fileKey,
    nodeId,
  };
}

function normalizeNodeId(nodeId) {
  const value = typeof nodeId === "string" ? nodeId.trim() : "";
  return value ? value.replace("-", ":") : null;
}

async function getVisualContext(figmaLink, options = {}) {
  const { accessToken } = options;
  let parsed;

  try {
    parsed = parseFigmaLink(figmaLink);
  } catch (error) {
    return {
      available: false,
      reason: error.message,
      properties: null,
    };
  }

  const { fileKey } = parsed;
  const linkNodeId = parsed.nodeId;
  const preferredNodeId = normalizeNodeId(options.nodeId);
  const nodeId = preferredNodeId || linkNodeId;
  const nodeIdOverridden = Boolean(preferredNodeId && preferredNodeId !== linkNodeId);

  if (!fileKey || !nodeId) {
    return {
      available: false,
      reason: "Link incompleto, nodeId ou fileKey ausentes.",
      properties: null,
    };
  }

  if (!accessToken) {
    return {
      available: false,
      source: "unavailable",
      reason: "Token OAuth do Figma ausente; contexto visual real nao foi coletado.",
      fileKey,
      nodeId,
      linkNodeId,
      nodeIdOverridden,
      properties: null,
    };
  }

  // Attempt real Figma API node fetch if token is available
  if (accessToken) {
    try {
      const nodesData = await fetchFigmaNodes(fileKey, [nodeId], { accessToken });
      const nodeWrapper = nodesData[nodeId];
      if (nodeWrapper && nodeWrapper.document) {
        const doc = nodeWrapper.document;
        return {
          available: true,
          source: "figma-api",
          fileKey,
          nodeId,
          linkNodeId,
          nodeIdOverridden,
          properties: {
            name: doc.name || "Frame",
            type: doc.type || "FRAME",
            width: doc.absoluteBoundingBox ? doc.absoluteBoundingBox.width : null,
            height: doc.absoluteBoundingBox ? doc.absoluteBoundingBox.height : null,
            backgroundColor: doc.backgroundColor || null,
            cornerRadius: doc.cornerRadius || doc.rectangleCornerRadii || null,
            paddingLeft: doc.paddingLeft || null,
            paddingRight: doc.paddingRight || null,
            paddingTop: doc.paddingTop || null,
            paddingBottom: doc.paddingBottom || null,
            itemSpacing: doc.itemSpacing || null,
            rawDocument: doc,
          },
        };
      }
    } catch (error) {
      return {
        available: false,
        source: "figma-api",
        reason: `Falha ao coletar contexto visual real do Figma: ${error.message}`,
        fileKey,
        nodeId,
        linkNodeId,
        nodeIdOverridden,
        properties: null,
      };
    }
  }

  return {
    available: false,
    source: "unavailable",
    reason: "Contexto visual real do Figma indisponivel.",
    fileKey,
    nodeId,
    linkNodeId,
    nodeIdOverridden,
    properties: null,
  };
}

module.exports = {
  FigmaMcpError,
  parseFigmaLink,
  getVisualContext,
};
