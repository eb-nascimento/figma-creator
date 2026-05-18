const {
  fetchFigmaFile,
  fetchFigmaImages,
  fetchFigmaNodes,
} = require("../services/figmaApi");
const {
  attachFrameThumbnails,
  extractMainFrames,
  findMainFrameById,
} = require("../services/figmaFrames");
const {
  normalizeFigmaNode,
  summarizeStructure,
} = require("../services/figmaStructure");
const { normalizeVisualTree } = require("../services/figmaVisualTree");
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
    session,
  };
}

async function getFramesWithThumbnails(fileKey, accessToken, figmaFile) {
  const frames = extractMainFrames(figmaFile);
  const thumbnails = await fetchFigmaImages(
    fileKey,
    frames.map((frame) => frame.id),
    { accessToken }
  );

  return attachFrameThumbnails(frames, thumbnails);
}

async function handleFigmaImport(requestBody, requestContext = {}) {
  const { fileKey, accessToken, figmaFile } = await getAuthorizedFigmaFile(
    requestBody,
    requestContext
  );

  return {
    file_key: fileKey,
    figmaFile,
    frames: await getFramesWithThumbnails(fileKey, accessToken, figmaFile),
  };
}

async function handleFigmaFrames(requestBody, requestContext = {}) {
  const { fileKey, accessToken, figmaFile } = await getAuthorizedFigmaFile(
    requestBody,
    requestContext
  );

  return {
    file_key: fileKey,
    frames: await getFramesWithThumbnails(fileKey, accessToken, figmaFile),
  };
}

async function handleFigmaFrameSelection(requestBody, requestContext = {}) {
  const frameId = requestBody.frame_id || requestBody.frameId;

  if (!frameId) {
    const error = new Error("frame_id nao informado.");
    error.statusCode = 400;
    throw error;
  }

  const { fileKey, accessToken, figmaFile, session } = await getAuthorizedFigmaFile(
    requestBody,
    requestContext
  );
  const frames = await getFramesWithThumbnails(fileKey, accessToken, figmaFile);
  const selectedFrame = findMainFrameById(frames, frameId);

  if (!selectedFrame) {
    const error = new Error("Frame nao encontrado entre as telas principais do arquivo.");
    error.statusCode = 404;
    throw error;
  }

  session.selectedFrame = {
    fileKey,
    frame: selectedFrame,
    selectedAt: Date.now(),
  };

  return {
    file_key: fileKey,
    frame: selectedFrame,
  };
}

async function handleFigmaFrameStructure(requestBody, requestContext = {}) {
  const frameId = requestBody.frame_id || requestBody.frameId;

  if (!frameId) {
    const error = new Error("frame_id nao informado.");
    error.statusCode = 400;
    throw error;
  }

  const { fileKey, accessToken, figmaFile } = await getAuthorizedFigmaFile(
    requestBody,
    requestContext
  );
  const frames = extractMainFrames(figmaFile);
  const selectedFrame = findMainFrameById(frames, frameId);

  if (!selectedFrame) {
    const error = new Error("Frame nao encontrado entre as telas principais do arquivo.");
    error.statusCode = 404;
    throw error;
  }

  const nodes = await fetchFigmaNodes(fileKey, [frameId], { accessToken });
  const figmaNode = nodes[frameId] && nodes[frameId].document;
  const structure = normalizeVisualTree(normalizeFigmaNode(figmaNode));

  if (!structure) {
    const error = new Error("Estrutura do frame nao encontrada no Figma.");
    error.statusCode = 404;
    throw error;
  }

  return {
    file_key: fileKey,
    frame: selectedFrame,
    structure,
    summary: summarizeStructure(structure),
  };
}

module.exports = {
  handleFigmaFrameStructure,
  handleFigmaFrameSelection,
  handleFigmaFrames,
  handleFigmaImport,
};
