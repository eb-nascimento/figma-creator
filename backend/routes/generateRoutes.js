const { generateHtml } = require("../services/htmlGenerator");
const { refineHtml } = require("../services/htmlRefiner");

function handleGenerateHtml(requestBody) {
  const html = generateHtml(requestBody.structure);

  return {
    html,
  };
}

function handleRefineHtml(requestBody) {
  const html = refineHtml(requestBody.structure);

  return {
    html,
  };
}

module.exports = {
  handleGenerateHtml,
  handleRefineHtml,
};
