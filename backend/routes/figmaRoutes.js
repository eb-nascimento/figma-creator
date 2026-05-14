const { fetchFigmaFile } = require("../services/figmaApi");
const { extractMainFrames } = require("../services/figmaFrames");
const { extractFigmaFileKey } = require("../services/figmaUrl");
const { SESSION_COOKIE_NAME, getSession } = require("../services/sessionStore");
const { getValidAccessToken } = require("../services/figmaOAuth");

async function getAuthorizedFigmaFile(requestBody, requestContext = {}) {
  const fileKey = extractFigmaFileKey(requestBody.url);
  const sessionId =
    requestContext.cookies && requestContext.cookies[SESSION_COOKIE_NAME];
  const session = getSession(sessionId);
  const accessToken = await getValidAccessToken(session);
  const figmaFile = await fetchFigmaFile(fileKey, { accessToken });

  return {
    fileKey,
    figmaFile,
  };
}

async function handleFigmaImport(requestBody, requestContext = {}) {
  const { fileKey, figmaFile } = await getAuthorizedFigmaFile(
    requestBody,
    requestContext
  );

  return {
    file_key: fileKey,
    figmaFile,
    frames: extractMainFrames(figmaFile),
  };
}

async function handleFigmaFrames(requestBody, requestContext = {}) {
  const { fileKey, figmaFile } = await getAuthorizedFigmaFile(
    requestBody,
    requestContext
  );

  return {
    file_key: fileKey,
    frames: extractMainFrames(figmaFile),
  };
}

module.exports = {
  handleFigmaFrames,
  handleFigmaImport,
};
