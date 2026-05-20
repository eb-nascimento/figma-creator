const { isFigmaHostname } = require("./figmaUrl");

class AiImprovementContextError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AiImprovementContextError";
    this.statusCode = statusCode;
  }
}

function normalizeMode(mode) {
  const allowedModes = new Set(["visual-first", "responsive", "semantico", "semantic"]);
  return allowedModes.has(mode) ? mode : "visual-first";
}

function normalizeFigmaLink(rawLink) {
  const link = typeof rawLink === "string" ? rawLink.trim() : "";

  if (!link) {
    return null;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(link);
  } catch {
    throw new AiImprovementContextError("Link MCP do Figma invalido.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol) || !isFigmaHostname(parsedUrl.hostname)) {
    throw new AiImprovementContextError("Link MCP deve pertencer ao dominio figma.com.");
  }

  const rawNodeId = parsedUrl.searchParams.get("node-id") || "";
  const nodeId = rawNodeId ? rawNodeId.replace("-", ":") : null;

  return {
    link,
    nodeId,
    available: true,
    instruction: nodeId
      ? `Use o MCP do Figma para ler este frame/no: ${link}`
      : `Use o MCP do Figma para ler este link: ${link}`,
  };
}

function summarizeStructure(structure) {
  if (!structure || typeof structure !== "object") {
    return null;
  }

  return {
    id: structure.id || null,
    name: structure.name || null,
    type: structure.type || null,
    className: structure.className || null,
    figmaType: structure.figmaType || null,
    layout: structure.layout || null,
    visual: structure.visual
      ? {
          normalized: Boolean(structure.visual.normalized),
          region: structure.visual.region || null,
          layoutKind: structure.visual.layoutKind || null,
          childCount: structure.visual.childCount || 0,
        }
      : null,
  };
}

function normalizeLogs(logs) {
  if (!Array.isArray(logs)) {
    return [];
  }

  return logs.filter((entry) => typeof entry === "string" && entry.trim()).map((entry) => entry.trim());
}

function buildAiImprovementContext(input = {}) {
  const structure = input.structure;

  if (!structure) {
    throw new AiImprovementContextError("Estrutura Figma extraida e obrigatoria para o contexto de IA.");
  }

  const mode = normalizeMode(input.mode);
  const mcp = normalizeFigmaLink(input.figmaLink || input.figma_link);
  const html = typeof input.html === "string" ? input.html : "";
  const css = typeof input.css === "string" ? input.css : "";
  const logs = normalizeLogs(input.logs);

  const prompt = [
    "Revise e melhore o HTML/CSS gerado a partir do Figma.",
    "Preserve a estrutura base, data-figma-id, rastreabilidade e o modo ativo.",
    "Nao substitua a arvore extraida, a normalizacao ou a geracao base.",
    mode === "visual-first"
      ? "Modo visual-first: priorize fidelidade visual ao Figma; tamanhos fixos do Figma podem ser usados como apoio inicial."
      : `Modo ${mode}: preserve o objetivo do modo ativo.`,
    mcp
      ? mcp.instruction
      : "MCP indisponivel ou nao informado: use HTML, CSS, arvore extraida, arvore normalizada e logs como contexto.",
  ].join("\n");

  return {
    mode,
    mcp: mcp || {
      available: false,
      link: null,
      nodeId: null,
      instruction: "MCP nao informado. Continuar com contexto local.",
    },
    prompt,
    constraints: [
      "Nao remover data-figma-id.",
      "Nao inventar componentes que nao existam no Figma.",
      "Nao trocar o layout principal sem solicitacao.",
      "Nao apagar regras funcionais sem justificativa.",
      "Manter HTML e CSS sincronizados.",
    ],
    context: {
      structureSummary: summarizeStructure(structure),
      structure,
      html,
      css,
      logs,
    },
    summary: {
      hasMcpLink: Boolean(mcp),
      hasHtml: Boolean(html),
      hasCss: Boolean(css),
      logCount: logs.length,
    },
  };
}

module.exports = {
  AiImprovementContextError,
  buildAiImprovementContext,
  normalizeFigmaLink,
};
