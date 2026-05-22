const test = require("node:test");
const assert = require("node:assert/strict");
const { improveCode, generateMergePatches, extractSelectorsFromHtml, GENERIC_BLOCKED_SELECTORS } = require("./iaEngine");

test("deterministic IA refiner emits patches only for selectors present in HTML", async () => {
  const result = await improveCode(
    "Improve this",
    '<div class="card-panel">Text</div>',
    ".card-panel { width: 100px; }",
    { available: false },
    "visual-first",
    null
  );

  assert.equal(result.source, "deterministic-ia-visual-enhancer");
  // New model: returns patches array, not modified CSS
  assert.ok(Array.isArray(result.patches), "result.patches deve ser um array");
  // CSS base deve estar preservado (sem concatenação)
  assert.equal(result.css, ".card-panel { width: 100px; }");
  // Should have a patch for card-panel (matches /card|container|panel/ pattern)
  const cardPatch = result.patches.find(p => p.selector === ".card-panel");
  assert.ok(cardPatch, "Deve emitir patch para .card-panel (selector presente no HTML)");
  assert.ok(cardPatch.props["border-radius"], "Patch deve conter border-radius");
  assert.ok(cardPatch.props["box-shadow"], "Patch deve conter box-shadow");
  assert.equal(cardPatch.source, "ia-inference");
});

test("deterministic IA refiner emits button patches only for specific class, not generic", async () => {
  const result = await improveCode(
    "Improve this",
    '<button class="btn-primary">Click</button>',
    ".btn-primary { background: teal; }",
    { available: false },
    "visual-first",
    null
  );

  // CSS base deve estar intacto — sem button:hover genérico concatenado
  assert.equal(result.css, ".btn-primary { background: teal; }");
  assert.ok(Array.isArray(result.patches));
  // Generic button selector must NOT be in patches
  const genericBtnPatch = result.patches.find(p => p.selector === "button" || p.selector === ".button");
  assert.equal(genericBtnPatch, undefined, "Seletor genérico 'button' não deve gerar patch");
  // btn-primary matches /btn-|button-|submit-|action-/ so should get a patch
  const specificPatch = result.patches.find(p => p.selector === ".btn-primary");
  assert.ok(specificPatch, "Deve emitir patch para .btn-primary (classe específica)");
  assert.ok(specificPatch.props["border-radius"], "Patch deve conter border-radius");
  assert.ok(specificPatch.props["transition"], "Patch deve conter transition");
});

test("extractSelectorsFromHtml extracts classes and tags correctly", () => {
  const html = '<div class="card footer-nav" data-figma-id="1:2"><span class="label">X</span></div>';
  const selectors = extractSelectorsFromHtml(html);
  assert.ok(selectors.has(".card"));
  assert.ok(selectors.has(".footer-nav"));
  assert.ok(selectors.has(".label"));
  assert.ok(selectors.has("div"));
  assert.ok(selectors.has("span"));
});

test("GENERIC_BLOCKED_SELECTORS blocks common generic tags and classes", () => {
  assert.ok(GENERIC_BLOCKED_SELECTORS.has("button"));
  assert.ok(GENERIC_BLOCKED_SELECTORS.has(".button"));
  assert.ok(GENERIC_BLOCKED_SELECTORS.has("th"));
  assert.ok(GENERIC_BLOCKED_SELECTORS.has("td"));
  assert.ok(GENERIC_BLOCKED_SELECTORS.has("input"));
  assert.ok(GENERIC_BLOCKED_SELECTORS.has(".form-field"));
  assert.ok(GENERIC_BLOCKED_SELECTORS.has(".summary-card"));
});

