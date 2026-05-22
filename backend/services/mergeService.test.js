const test = require("node:test");
const assert = require("node:assert/strict");
const { performHybridMerge } = require("./mergeService");

// performHybridMerge is now async — all test calls must await it

test("applies accepted patches from IA onto JS base CSS using patch model", async () => {
  const jsHtml = '<main class="container" data-figma-id="1:2"></main>';
  const jsCss = ".container { width: 100%; display: flex; }";
  const iaHtml = '<main class="container" data-figma-id="1:2"></main>';
  const iaCss = "";
  const storedPatches = [
    {
      selector: ".container",
      props: { "border-radius": "12px", "box-shadow": "0 4px 6px rgba(0,0,0,0.1)" },
      source: "figma-mcp",
      reason: "cornerRadius from Figma context",
      confidence: 0.95,
    },
  ];

  const result = await performHybridMerge(jsHtml, jsCss, iaHtml, iaCss, storedPatches, {});

  assert.equal(result.success, true);
  assert.match(result.html, /data-figma-id="1:2"/);
  assert.match(result.css, /width:\s*100%/);
  assert.match(result.css, /display:\s*flex/);
  assert.match(result.css, /border-radius:\s*12px/);
  assert.match(result.css, /box-shadow/);
  assert.ok(result.report.accepted.length >= 1);
  assert.equal(result.report.rejected.length, 0);
  assert.ok(result.report.accepted.some((patch) => patch.source === "figma-mcp"));
});

