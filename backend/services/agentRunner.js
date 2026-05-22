const { getVisualContext } = require("./figmaMcp");
const { improveCode } = require("./iaEngine");
const { saveJsVersion, saveIaCandidate } = require("./candidateStore");

class AgentRunnerError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "AgentRunnerError";
    this.statusCode = statusCode;
  }
}

async function runAgentRunner(input = {}, options = {}) {
  const { structure, html, css, mode, figmaLink, logs = [] } = input;
  const { accessToken } = options;

  if (!structure) {
    throw new AgentRunnerError("Estrutura Figma e obrigatoria para o orquestrador.");
  }
  if (!html || !css) {
    throw new AgentRunnerError("HTML e CSS deterministas originais sao obrigatorios.");
  }

  // 1. Save base JS version first for comparison and merge
  saveJsVersion(html, css);

  // 2. Retrieve visual context via Figma/MCP
  const mcpContext = await getVisualContext(figmaLink, {
    accessToken,
    // Keep the real Figma context aligned with the HTML/CSS generated from the selected frame.
    nodeId: structure.id || null,
  });

  // 3. Assemble prompt and instruction context
  const activeMode = "responsive";
  const figmaNodeInstruction = mcpContext.available
    ? `Utilize o contexto visual coletado do frame/no Figma (Id: ${mcpContext.nodeId}, Nome: ${mcpContext.properties?.name || "Desconhecido"}) para enriquecer o layout.`
    : "Link do Figma indisponivel ou nao configurado.";

  const prompt = [
    `Refine o layout gerado como uma tela web responsiva, bonita e legivel. Modo ativo: ${activeMode}.`,
    figmaNodeInstruction,
    `Use o Figma como referencia de identidade visual, mas prefira proporcoes, espacos, tipografia e controles agradaveis quando a fidelidade literal quebrar o layout.`,
    `Corrija acabamento visual que o parser deterministico nao representar bem, como raios de botoes, sombras de texto, bordas, contraste e estados especificos, sempre por seletor rastreavel.`,
    `Nenhum elemento pode ficar maior que o parent: mantenha divs, textos, imagens, tabelas, formularios e controles contidos pelo container responsivo, quebrando conteudo quando necessario.`,
    `Preserve a direcao estrutural extraida: nao inverta row para column nem column para row para responder a breakpoint.`,
    `Nao aplique sombra ou borda de caixa em texto quando o efeito pertence as letras.`,
    `Preserve os atributos data-figma-id e classes estruturais para fins de rastreabilidade.`,
  ].join("\n");

  // 4. Invoke IA Engine for visual improvements
  const apiKey = process.env.GEMINI_API_KEY || null;
  const apiKeyConfigured = Boolean(apiKey);
  const improvement = await improveCode(
    prompt,
    html,
    css,
    { normalizedStructure: structure, ...mcpContext },
    activeMode,
    apiKey
  );
  const usingRealIa = improvement.source === "gemini-api";
  const iaStatus = usingRealIa
    ? "IA real executada via Gemini API."
    : apiKeyConfigured
      ? "GEMINI_API_KEY configurada, mas a IA real nao retornou resultado valido; fallback deterministico foi usado."
      : "GEMINI_API_KEY ausente; fallback deterministico foi usado.";
  const fallbackReason = improvement.fallbackReason
    ? `Motivo fallback IA: ${improvement.fallbackReason}`
    : null;

  // 5. Store generated version candidate
  const metadata = {
    figmaLink: figmaLink || null,
    modo: activeMode,
    logs: [
      `Agent Runner orquestrado via backend usando ${improvement.source}.`,
      `IA real configurada (GEMINI_API_KEY): ${apiKeyConfigured ? "Sim" : "Nao"}.`,
      iaStatus,
      fallbackReason,
      `Contexto Figma/MCP resolvido: ${mcpContext.available ? "Sim (" + mcpContext.source + ")" : "Nao"}`,
      mcpContext.nodeIdOverridden
        ? `Contexto Figma/MCP alinhado ao frame extraido: node-id do link ${mcpContext.linkNodeId} -> ${mcpContext.nodeId}.`
        : null,
      mcpContext.reason ? `Motivo MCP/Figma: ${mcpContext.reason}` : null,
    ].filter(Boolean),
    frameMetadata: mcpContext.available
      ? {
          name: mcpContext.properties?.name || "Frame",
          nodeId: mcpContext.nodeId,
          dimensions: `${mcpContext.properties?.width}x${mcpContext.properties?.height}`,
        }
      : null,
    normalizedStructure: structure,
    mcpContext,
    baseJsVersionReference: "js-base-active",
  };

  const savedIa = saveIaCandidate(improvement.html, improvement.css, metadata, improvement.patches || []);

  return {
    success: true,
    jsVersion: { html, css },
    iaCandidate: savedIa,
    mcpContext,
    aiProvider: {
      provider: "gemini",
      apiKeyConfigured,
      source: improvement.source,
      usingRealIa,
      status: iaStatus,
      fallbackReason: improvement.fallbackReason || null,
    },
  };
}

module.exports = {
  AgentRunnerError,
  runAgentRunner,
};