test("real IA improvements are stored as tracked visual refinements", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                html: '<main data-figma-id="1:1"></main>',
                patches: [{
                  selector: '[data-figma-id="1:1"]',
                  props: { "box-shadow": "0 8px 20px rgba(0,0,0,0.15)" },
                  source: "figma-mcp",
                  reason: "Figma-guided finish",
                  confidence: 0.8,
                }],
              }),
            }],
          },
        }],
      };
    },
  });

  try {
    const result = await improveCode(
      "Aproxime do Figma",
      '<main data-figma-id="1:1"></main>',
      "main { display: block; }",
      { available: true },
      "visual-first",
      "fake-key"
    );

    assert.equal(result.source, "gemini-api");
    assert.equal(result.patches[0].source, "ai-visual-refinement");
    assert.equal(result.patches[0].origin, "ai-figma-guided");
    assert.match(result.patches[0].reason, /Figma deterministicos continuam prioritarios/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("generateMergePatches extracts safe visual patches from Figma rawDocument", async () => {
  const html = '<section class="card" data-figma-id="117:18">Entrada</section>';
  const mcpContext = {
    available: true,
    properties: {
      rawDocument: {
        id: "117:18",
        name: "Entrada",
        type: "FRAME",
        absoluteBoundingBox: { x: 10, y: 20, width: 120, height: 48 },
        cornerRadius: 10,
        fills: [{ type: "SOLID", color: { r: 0.1, g: 0.2, b: 0.3, a: 1 } }],
        strokes: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }],
        strokeWeight: 1,
      },
    },
  };

  const patches = await generateMergePatches({
    jsHtml: html,
    jsCss: ".card { width: 100px; }",
    iaHtml: html,
    iaCss: "",
    mcpContext,
    apiKey: null,
  });

  const getPatchProp = (prop) =>
    patches.find((patch) => patch.selector === '[data-figma-id="117:18"]' && patch.props[prop]);

  assert.equal(getPatchProp("border-radius").props["border-radius"], "10px");
  assert.match(getPatchProp("background-color").props["background-color"], /rgb/);
  assert.match(getPatchProp("border").props.border, /solid/);
  assert.equal(getPatchProp("width"), undefined);
  assert.equal(getPatchProp("height"), undefined);
  assert.equal(getPatchProp("position"), undefined);
});

test("generateMergePatches does not overlay Figma absolute geometry onto semantic children", async () => {
  const html = [
    '<section class="screen" data-figma-id="1:1">',
    '<button class="button" data-figma-id="1:2">OK</button>',
    "</section>",
  ].join("");
  const mcpContext = {
    available: true,
    properties: {
      rawDocument: {
        id: "1:1",
        name: "Screen",
        type: "FRAME",
        absoluteBoundingBox: { x: 100, y: 200, width: 390, height: 844 },
        children: [
          {
            id: "1:2",
            name: "Button",
            type: "FRAME",
            absoluteBoundingBox: { x: 124, y: 260, width: 96, height: 40 },
          },
        ],
      },
    },
  };

  const patches = await generateMergePatches({
    jsHtml: html,
    jsCss: ".screen { display: block; }",
    iaHtml: html,
    iaCss: "",
    mcpContext,
    apiKey: null,
  });

  const childPatches = patches.filter((patch) => patch.selector === '[data-figma-id="1:2"]');
  assert.equal(childPatches.some((patch) => patch.props.position), false);
  assert.equal(childPatches.some((patch) => patch.props.left), false);
  assert.equal(childPatches.some((patch) => patch.props.top), false);
});

