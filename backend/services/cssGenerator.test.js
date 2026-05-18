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
  assert.match(css, /\.dashboard \{\n[\s\S]*min-height: 100vh;/);
  assert.doesNotMatch(css, /\.screen/);
  assert.match(css, /\.table-wrapper \{\n[\s\S]*overflow-x: auto;/);
  assert.match(css, /\.table \{\n[\s\S]*min-width: 640px;/);
  assert.match(css, /\.valores \{\n[\s\S]*grid-template-columns: 1fr;/);
  assert.match(css, /\.campos \{\n[\s\S]*grid-template-columns: 1fr;/);
  assert.match(css, /\.form-control \{\n[\s\S]*width: 100%;/);
  assert.match(css, /\.summary-card \{\n[\s\S]*padding: 16px;/);
  assert.doesNotMatch(css, /\.sidebar \{\n[\s\S]*border-bottom:/);
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
