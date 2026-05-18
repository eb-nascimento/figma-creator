const assert = require("node:assert/strict");
const test = require("node:test");
const { normalizeVisualTree } = require("./figmaVisualTree");

function node(id, name, type, layout, extra = {}) {
  return {
    id,
    name,
    type,
    figmaType: type === "shape" ? "RECTANGLE" : "FRAME",
    layout,
    style: extra.style || { fills: [], strokes: [], effects: [] },
    text: null,
    children: extra.children || [],
  };
}

test("sorts children by visual position instead of raw layer order", () => {
  const tree = normalizeVisualTree(node("1", "Screen", "frame", {
    x: 0,
    y: 0,
    width: 800,
    height: 600,
  }, {
    children: [
      node("3", "Bottom", "group", { x: 40, y: 260, width: 100, height: 40 }),
      node("2", "Top", "group", { x: 40, y: 40, width: 100, height: 40 }),
      node("4", "Right", "group", { x: 240, y: 40, width: 100, height: 40 }),
    ],
  }));

  assert.deepEqual(tree.children.map((child) => child.id), ["2", "4", "3"]);
  assert.deepEqual(tree.children.map((child) => child.visual.order), [1, 2, 3]);
});

test("detects visual regions from geometry", () => {
  const tree = normalizeVisualTree(node("1", "Screen", "frame", {
    x: 0,
    y: 0,
    width: 1000,
    height: 800,
  }, {
    children: [
      node("top", "Header", "group", { x: 100, y: 20, width: 800, height: 80 }),
      node("left", "Sidebar", "group", { x: 20, y: 220, width: 180, height: 400 }),
      node("center", "Content", "group", { x: 320, y: 220, width: 360, height: 400 }),
      node("right", "Inspector", "group", { x: 820, y: 220, width: 160, height: 400 }),
      node("bottom", "Footer", "group", { x: 100, y: 700, width: 800, height: 70 }),
    ],
  }));

  const regionsById = Object.fromEntries(tree.children.map((child) => [child.id, child.visual.region]));
  assert.equal(regionsById.top, "top");
  assert.equal(regionsById.left, "left");
  assert.equal(regionsById.center, "center");
  assert.equal(regionsById.right, "right");
  assert.equal(regionsById.bottom, "bottom");
});

test("merges background rectangles into parent style", () => {
  const tree = normalizeVisualTree(node("1", "Card", "group", {
    x: 0,
    y: 0,
    width: 320,
    height: 180,
  }, {
    children: [
      node("bg", "Background", "shape", { x: 0, y: 0, width: 320, height: 180 }, {
        style: {
          fill: { r: 245, g: 247, b: 250, a: 1 },
          fills: [{ type: "SOLID", color: { r: 245, g: 247, b: 250, a: 1 } }],
          strokes: [],
          borderRadius: 12,
          effects: [],
        },
      }),
      node("content", "Content", "group", { x: 24, y: 24, width: 120, height: 40 }),
    ],
  }));

  assert.deepEqual(tree.children.map((child) => child.id), ["content"]);
  assert.equal(tree.visual.backgroundFrom, "bg");
  assert.deepEqual(tree.style.fill, { r: 245, g: 247, b: 250, a: 1 });
  assert.equal(tree.style.borderRadius, 12);
});

test("infers horizontal, vertical and grid layout kinds", () => {
  const horizontal = normalizeVisualTree(node("h", "Horizontal", "group", {
    x: 0,
    y: 0,
    width: 500,
    height: 100,
  }, {
    children: [
      node("h1", "A", "group", { x: 0, y: 10, width: 80, height: 40 }),
      node("h2", "B", "group", { x: 140, y: 12, width: 80, height: 40 }),
    ],
  }));
  const vertical = normalizeVisualTree(node("v", "Vertical", "group", {
    x: 0,
    y: 0,
    width: 100,
    height: 500,
  }, {
    children: [
      node("v1", "A", "group", { x: 10, y: 0, width: 70, height: 40 }),
      node("v2", "B", "group", { x: 12, y: 140, width: 70, height: 40 }),
    ],
  }));
  const grid = normalizeVisualTree(node("g", "Grid", "group", {
    x: 0,
    y: 0,
    width: 500,
    height: 500,
  }, {
    children: [
      node("g1", "A", "group", { x: 0, y: 0, width: 70, height: 40 }),
      node("g2", "B", "group", { x: 140, y: 140, width: 70, height: 40 }),
    ],
  }));

  assert.equal(horizontal.visual.layoutKind, "horizontal");
  assert.equal(vertical.visual.layoutKind, "vertical");
  assert.equal(grid.visual.layoutKind, "grid");
});
