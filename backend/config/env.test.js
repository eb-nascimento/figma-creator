const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { loadEnv, parseEnvLine } = require("./env");

test("parses env key value lines", () => {
  assert.deepEqual(parseEnvLine("PORT=3000"), ["PORT", "3000"]);
  assert.deepEqual(parseEnvLine("FIGMA_ACCESS_TOKEN='token'"), [
    "FIGMA_ACCESS_TOKEN",
    "token",
  ]);
  assert.equal(parseEnvLine("# comment"), null);
  assert.equal(parseEnvLine(""), null);
});

test("loads env file without overriding existing process env values", () => {
  const envPath = path.join(os.tmpdir(), `figma-creator-${Date.now()}.env`);
  const previousPort = process.env.PORT;

  process.env.PORT = "9000";
  delete process.env.FIGMA_ACCESS_TOKEN_TEST;
  fs.writeFileSync(envPath, "PORT=3000\nFIGMA_ACCESS_TOKEN_TEST=abc123\n");

  try {
    loadEnv(envPath);

    assert.equal(process.env.PORT, "9000");
    assert.equal(process.env.FIGMA_ACCESS_TOKEN_TEST, "abc123");
  } finally {
    fs.unlinkSync(envPath);
    delete process.env.FIGMA_ACCESS_TOKEN_TEST;

    if (previousPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = previousPort;
    }
  }
});
