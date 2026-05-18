const assert = require("node:assert/strict");
const test = require("node:test");
const { generateCss } = require("./cssGenerator");

function textNode(id, name, characters, x = 0) {
  return {
    id,
    name,
    type: "text",
    figmaType: "TEXT",
    layout: { x },
    text: { characters, fontSize: 16 },
    children: [],
  };
}

test("generates responsive CSS for tables, cards and forms", () => {
  const css = generateCss({
    id: "1:1",
    name: "Dashboard",
    type: "frame",
    figmaType: "FRAME",
    children: [
      {
        id: "1:2",
        name: "Valores",
        type: "group",
        figmaType: "GROUP",
        children: [
          {
            id: "1:3",
            name: "Entrada",
            type: "group",
            figmaType: "GROUP",
            children: [
              textNode("1:4", "Valor", "R$ 4.700,00"),
              textNode("1:5", "Entrada", "Entrada"),
            ],
          },
        ],
      },
      {
        id: "1:6",
        name: "Tabela",
        type: "group",
        figmaType: "GROUP",
        children: [
          {
            id: "1:7",
            name: "Cabecalho",
            type: "group",
            figmaType: "GROUP",
            children: [
              textNode("1:8", "Descricao", "Descricao", 10),
              textNode("1:9", "Valor", "Valor", 200),
            ],
          },
          {
            id: "1:10",
            name: "Linha",
            type: "group",
            figmaType: "GROUP",
            children: [
              textNode("1:11", "Descricao", "Tatuagem", 10),
              textNode("1:12", "Valor", "R$1.000,00", 200),
            ],
          },
        ],
      },
      {
        id: "1:13",
        name: "Nova Movimentacao",
        type: "group",
        figmaType: "GROUP",
        children: [
          {
            id: "1:14",
            name: "Campos",
            type: "group",
            figmaType: "GROUP",
            children: [
              {
                id: "1:15",
                name: "Valor",
                type: "group",
                figmaType: "GROUP",
                children: [textNode("1:16", "Valor", "R$ 0,00")],
              },
            ],
          },
          {
            id: "1:17",
            name: "Salvar",
            type: "group",
            figmaType: "GROUP",
            children: [textNode("1:18", "Salvar", "Salvar")],
          },
        ],
      },
    ],
  });

  assert.match(css, /@media \(max-width: 1024px\)/);
  assert.match(css, /@media \(max-width: 768px\)/);
  assert.match(css, /@media \(max-width: 480px\)/);
  assert.match(css, /\.dashboard \{\n[\s\S]*display: flex;/);
  assert.doesNotMatch(css, /\.screen/);
  assert.match(css, /\.table-wrapper \{\n[\s\S]*overflow-x: auto;/);
  assert.match(css, /\.table \{\n[\s\S]*min-width: 640px;/);
  assert.match(css, /\.valores \{\n[\s\S]*grid-template-columns: 1fr;/);
  assert.match(css, /\.campos \{\n[\s\S]*grid-template-columns: 1fr;/);
  assert.match(css, /\.form-control \{\n[\s\S]*width: 100%;/);
  assert.doesNotMatch(css, /\.sidebar \{\n[\s\S]*border-bottom:/);
  assert.doesNotMatch(css, /background-color: var\(--color-primary/);
});

test("generates responsive sidebar rules only when sidebar exists", () => {
  const css = generateCss({
    id: "1:1",
    name: "Dashboard",
    type: "frame",
    figmaType: "FRAME",
    children: [
      {
        id: "1:2",
        name: "Menu",
        type: "group",
        figmaType: "GROUP",
        layout: { width: 80 },
        children: [],
      },
    ],
  });

  assert.match(css, /\.dashboard:has\(> \.sidebar\) \{\n[\s\S]*flex-direction: row;/);
  assert.match(css, /\.dashboard > :not\(\.sidebar\) \{\n[\s\S]*min-width: 0;/);
  assert.match(css, /\.sidebar \{\n[\s\S]*width: 96px;/);
  assert.match(css, /@media \(max-width: 768px\)/);
  assert.match(css, /\.dashboard:has\(> \.sidebar\) \{\n[\s\S]*flex-direction: column;/);
  assert.match(css, /\.sidebar \{\n[\s\S]*width: 100%;/);
  assert.match(css, /\.sidebar-nav \{\n[\s\S]*overflow-x: auto;/);
  assert.doesNotMatch(css, /\.screen/);
});

test("uses Figma visual data instead of generic component styling", () => {
  const css = generateCss({
    id: "1:1",
    name: "Dashboard",
    type: "frame",
    figmaType: "FRAME",
    layout: { x: 0, y: 0, width: 1440, height: 900 },
    style: {
      fills: [{ type: "SOLID", color: { r: 255, g: 255, b: 255, a: 1 } }],
      strokes: [],
    },
    children: [
      {
        id: "1:2",
        name: "Title",
        type: "text",
        figmaType: "TEXT",
        layout: { x: 80, y: 120, width: 280, height: 48 },
        text: {
          characters: "Dashboard",
          fontSize: 32,
          fontWeight: 700,
          lineHeightPx: 40,
          fills: [{ type: "SOLID", color: { r: 18, g: 24, b: 38, a: 1 } }],
        },
        children: [],
      },
      {
        id: "1:3",
        name: "Card",
        type: "group",
        figmaType: "GROUP",
        layout: { x: 64, y: 32, width: 320, height: 120 },
        style: {
          fills: [{ type: "SOLID", color: { r: 245, g: 247, b: 250, a: 1 } }],
          strokes: [{ type: "SOLID", color: { r: 210, g: 216, b: 224, a: 1 } }],
          strokeWeight: 1,
          borderRadius: 12,
          effects: [
            {
              type: "DROP_SHADOW",
              color: { r: 0, g: 0, b: 0, a: 0.18 },
              offset: { x: 0, y: 8 },
              radius: 24,
              spread: 0,
            },
          ],
        },
        children: [],
      },
    ],
  });

  assert.match(css, /\.dashboard \{\n[\s\S]*width: 1440px;/);
  assert.match(css, /\.dashboard \{\n[\s\S]*min-height: 900px;/);
  assert.match(css, /\.title \{\n[\s\S]*font-size: clamp\(19px, 1\.667vw, 32px\);/);
  assert.match(css, /\.title \{\n[\s\S]*font-weight: 700;/);
  assert.match(css, /\.title \{\n[\s\S]*color: #121826;/);
  assert.match(css, /\.card \{\n[\s\S]*width: 320px;/);
  assert.match(css, /\.card \{\n[\s\S]*border-radius: 12px;/);
  assert.match(css, /\.card \{\n[\s\S]*box-shadow: 0px 8px 24px 0px rgba\(0, 0, 0, 0\.18\);/);
  assert.doesNotMatch(css, /margin: 0 auto;/);
  assert.doesNotMatch(css, /max-width: 1200px;/);
});

test("generates visual-first CSS with absolute sizes and no media queries", () => {
  const css = generateCss({
    id: "1:1",
    name: "Dashboard",
    type: "frame",
    figmaType: "FRAME",
    layout: { x: 0, y: 0, width: 1440, height: 900 },
    children: [
      {
        id: "1:2",
        name: "Title",
        type: "text",
        figmaType: "TEXT",
        layout: { x: 80, y: 120, width: 280, height: 48 },
        text: {
          characters: "Dashboard",
          fontSize: 32,
          fontWeight: 700,
          lineHeightPx: 40,
        },
        children: [],
      },
    ],
  }, "", { mode: "visual-first" });

  assert.match(css, /\.title \{\n[\s\S]*font-size: 32px;/);
  assert.match(css, /\/\* Modo Visual-First ativo: responsividade desativada \*\//);
  assert.doesNotMatch(css, /clamp/);
  assert.doesNotMatch(css, /@media/);
});

test("preserves table and field styles in visual-first mode", () => {
  const css = generateCss({
    id: "1:1",
    name: "Dashboard",
    type: "frame",
    figmaType: "FRAME",
    layout: { x: 0, y: 0, width: 1440, height: 900 },
    children: [
      {
        id: "1:2",
        name: "Valor",
        type: "group",
        figmaType: "GROUP",
        layout: { x: 80, y: 120, width: 280, height: 48 },
        style: {
          borderRadius: 8,
          fills: [{ type: "SOLID", color: { r: 255, g: 0, b: 0, a: 1 } }]
        },
        children: []
      },
      {
        id: "1:3",
        name: "Celula",
        semanticTag: "td",
        layout: { x: 10, y: 20, width: 150, height: 35 },
        style: {
          borderRadius: 4
        },
        children: []
      }
    ]
  }, "", { mode: "visual-first" });

  assert.match(css, /\[data-figma-id="1:2"\] \{\n[\s\S]*border-radius: 8px;/);
  assert.match(css, /\[data-figma-id="1:2-control"\] \{\n[\s\S]*border-radius: 8px;/);
  assert.match(css, /\[data-figma-id="1:3"\] \{\n[\s\S]*width: 150px;/);
  assert.match(css, /\[data-figma-id="1:3"\] \{\n[\s\S]*height: 35px;/);
});
