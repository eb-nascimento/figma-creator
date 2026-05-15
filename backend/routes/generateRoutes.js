const { generateHtml } = require("../services/htmlGenerator");
const { refineHtml } = require("../services/htmlRefiner");
const { generateCss } = require("../services/cssGenerator");

function handleGenerateHtml(requestBody) {
  const html = generateHtml(requestBody.structure);

  return {
    html,
  };
}

function handleRefineHtml(requestBody) {
  const result = refineHtml(requestBody.structure);

  return {
    html: result.html,
    structure: result.structure,
  };
}

function handleGenerateCss(requestBody) {
  const css = generateCss(requestBody.structure);

  return {
    css,
  };
}

function handleGenerateAll(requestBody) {
  // A única fonte de verdade: refinamento único
  const result = refineHtml(requestBody.structure);
  const css = generateCss(result.structure);

  return {
    html: result.html,
    css,
    structure: result.structure,
  };
}

module.exports = {
  handleGenerateHtml,
  handleRefineHtml,
  handleGenerateCss,
  handleGenerateAll,
};
