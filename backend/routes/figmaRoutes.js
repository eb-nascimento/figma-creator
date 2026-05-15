const { fetchFigmaFile, fetchFigmaImages } = require("../services/figmaApi");
const {
  attachFrameThumbnails,
  extractMainFrames,
} = require("../services/figmaFrames");
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
    accessToken,
    figmaFile,
  };
}

async function handleFigmaImport(requestBody, requestContext = {}) {
  const { fileKey, accessToken, figmaFile } = await getAuthorizedFigmaFile(
    requestBody,
    requestContext
  );
  const frames = extractMainFrames(figmaFile);
  const thumbnails = await fetchFigmaImages(
    fileKey,
    frames.map((frame) => frame.id),
    { accessToken }
  );

  return {
    file_key: fileKey,
    figmaFile,
    frames: attachFrameThumbnails(frames, thumbnails),
  };
}

async function handleFigmaFrames(requestBody, requestContext = {}) {
  const { fileKey, accessToken, figmaFile } = await getAuthorizedFigmaFile(
    requestBody,
    requestContext
  );
  const frames = extractMainFrames(figmaFile);
  const thumbnails = await fetchFigmaImages(
    fileKey,
    frames.map((frame) => frame.id),
    { accessToken }
  );

  return {
    file_key: fileKey,
    frames: attachFrameThumbnails(frames, thumbnails),
  };
}

module.exports = {
  handleFigmaFrames,
  handleFigmaImport,
};
