const fs = require("node:fs");
const test = require("node:test");
const assert = require("node:assert/strict");
const { DEBUG_LOG_FILE, appendDebugLog } = require("./debugLogger");

test("appendDebugLog writes debug blocks and redacts secrets", () => {
  process.env.DEBUG_GENERATION_LOG = "true";

  appendDebugLog("debug.logger.test", {
    fileKey: "abc123",
    accessToken: "secret-token",
    files: {
      "index.html": "<main>ok</main>",
    },
  });

  const content = fs.readFileSync(DEBUG_LOG_FILE, "utf8");

  assert.match(content, /debug\.logger\.test/);
  assert.match(content, /abc123/);
  assert.match(content, /<main>ok<\/main>/);
  assert.doesNotMatch(content, /secret-token/);
  assert.match(content, /\[redacted\]/);
});

test("appendDebugLog keeps boolean provider configuration state visible", () => {
  process.env.DEBUG_GENERATION_LOG = "true";

  appendDebugLog("debug.logger.provider-config.test", {
    apiKeyConfigured: true,
    geminiApiKeyConfigured: false,
    apiKey: "real-secret",
  });

  const content = fs.readFileSync(DEBUG_LOG_FILE, "utf8");

  assert.match(content, /"apiKeyConfigured": true/);
  assert.match(content, /"geminiApiKeyConfigured": false/);
  assert.doesNotMatch(content, /real-secret/);
});