test("generateMergePatches keeps raw Figma text effects on glyphs", async () => {
  const html = '<h1 data-figma-id="2:1">Titulo</h1>';
  const patches = await generateMergePatches({
    jsHtml: html,
    jsCss: "",
    iaHtml: html,
    iaCss: "",
    apiKey: null,
    mcpContext: {
      available: true,
      properties: {
        rawDocument: {
          id: "2:1",
          name: "Titulo",
          type: "TEXT",
          absoluteBoundingBox: { x: 0, y: 0, width: 160, height: 48 },
          strokes: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 } }],
          strokeWeight: 1,
          effects: [{
            type: "DROP_SHADOW",
            color: { r: 0, g: 0, b: 0, a: 0.25 },
            offset: { x: 0, y: 4 },
            radius: 4,
            spread: 2,
          }],
        },
      },
    },
  });

  const titlePatch = patches.find((patch) => patch.selector === '[data-figma-id="2:1"]');
  assert.match(titlePatch.props["text-shadow"], /^0px 4px 4px rgba/);
  assert.equal(titlePatch.props["box-shadow"], undefined);
  assert.equal(titlePatch.props.border, undefined);
  assert.doesNotMatch(titlePatch.props["text-shadow"], /4px 2px rgba/);
});

test("generateMergePatches prioritizes raw Figma patches over AI-claimed figma patches", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return {
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                patches: [{
                  selector: '[data-figma-id="1:2"]',
                  props: { "background-color": "rgb(9, 9, 9)" },
                  source: "figma-mcp",
                  reason: "AI guessed Figma color",
                  confidence: 1,
                }],
              }),
            }],
          },
        }],
      };
    },
  });

  try {
    const html = '<section data-figma-id="1:2"></section>';
    const patches = await generateMergePatches({
      jsHtml: html,
      jsCss: "",
      iaHtml: html,
      iaCss: "",
      apiKey: "fake-key",
      mcpContext: {
        available: true,
        properties: {
          rawDocument: {
            id: "1:2",
            name: "Real Node",
            type: "FRAME",
            absoluteBoundingBox: { x: 0, y: 0, width: 120, height: 40 },
            fills: [{ type: "SOLID", color: { r: 0.1, g: 0.2, b: 0.3, a: 1 } }],
          },
        },
      },
    });

    const backgroundPatch = patches.find((patch) => patch.selector === '[data-figma-id="1:2"]' && patch.props["background-color"]);
    assert.match(backgroundPatch.props["background-color"], /rgb\(26, 51, 77\)/);
    assert.equal(backgroundPatch.source, "figma-mcp");
    assert.equal(backgroundPatch.origin, "figma-raw-document");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("generateMergePatches keeps normalized overlays visual without semantic geometry", async () => {
  const html = [
    '<section data-figma-id="10:1">',
    '<h1 data-figma-id="10:2">Titulo</h1>',
    "</section>",
  ].join("");
  const patches = await generateMergePatches({
    jsHtml: html,
    jsCss: "",
    iaHtml: html,
    iaCss: "",
    apiKey: null,
    mcpContext: {
      available: true,
      normalizedStructure: {
        id: "10:1",
        name: "Tela",
        type: "frame",
        layout: { x: 100, y: 200, width: 390, height: 844 },
        style: { fill: { r: 240, g: 241, b: 242, a: 1 } },
        children: [{
          id: "10:2",
          name: "Titulo",
          type: "text",
          layout: { x: 124, y: 250, width: 180, height: 48 },
          style: {},
          text: {
            characters: "Titulo",
            fontFamily: "Inter",
            fontSize: 32,
            fontWeight: 700,
            lineHeightPx: 38,
            fills: [{ type: "SOLID", color: { r: 30, g: 40, b: 50, a: 1 } }],
          },
        }],
      },
    },
  });

  const getPatch = (selector, prop) => patches.find((patch) => patch.selector === selector && patch.props[prop]);
  assert.match(getPatch('[data-figma-id="10:1"]', "background-color").props["background-color"], /rgb/);
  assert.equal(getPatch('[data-figma-id="10:2"]', "font-weight").props["font-weight"], "700");
  assert.equal(getPatch('[data-figma-id="10:2"]', "color").origin, "figma-normalized-structure");
  assert.equal(getPatch('[data-figma-id="10:1"]', "width"), undefined);
  assert.equal(getPatch('[data-figma-id="10:2"]', "position"), undefined);
  assert.equal(getPatch('[data-figma-id="10:2"]', "font-size"), undefined);
});
