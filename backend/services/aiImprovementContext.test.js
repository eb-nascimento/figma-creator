const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildAiImprovementContext,
  normalizeFigmaLink,
} = require("./aiImprovementContext");

const baseStructure = {
  id: "117:203",
  name: "Nova Movimentacao Saida",
  type: "frame",
  className: "nova-movimentacao-saida",
  layout: {
    width: 1920,
    height: 1080,
  },
  visual: {
    normalized: true,
    region: "center",
    layoutKind: "horizontal",
    childCount: 3,
  },
};

test("builds AI improvement context with optional Figma MCP link", () => {
  const result = buildAiImprovementContext({
    structure: baseStructure,
    html: '<main data-figma-id="117:203"></main>',
    css: "[data-figma-id=\"117:203\"] { width: 1920px; }",
    mode: "visual-first",
    figmaLink:
      "https://www.figma.com/design/aAK3NZKQ10IQb8RmifZ1i1/Planejador-Financeiro?node-id=117-203&m=dev",
    logs: ["radius ausente"],
  });

  assert.equal(result.mode, "responsive");
  assert.equal(result.mcp.available, true);
  assert.equal(result.mcp.nodeId, "117:203");
  assert.equal(result.summary.hasMcpLink, true);
  assert.equal(result.summary.hasHtml, true);
  assert.equal(result.summary.hasCss, true);
  assert.match(result.prompt, /Use o MCP do Figma/);
  assert.match(result.prompt, /tela web bonita e legivel/);
  assert.match(result.prompt, /data-figma-id/);
  assert.equal(result.context.structureSummary.id, "117:203");
  assert.deepEqual(result.context.logs, ["radius ausente"]);
});

test("keeps AI context usable when MCP link is not available", () => {
  const result = buildAiImprovementContext({
    structure: baseStructure,
    mode: "responsive",
  });

  assert.equal(result.mode, "responsive");
  assert.equal(result.mcp.available, false);
  assert.equal(result.summary.hasMcpLink, false);
  assert.match(result.prompt, /MCP indisponivel/);
  assert.equal(result.context.structure.id, "117:203");
});

test("rejects non Figma MCP links", () => {
  assert.throws(
    () => normalizeFigmaLink("https://example.com/design/test?node-id=1-2"),
    /dominio figma.com/
  );
});
