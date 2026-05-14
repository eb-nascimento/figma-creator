const FIGMA_FILE_PATH_SEGMENTS = new Set(["file", "design", "proto"]);

class FigmaUrlError extends Error {
  constructor(message) {
    super(message);
    this.name = "FigmaUrlError";
    this.statusCode = 400;
  }
}

function isFigmaHostname(hostname) {
  const normalized = hostname.toLowerCase();
  return normalized === "figma.com" || normalized.endsWith(".figma.com");
}

function extractFigmaFileKey(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new FigmaUrlError("Informe uma URL do Figma.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    throw new FigmaUrlError("URL invalida.");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new FigmaUrlError("A URL deve usar HTTP ou HTTPS.");
  }

  if (!isFigmaHostname(parsedUrl.hostname)) {
    throw new FigmaUrlError("A URL deve pertencer ao dominio figma.com.");
  }

  const segments = parsedUrl.pathname.split("/").filter(Boolean);
  const fileSegmentIndex = segments.findIndex((segment) =>
    FIGMA_FILE_PATH_SEGMENTS.has(segment)
  );
  const fileKey = segments[fileSegmentIndex + 1];

  if (fileSegmentIndex === -1 || !fileKey) {
    throw new FigmaUrlError("Nao foi possivel extrair o file_key da URL.");
  }

  if (!/^[a-zA-Z0-9]+$/.test(fileKey)) {
    throw new FigmaUrlError("O file_key extraido da URL e invalido.");
  }

  return fileKey;
}

module.exports = {
  FigmaUrlError,
  extractFigmaFileKey,
  isFigmaHostname,
};
