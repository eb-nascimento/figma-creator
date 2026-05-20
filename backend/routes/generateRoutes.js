const { generateHtml } = require("../services/htmlGenerator");
const { refineHtml } = require("../services/htmlRefiner");
const { generateCss } = require("../services/cssGenerator");
const { normalizeVisualTree } = require("../services/figmaVisualTree");
const { buildAiImprovementContext } = require("../services/aiImprovementContext");

function getVisualStructure(structure) {
  if (!structure) {
    return structure;
  }

  return structure.visual && structure.visual.normalized
    ? structure
    : normalizeVisualTree(structure);
}

function handleGenerateHtml(requestBody) {
  const html = generateHtml(getVisualStructure(requestBody.structure));

  return {
    html,
  };
}

function handleRefineHtml(requestBody) {
  const result = refineHtml(getVisualStructure(requestBody.structure));

  return {
    html: result.html,
    structure: result.structure,
  };
}

function handleGenerateCss(requestBody) {
  const css = generateCss(getVisualStructure(requestBody.structure), "", { mode: requestBody.mode || "visual-first" });

  return {
    css,
  };
}

function handleGenerateAiContext(requestBody) {
  return buildAiImprovementContext({
    ...requestBody,
    structure: getVisualStructure(requestBody.structure),
  });
}

module.exports = {
  handleGenerateHtml,
  handleRefineHtml,
  handleGenerateCss,
  handleGenerateAiContext,
};
