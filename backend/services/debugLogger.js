const fs = require("node:fs");
const path = require("node:path");

const LOG_DIR = path.resolve(__dirname, "..", "..", "logs");
const DEBUG_LOG_FILE = path.join(LOG_DIR, "figma-creator-debug.log");

function redactSecrets(key, value) {
  const normalizedKey = String(key || "").toLowerCase();
  const configurationState = normalizedKey.includes("configured") && typeof value === "boolean";

  if (configurationState) {
    return value;
  }

  if (
    normalizedKey.includes("token") ||
    normalizedKey.includes("secret") ||
    normalizedKey.includes("apikey") ||
    normalizedKey.includes("api_key") ||
    normalizedKey.includes("cookie") ||
    normalizedKey.includes("authorization")
  ) {
    return value ? "[redacted]" : value;
  }

  return value;
}

function stringifyPayload(payload) {
  try {
    return JSON.stringify(payload, redactSecrets, 2);
  } catch (error) {
    return JSON.stringify({
      error: "Nao foi possivel serializar payload de debug.",
      reason: error.message,
    }, null, 2);
  }
}

function appendDebugLog(step, payload = {}) {
  if (process.env.DEBUG_GENERATION_LOG === "false") {
    return null;
  }

  fs.mkdirSync(LOG_DIR, { recursive: true });

  const content = [
    "",
    `===== ${new Date().toISOString()} | ${step} =====`,
    stringifyPayload(payload),
  ].join("\n");

  fs.appendFileSync(DEBUG_LOG_FILE, `${content}\n`, "utf8");

  return DEBUG_LOG_FILE;
}

module.exports = {
  DEBUG_LOG_FILE,
  appendDebugLog,
};
