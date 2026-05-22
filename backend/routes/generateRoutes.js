const { generateHtml } = require("../services/htmlGenerator");
const { refineHtml } = require("../services/htmlRefiner");
const { generateCss } = require("../services/cssGenerator");
const { normalizeVisualTree } = require("../services/figmaVisualTree");
const { buildAiImprovementContext } = require("../services/aiImprovementContext");
const { runAgentRunner } = require("../services/agentRunner");
const { performHybridMerge } = require("../services/mergeService");
const { getJsVersion, getIaCandidate, getConsolidated } = require("../services/candidateStore");
const { DEBUG_LOG_FILE, appendDebugLog } = require("../services/debugLogger");
const { getValidAccessToken } = require("../services/figmaOAuth");
const { SESSION_COOKIE_NAME, getSession } = require("../services/sessionStore");

const ACTIVE_GENERATION_MODE = "responsive";

function getVisualStructure(structure) {
  if (!structure) {
    return structure;
  }

  return structure.visual && structure.visual.normalized
    ? structure
    : normalizeVisualTree(structure);
}

function handleGenerateHtml(requestBody) {
  const structure = getVisualStructure(requestBody.structure);
  const html = generateHtml(structure);
  appendDebugLog("generate.html", {
    mode: ACTIVE_GENERATION_MODE,
    structure,
    files: {
      "index.html": html,
    },
  });

  return {
    html,
    debugLog: DEBUG_LOG_FILE,
  };
}

function handleRefineHtml(requestBody) {
  const structure = getVisualStructure(requestBody.structure);
  const result = refineHtml(structure);
  appendDebugLog("generate.html.refine", {
    inputStructure: structure,
    refinedStructure: result.structure,
    files: {
      "index.html": result.html,
    },
  });

  return {
    html: result.html,
    structure: result.structure,
    debugLog: DEBUG_LOG_FILE,
  };
}

function handleGenerateCss(requestBody) {
  const structure = getVisualStructure(requestBody.structure);
  const mode = ACTIVE_GENERATION_MODE;
  const css = generateCss(structure, "", { mode });
  appendDebugLog("generate.css", {
    mode,
    structure,
    files: {
      "styles.css": css,
    },
  });

  return {
    css,
    debugLog: DEBUG_LOG_FILE,
  };
}

function handleGenerateAiContext(requestBody) {
  const result = buildAiImprovementContext({
    ...requestBody,
    mode: ACTIVE_GENERATION_MODE,
    structure: getVisualStructure(requestBody.structure),
  });
  appendDebugLog("generate.ai.context", {
    mode: ACTIVE_GENERATION_MODE,
    context: result,
  });
  return {
    ...result,
    debugLog: DEBUG_LOG_FILE,
  };
}

async function handleRunAgentRunner(requestBody, requestContext) {
  const sessionId = requestContext?.cookies?.[SESSION_COOKIE_NAME];
  const session = getSession(sessionId);
  const accessToken = await getValidAccessToken(session);
  const result = await runAgentRunner({
    ...requestBody,
    mode: ACTIVE_GENERATION_MODE,
    structure: getVisualStructure(requestBody.structure),
  }, { accessToken });
  appendDebugLog("agent.runner", {
    figmaLink: requestBody.figmaLink || null,
    mode: ACTIVE_GENERATION_MODE,
    aiProvider: result.aiProvider,
    mcpContext: result.mcpContext,
    logs: result.iaCandidate?.metadata?.logs || [],
    files: {
      "base/index.html": result.jsVersion.html,
      "base/styles.css": result.jsVersion.css,
      "candidate/index.html": result.iaCandidate.html,
      "candidate/styles.css": result.iaCandidate.css,
    },
    patches: result.iaCandidate?.patches || [],
  });
  return {
    ...result,
    debugLog: DEBUG_LOG_FILE,
  };
}

async function handlePerformMerge(requestBody, requestContext) {
  // Retrieve patches and context stored during Agent Runner execution
  const storedCandidate = getIaCandidate();
  const storedPatches = storedCandidate?.patches || [];
  const mcpContext = storedCandidate?.metadata?.mcpContext || { available: false };
  if (storedCandidate?.metadata?.normalizedStructure) {
    mcpContext.normalizedStructure = storedCandidate.metadata.normalizedStructure;
  }

  const apiKey = process.env.GEMINI_API_KEY || null;
  const aiOptions = { apiKey, mcpContext };

  const result = await performHybridMerge(
    requestBody.jsHtml,
    requestBody.jsCss,
    requestBody.iaHtml,
    requestBody.iaCss,
    storedPatches,
    aiOptions
  );
  appendDebugLog("generate.merge", {
    aiProvider: {
      geminiApiKeyConfigured: Boolean(apiKey),
    },
    report: result.report,
    reportText: result.reportText,
    files: {
      "base/index.html": requestBody.jsHtml,
      "base/styles.css": requestBody.jsCss,
      "candidate/index.html": requestBody.iaHtml,
      "candidate/styles.css": requestBody.iaCss,
      "consolidated/index.html": result.html,
      "consolidated/styles.css": result.css,
    },
  });
  return {
    ...result,
    debugLog: DEBUG_LOG_FILE,
  };
}

function handleGetActiveCandidates() {
  return {
    jsVersion: getJsVersion(),
    iaCandidate: getIaCandidate(),
    consolidated: getConsolidated(),
  };
}

module.exports = {
  handleGenerateHtml,
  handleRefineHtml,
  handleGenerateCss,
  handleGenerateAiContext,
  handleRunAgentRunner,
  handlePerformMerge,
  handleGetActiveCandidates,
};