test("rejects patches for generic blocked selectors absent from HTML", async () => {
  const jsHtml = '<div class="card-item" data-figma-id="2:1"></div>';
  const jsCss = ".card-item { padding: 16px; }";
  const iaHtml = jsHtml;
  const iaCss = "";
  const storedPatches = [
    { selector: "button", props: { "border-radius": "8px" }, source: "ia-inference", reason: "generic btn", confidence: 0.5 },
    { selector: ".button", props: { "box-shadow": "0 2px 4px" }, source: "ia-inference", reason: "generic .button", confidence: 0.5 },
    { selector: "th", props: { "background-color": "#f8fafc" }, source: "ia-inference", reason: "table header", confidence: 0.4 },
    { selector: ".card-item", props: { "background-color": "#f8fafc" }, source: "ai-merge-agent", reason: "candidate bg", confidence: 0.8 },
  ];

  const result = await performHybridMerge(jsHtml, jsCss, iaHtml, iaCss, storedPatches, {});

  assert.equal(result.success, true);
  assert.ok(
    result.report.accepted.some((patch) => patch.selector === '[data-figma-id="2:1"]'),
    ".card-item deve ser promovido para data-figma-id"
  );
  assert.ok(result.report.rejected.length >= 3, "button, .button e th devem ser rejeitados");
  assert.match(result.css, /background-color:\s*#f8fafc/);
  assert.doesNotMatch(result.css, /button\s*\{/);
  assert.doesNotMatch(result.css, /th\s*\{/);
});

test("rejects flex-direction patches that invert extracted layout flow", async () => {
  const jsHtml = '<section class="panel" data-figma-id="2:2"></section>';
  const jsCss = ".panel { display: flex; flex-direction: column; }";
  const storedPatches = [{
    selector: '[data-figma-id="2:2"]',
    props: { "flex-direction": "row" },
    source: "ai-visual-refinement",
    reason: "Responsive rearrangement",
    confidence: 0.9,
    figmaId: "2:2",
  }];

  const result = await performHybridMerge(jsHtml, jsCss, jsHtml, "", storedPatches, {});

  assert.match(result.css, /flex-direction:\s*column/);
  assert.doesNotMatch(result.css, /flex-direction:\s*row/);
  assert.ok(result.report.rejected.length >= 1);
});

test("figma-mcp patches override ia-inference on conflict, js-base overrides ia-inference", async () => {
  const jsHtml = '<section class="hero-panel" data-figma-id="3:1"></section>';
  const jsCss = ".hero-panel { background-color: #fff; padding: 24px; }";
  const iaHtml = jsHtml;
  const iaCss = "";
  const storedPatches = [
    { selector: ".hero-panel", props: { "background-color": "#eeeeee" }, source: "ia-inference", reason: "cosmetic bg", confidence: 0.5 },
    { selector: ".hero-panel", props: { "border-radius": "16px" }, source: "figma-mcp", reason: "Figma cornerRadius", confidence: 0.95 },
  ];

  const result = await performHybridMerge(jsHtml, jsCss, iaHtml, iaCss, storedPatches, {});

  assert.equal(result.success, true);
  assert.match(result.css, /background-color:\s*#fff/);
  assert.match(result.css, /border-radius:\s*16px/);
  assert.ok(result.report.conflicts.length >= 1, "Deve registrar conflito de background-color");
});

test("applies real candidate CSS differences but rejects generic decorative patches without Figma source", async () => {
  const jsHtml = '<section class="panel" data-figma-id="6:1"></section>';
  const jsCss = ".panel { color: #111; }";
  const iaCss = ".panel { color: #222; border-radius: 24px; transition: all 200ms ease; }";
  const storedPatches = [
    {
      selector: ".panel",
      props: { "box-shadow": "0 10px 20px rgba(0,0,0,0.2)" },
      source: "ai-merge-agent",
      reason: "generic decoration",
      confidence: 0.7,
    },
  ];

  const result = await performHybridMerge(jsHtml, jsCss, jsHtml, iaCss, storedPatches, {});

  assert.match(result.css, /color:\s*#222/);
  assert.doesNotMatch(result.css, /border-radius:\s*24px/);
  assert.doesNotMatch(result.css, /transition:/);
  assert.doesNotMatch(result.css, /box-shadow:/);
  assert.ok(result.report.rejected.some((patch) => patch.reason.includes("exige origem Figma")));
  assert.ok(result.report.relevantPatchCount >= 1);
});

test("accepts tracked AI visual refinements below deterministic Figma priority", async () => {
  const jsHtml = '<section class="hero-panel" data-figma-id="9:1"></section>';
  const jsCss = ".hero-panel { border-radius: 4px; box-shadow: none; }";
  const storedPatches = [
    {
      selector: ".hero-panel",
      props: {
        "border-radius": "18px",
        "box-shadow": "0 14px 30px rgba(0,0,0,0.18)",
      },
      source: "ai-visual-refinement",
      reason: "Acabamento visual especifico proposto a partir do frame.",
      confidence: 0.82,
    },
    {
      selector: '[data-figma-id="9:1"]',
      props: { "border-radius": "12px" },
      source: "figma-mcp",
      origin: "figma-raw-document",
      reason: "Raio real do Figma.",
      confidence: 0.99,
      figmaId: "9:1",
    },
  ];

  const result = await performHybridMerge(jsHtml, jsCss, jsHtml, "", storedPatches, {});

  assert.match(result.css, /border-radius:\s*12px/);
  assert.match(result.css, /box-shadow:\s*0 14px 30px/);
  assert.ok(result.report.accepted.some((patch) => patch.source === "ai-visual-refinement"));
  assert.ok(result.report.accepted.some((patch) => patch.source === "figma-mcp"));
});

test("rejects untracked AI visual refinements", async () => {
  const jsHtml = "<button>Salvar</button>";
  const jsCss = "button { background-color: #fff; }";
  const storedPatches = [{
    selector: "button",
    props: { "background-color": "#123456" },
    source: "ai-visual-refinement",
    reason: "Generic polish",
    confidence: 0.9,
  }];

  const result = await performHybridMerge(jsHtml, jsCss, jsHtml, "", storedPatches, {});

  assert.match(result.css, /background-color:\s*#fff/);
  assert.ok(result.report.rejected.some((patch) => patch.reason.includes("data-figma-id")));
});

test("accepts data-figma-id selectors and preserves figmaId in merge report", async () => {
  const jsHtml = '<section class="hero-panel" data-figma-id="7:12"></section>';
  const jsCss = ".hero-panel { padding: 24px; }";
  const storedPatches = [
    {
      selector: '[data-figma-id="7:12"]',
      props: { "border-radius": "18px" },
      source: "figma-mcp",
      reason: "Corner radius from selected Figma node",
      confidence: 0.98,
      figmaId: "7:12",
    },
  ];

  const result = await performHybridMerge(jsHtml, jsCss, jsHtml, "", storedPatches, {});

  assert.equal(result.success, true);
  assert.match(result.css, /\[data-figma-id="7:12"\]/);
  assert.match(result.css, /border-radius:\s*18px/);
  const figmaPatch = result.report.accepted.find((patch) => patch.figmaId === "7:12");
  assert.ok(figmaPatch);
});

test("accepts tracked text-shadow patches for Figma text effects", async () => {
  const jsHtml = '<h1 class="title" data-figma-id="7:13">Titulo</h1>';
  const jsCss = ".title { color: #111; }";
  const storedPatches = [{
    selector: '[data-figma-id="7:13"]',
    props: { "text-shadow": "0 4px 4px rgba(0, 0, 0, 0.25)" },
    source: "figma-mcp",
    reason: "Text shadow from Figma text node",
    confidence: 0.98,
    figmaId: "7:13",
  }];

  const result = await performHybridMerge(jsHtml, jsCss, jsHtml, "", storedPatches, {});

  assert.match(result.css, /text-shadow:\s*0 4px 4px rgba/);
  assert.ok(result.report.accepted.some((patch) => patch.props["text-shadow"]));
});

test("promotes class patches to data-figma-id selectors to preserve cascade precedence", async () => {
  const jsHtml = [
    '<div class="segmented-control__option" data-figma-id="117:15"></div>',
    '<div class="segmented-control__option" data-figma-id="117:18"></div>',
  ].join("");
  const jsCss = [
    ".segmented-control__option { background-color: #ffffff; padding: 8px; }",
    '[data-figma-id="117:15"] { background-color: #eeeeee; padding: 10px; }',
    '[data-figma-id="117:18"] { background-color: #dddddd; padding: 10px; }',
  ].join("\n");
  const iaCss = ".segmented-control__option { background-color: #123456; padding: 14px; }";

  const result = await performHybridMerge(jsHtml, jsCss, jsHtml, iaCss, [], {});

  assert.match(result.css, /\/\* AI\/MCP Applied Patches \*\//);
  assert.match(result.css, /\[data-figma-id="117:15"\]/);
  assert.match(result.css, /\[data-figma-id="117:18"\]/);
  assert.match(result.css, /background-color:\s*#123456/);
  assert.ok(result.report.accepted.every((patch) => patch.selector.startsWith("[data-figma-id=")));
  assert.ok(result.report.relevantPatchCount >= 2);
});

test("does not report decimal CSS values as orphan classes", async () => {
  const jsHtml = '<div class="panel" data-figma-id="8:1"></div>';
  const jsCss = ".panel { box-shadow: 0 2px 6px rgba(0,0,0,0.05); opacity: 0.9; line-height: 1.5; }";

  const result = await performHybridMerge(jsHtml, jsCss, jsHtml, "", [], {});

  assert.doesNotMatch(result.reportText, /\.05/);
  assert.doesNotMatch(result.reportText, /\.9/);
  assert.doesNotMatch(result.reportText, /\.5/);
});

test("identifies orphan CSS classes and preserves data-figma-id integrity", async () => {
  const jsHtml = '<div class="btn-action" data-figma-id="4:1"></div>';
  const jsCss = ".btn-action { padding: 10px; }\n.orphan-class { margin: 10px; }";
  const iaHtml = '<div class="btn-action"></div>';
  const iaCss = "";

  const result = await performHybridMerge(jsHtml, jsCss, iaHtml, iaCss, [], {});

  assert.ok(
    result.logs.some(log => log.includes("orphan-class") || log.toLowerCase().includes("órfão") || log.toLowerCase().includes("orfao")),
    "Deve detectar seletor órfão .orphan-class"
  );
  assert.ok(
    result.logs.some(log => log.includes("data-figma-id") && (log.includes("preservados") || log.includes("OK"))),
    "Deve confirmar integridade dos data-figma-id"
  );
  assert.ok(result.synchronized, "synchronized deve ser true quando data-figma-ids preservados");
});

test("no patches applied when storedPatches is empty — CSS base preserved unchanged", async () => {
  const jsHtml = '<div class="layout-grid" data-figma-id="5:1"></div>';
  const jsCss = ".layout-grid { display: grid; gap: 16px; }";

  const result = await performHybridMerge(jsHtml, jsCss, jsHtml, "", [], {});

  assert.equal(result.success, true);
  assert.match(result.css, /display:\s*grid/);
  assert.match(result.css, /gap:\s*16px/);
  assert.equal(result.report.accepted.length, 0);
  assert.equal(result.report.rejected.length, 0);
  assert.equal(result.report.relevantPatchCount, 0);
  assert.match(result.reportText, /nenhum patch visual relevante foi aplicado/);
});
