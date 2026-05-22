const test = require("node:test");
const assert = require("node:assert/strict");
const { parseFigmaLink, getVisualContext } = require("./figmaMcp");

test("parses Figma links and extracts fileKey and nodeId", () => {
  const parsed = parseFigmaLink(
    "https://www.figma.com/design/aAK3NZKQ10IQb8RmifZ1i1/Planejador-Financeiro?node-id=117-203&m=dev"
  );
  assert.equal(parsed.fileKey, "aAK3NZKQ10IQb8RmifZ1i1");
  assert.equal(parsed.nodeId, "117:203");
});

test("returns error details when Figma link is invalid", async () => {
  const ctx = await getVisualContext("https://invalid-link.com");
  assert.equal(ctx.available, false);
  assert.match(ctx.reason, /figma.com/);
});

test("does not fake Figma/MCP context when token is missing", async () => {
  const ctx = await getVisualContext(
    "https://www.figma.com/design/aAK3NZKQ10IQb8RmifZ1i1/Planejador-Financeiro?node-id=117-203&m=dev"
  );
  assert.equal(ctx.available, false);
  assert.equal(ctx.source, "unavailable");
  assert.match(ctx.reason, /Token OAuth/);
  assert.equal(ctx.properties, null);
});

test("uses selected structure node when link points at another Figma node", async () => {
  const ctx = await getVisualContext(
    "https://www.figma.com/design/aAK3NZKQ10IQb8RmifZ1i1/Planejador-Financeiro?node-id=117-203&m=dev",
    { nodeId: "117:2" }
  );

  assert.equal(ctx.available, false);
  assert.equal(ctx.nodeId, "117:2");
  assert.equal(ctx.linkNodeId, "117:203");
  assert.equal(ctx.nodeIdOverridden, true);
});
