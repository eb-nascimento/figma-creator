const assert = require("node:assert/strict");
const test = require("node:test");
const { refineHtml } = require("./htmlRefiner");

test("refines generic Figma class names into semantic HTML", () => {
  const html = refineHtml({
    id: "117:2",
    name: "Nova movimentacao entrada",
    type: "frame",
    figmaType: "FRAME",
    text: null,
    children: [
      {
        id: "117:3",
        name: "Menu",
        type: "group",
        figmaType: "GROUP",
        text: null,
        children: [
          {
            id: "117:4",
            name: "Rectangle 9",
            type: "shape",
            figmaType: "RECTANGLE",
            text: null,
            children: [],
          },
          {
            id: "117:5",
            name: "Group 3",
            type: "group",
            figmaType: "GROUP",
            text: null,
            children: [
              {
                id: "117:6",
                name: "CirclesFour",
                type: "frame",
                figmaType: "FRAME",
                text: null,
                children: [
                  {
                    id: "117:7",
                    name: "Vector",
                    type: "shape",
                    figmaType: "VECTOR",
                    text: null,
                    children: [],
                  },
                ],
              },
              {
                id: "117:8",
                name: "SlidersHorizontal",
                type: "frame",
                figmaType: "FRAME",
                text: null,
                children: [
                  {
                    id: "117:9",
                    name: "Vector",
                    type: "shape",
                    figmaType: "VECTOR",
                    text: null,
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            id: "117:10",
            name: "GearSix",
            type: "frame",
            figmaType: "FRAME",
            text: null,
            children: [
              {
                id: "117:11",
                name: "Vector",
                type: "shape",
                figmaType: "VECTOR",
                text: null,
                children: [],
              },
            ],
          },
        ],
      },
    ],
  });

  assert.match(html.html, /<main class="nova-movimentacao-entrada">/);
  assert.match(html.html, /<nav class="menu">/);
  assert.doesNotMatch(html.html, /<div class="shape"><\/div>/);
  assert.match(html.html, /<div class="container">/);
  assert.match(html.html, /<button class="button button-overview"/);
  assert.match(html.html, /<button class="button button-filters" type="button" aria-label="Filtros">/);
  assert.match(html.html, /<button class="button button-settings" type="button" aria-label="Configuracoes">/);
  assert.match(html.html, /class="icon icon-graphic"/);
  assert.doesNotMatch(html.html, /button-overview-117/);
  assert.doesNotMatch(html.html, /icon-graphic-117/);
  assert.doesNotMatch(html.html, /group-menu-117-3/);
  assert.doesNotMatch(html.html, /shape-rectangle-9-117-4/);
  assert.doesNotMatch(html.html, /<button[^>]*>\s*<button/s);
});

test("keeps repeated semantic classes shared instead of adding Figma ID suffixes", () => {
  const html = refineHtml({
    id: "1:1",
    name: "Screen",
    type: "frame",
    figmaType: "FRAME",
    text: null,
    children: [
      {
        id: "1:2",
        name: "Card",
        type: "group",
        figmaType: "GROUP",
        text: null,
        children: [],
      },
      {
        id: "1:3",
        name: "Card",
        type: "group",
        figmaType: "GROUP",
        text: null,
        children: [],
      },
    ],
  });

  assert.equal((html.html.match(/class="card"/g) || []).length, 2);
  assert.doesNotMatch(html.html, /card-1-2/);
  assert.doesNotMatch(html.html, /card-1-3/);
});

test("does not turn large content containers into buttons because of nested icons", () => {
  const html = refineHtml({
    id: "117:2",
    name: "Nova Movimentacao Entrada",
    type: "frame",
    figmaType: "FRAME",
    text: null,
    children: [
      {
        id: "117:93",
        name: "Graphic Wrapper",
        type: "group",
        figmaType: "GROUP",
        text: null,
        children: [
          {
            id: "117:94",
            name: "Fundo",
            type: "shape",
            figmaType: "RECTANGLE",
            text: null,
            children: [],
          },
          {
            id: "117:202",
            name: "Tabela",
            type: "group",
            figmaType: "GROUP",
            text: null,
            children: [
              {
                id: "117:194",
                name: "Mostrar Mais Wrapper",
                type: "group",
                figmaType: "GROUP",
                text: null,
                children: [
                  {
                    id: "117:195",
                    name: "Rectangle",
                    type: "shape",
                    figmaType: "RECTANGLE",
                    text: null,
                    children: [],
                  },
                  {
                    id: "117:199",
                    name: "ChevronDown",
                    type: "frame",
                    figmaType: "FRAME",
                    text: null,
                    children: [
                      {
                        id: "117:200",
                        name: "Vector",
                        type: "shape",
                        figmaType: "VECTOR",
                        text: null,
                        children: [],
                      },
                    ],
                  },
                  {
                    id: "117:201",
                    name: "Mostrar Mais",
                    type: "text",
                    figmaType: "TEXT",
                    text: {
                      characters: "Mostrar Mais",
                      fontSize: 20,
                    },
                    children: [],
                  },
                ],
              },
              {
                id: "117:116",
                name: "Tabela",
                type: "group",
                figmaType: "GROUP",
                text: null,
                children: [
                  {
                    id: "117:165",
                    name: "Linha",
                    type: "group",
                    figmaType: "GROUP",
                    text: null,
                    children: [],
                  },
                ],
              },
            ],
          },
          {
            id: "117:75",
            name: "Valores",
            type: "group",
            figmaType: "GROUP",
            text: null,
            children: [],
          },
          {
            id: "117:96",
            name: "Movimentacoes",
            type: "text",
            figmaType: "TEXT",
            text: {
              characters: "Movimentacoes",
              fontSize: 32,
            },
            children: [],
          },
        ],
      },
    ],
  });

  assert.match(html.html, /<div class="graphic-wrapper">/);
  assert.doesNotMatch(html.html, /<button class="button button-graphic/);
  assert.doesNotMatch(html.html, /<button[^>]*>\s*<button/s);
  assert.match(html.html, /<button class="button button-mostrar-mais" type="button">/);
  assert.match(html.html, /<span class="button-label">Mostrar Mais<\/span>/);
  assert.doesNotMatch(html.html, /<h2 class="subtitle">Mostrar Mais<\/h2>/);
  assert.doesNotMatch(html.html, /<tr>\s*<\/tr>/);
});

test("renders detected table groups as semantic table markup", () => {
  const html = refineHtml({
    id: "1:1",
    name: "Screen",
    type: "frame",
    figmaType: "FRAME",
    text: null,
    children: [
      {
        id: "1:2",
        name: "Tabela",
        type: "group",
        figmaType: "GROUP",
        text: null,
        children: [
          {
            id: "1:3",
            name: "Linha",
            type: "group",
            figmaType: "GROUP",
            text: null,
            children: [
              {
                id: "1:4",
                name: "Descricao",
                type: "text",
                figmaType: "TEXT",
                layout: { x: 10 },
                text: { characters: "Tatuagem", fontSize: 16 },
                children: [],
              },
              {
                id: "1:5",
                name: "Valor",
                type: "text",
                figmaType: "TEXT",
                layout: { x: 200 },
                text: { characters: "R$1.000,00", fontSize: 16 },
                children: [],
              },
            ],
          },
          {
            id: "1:6",
            name: "Cabecalho",
            type: "group",
            figmaType: "GROUP",
            text: null,
            children: [
              {
                id: "1:7",
                name: "Descricao",
                type: "text",
                figmaType: "TEXT",
                layout: { x: 10 },
                text: { characters: "Descricao", fontSize: 16 },
                children: [],
              },
              {
                id: "1:8",
                name: "Valor",
                type: "text",
                figmaType: "TEXT",
                layout: { x: 200 },
                text: { characters: "Valor", fontSize: 16 },
                children: [],
              },
            ],
          },
        ],
      },
    ],
  });

  assert.match(html.html, /<table class="table">/);
  assert.match(html.html, /<thead>/);
  assert.match(html.html, /<tbody>/);
  assert.match(html.html, /<th class="col-descricao" scope="col">Descricao<\/th>/);
  assert.match(html.html, /<th class="col-valor" scope="col">Valor<\/th>/);
  assert.match(html.html, /<td class="col-descricao">Tatuagem<\/td>/);
  assert.match(html.html, /<td class="col-valor">R\$1\.000,00<\/td>/);
  assert.doesNotMatch(html.html, /class="tatuagem"/);
  assert.doesNotMatch(html.html, /class="r"/);
});

test("does not classify large screen sections as summary cards from nested money values", () => {
  const html = refineHtml({
    id: "1:1",
    name: "Screen",
    type: "frame",
    figmaType: "FRAME",
    text: null,
    children: [
      {
        id: "1:2",
        name: "Nova Movimentacao Entrada",
        type: "group",
        figmaType: "GROUP",
        text: null,
        children: [
          {
            id: "1:3",
            name: "Tabela",
            type: "group",
            figmaType: "GROUP",
            text: null,
            children: [
              {
                id: "1:4",
                name: "Linha",
                type: "group",
                figmaType: "GROUP",
                text: null,
                children: [
                  {
                    id: "1:5",
                    name: "Descricao",
                    type: "text",
                    figmaType: "TEXT",
                    text: { characters: "Tatuagem", fontSize: 16 },
                    children: [],
                  },
                  {
                    id: "1:6",
                    name: "Valor",
                    type: "text",
                    figmaType: "TEXT",
                    text: { characters: "R$1.000,00", fontSize: 16 },
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  assert.match(html.html, /<div class="nova-movimentacao-entrada">/);
  assert.doesNotMatch(html.html, /<article class="summary-card summary-card--entrada">/);
});

test("uses role-based text classes instead of content-derived classes", () => {
  const html = refineHtml({
    id: "1:1",
    name: "Screen",
    type: "frame",
    figmaType: "FRAME",
    text: null,
    children: [
      {
        id: "1:2",
        name: "Nubank",
        type: "text",
        figmaType: "TEXT",
        text: { characters: "Nubank", fontSize: 16 },
        children: [],
      },
      {
        id: "1:3",
        name: "Movimentacoes",
        type: "text",
        figmaType: "TEXT",
        text: { characters: "Movimentacoes", fontSize: 32 },
        children: [],
      },
    ],
  });

  assert.match(html.html, /<span class="text">Nubank<\/span>/);
  assert.match(html.html, /<h2 class="subtitle">Movimentacoes<\/h2>/);
  assert.doesNotMatch(html.html, /class="nubank"/);
  assert.doesNotMatch(html.html, /class="movimentacoes"/);
});

test("renders simple form containers and submit actions semantically", () => {
  const html = refineHtml({
    id: "1:1",
    name: "Screen",
    type: "frame",
    figmaType: "FRAME",
    text: null,
    children: [
      {
        id: "1:2",
        name: "Nova Movimentacao",
        type: "group",
        figmaType: "GROUP",
        text: null,
        children: [
          {
            id: "1:3",
            name: "Salvar",
            type: "group",
            figmaType: "GROUP",
            text: null,
            children: [
              {
                id: "1:4",
                name: "Salvar",
                type: "text",
                figmaType: "TEXT",
                text: { characters: "Salvar", fontSize: 18 },
                children: [],
              },
            ],
          },
          {
            id: "1:5",
            name: "Campos",
            type: "group",
            figmaType: "GROUP",
            text: null,
            children: [
              {
                id: "1:6",
                name: "Valor",
                type: "group",
                figmaType: "GROUP",
                text: null,
                children: [
                  {
                    id: "1:7",
                    name: "Valor",
                    type: "text",
                    figmaType: "TEXT",
                    text: { characters: "R$ 0,00", fontSize: 20 },
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });

  assert.match(html.html, /<form class="movement-form">/);
  assert.match(html.html, /<button class="button button-salvar" type="submit">/);
  assert.match(html.html, /<span class="button-label">Salvar<\/span>/);
});

test("rejects missing structure", () => {
  assert.throws(() => refineHtml(null), /Estrutura nao informada/);
});
