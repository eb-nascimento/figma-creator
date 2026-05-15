const assert = require("node:assert/strict");
const test = require("node:test");
const {
  createClassName,
  escapeHtml,
  generateHtml,
  renderNode,
} = require("./htmlGenerator");

test("escapes HTML special characters", () => {
  assert.equal(
    escapeHtml("<script>alert('x')</script>"),
    "&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;"
  );
});

test("creates stable class names from node type, name, and id", () => {
  assert.equal(
    createClassName({
      id: "1:2",
      name: "Botao Principal",
      type: "component",
    }),
    "component-botao-principal-1-2"
  );
});

test("renders text nodes with semantic heading heuristics", () => {
  const html = renderNode({
    id: "1:2",
    name: "Title",
    type: "text",
    text: {
      characters: "Dashboard",
      fontSize: 32,
    },
    children: [],
  });

  assert.equal(html, '<h1 class="text-title-1-2">Dashboard</h1>');
});

test("generates full HTML preserving normalized hierarchy", () => {
  const html = generateHtml({
    id: "1:1",
    name: "Home",
    type: "frame",
    text: null,
    children: [
      {
        id: "1:2",
        name: "Hero",
        type: "group",
        text: null,
        children: [
          {
            id: "1:3",
            name: "Headline",
            type: "text",
            text: {
              characters: "Ola <mundo>",
              fontSize: 24,
            },
            children: [],
          },
          {
            id: "1:4",
            name: "Cover",
            type: "image",
            text: null,
            children: [],
          },
        ],
      },
    ],
  });

  assert.match(html, /<!doctype html>/);
  assert.match(html, /<title>Home<\/title>/);
  assert.match(html, /<section class="frame-home-1-1">/);
  assert.match(html, /<div class="group-hero-1-2">/);
  assert.match(html, /<h2 class="text-headline-1-3">Ola &lt;mundo&gt;<\/h2>/);
  assert.match(html, /<img class="image-cover-1-4" src="" alt="Cover">/);
});

test("rejects missing structure", () => {
  assert.throws(() => generateHtml(null), /Estrutura nao informada/);
});
