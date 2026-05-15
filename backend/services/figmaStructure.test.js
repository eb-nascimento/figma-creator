const assert = require("node:assert/strict");
const test = require("node:test");
const { normalizeFigmaNode, summarizeStructure } = require("./figmaStructure");

test("normalizes a Figma frame subtree into a compact layout structure", () => {
  const structure = normalizeFigmaNode({
    id: "1:1",
    name: "Home",
    type: "FRAME",
    absoluteBoundingBox: {
      x: 10,
      y: 20,
      width: 1440,
      height: 900,
    },
    fills: [
      {
        type: "SOLID",
        color: { r: 1, g: 1, b: 1, a: 1 },
      },
    ],
    children: [
      {
        id: "1:2",
        name: "Title",
        type: "TEXT",
        characters: "Dashboard",
        absoluteBoundingBox: {
          x: 40,
          y: 48,
          width: 220,
          height: 36,
        },
        style: {
          fontFamily: "Inter",
          fontSize: 24,
          fontWeight: 700,
          lineHeightPx: 32,
          letterSpacing: 0,
        },
      },
      {
        id: "1:3",
        name: "Hidden",
        type: "RECTANGLE",
        visible: false,
      },
    ],
  });

  assert.deepEqual(structure, {
    id: "1:1",
    name: "Home",
    type: "frame",
    figmaType: "FRAME",
    layout: {
      x: 10,
      y: 20,
      width: 1440,
      height: 900,
      layoutMode: null,
      itemSpacing: null,
      paddingLeft: null,
      paddingRight: null,
      paddingTop: null,
      paddingBottom: null,
      primaryAxisAlignItems: null,
      counterAxisAlignItems: null,
      primaryAxisSizingMode: null,
      counterAxisSizingMode: null,
    },
    style: {
      opacity: 1,
      fill: {
        r: 255,
        g: 255,
        b: 255,
        a: 1,
      },
      stroke: null,
      fills: [
        {
          type: "SOLID",
          color: { r: 255, g: 255, b: 255, a: 1 },
        },
      ],
      strokes: [],
      strokeWeight: null,
      borderRadius: null,
    },
    text: null,
    children: [
      {
        id: "1:2",
        name: "Title",
        type: "text",
        figmaType: "TEXT",
        layout: {
          x: 40,
          y: 48,
          width: 220,
          height: 36,
          layoutMode: null,
          itemSpacing: null,
          paddingLeft: null,
          paddingRight: null,
          paddingTop: null,
          paddingBottom: null,
          primaryAxisAlignItems: null,
          counterAxisAlignItems: null,
          primaryAxisSizingMode: null,
          counterAxisSizingMode: null,
        },
        style: {
          opacity: 1,
          fill: null,
          stroke: null,
          fills: [],
          strokes: [],
          strokeWeight: null,
          borderRadius: null,
        },
        text: {
          characters: "Dashboard",
          fontFamily: "Inter",
          fontSize: 24,
          fontWeight: 700,
          lineHeightPx: 32,
          letterSpacing: 0,
          textAlignHorizontal: null,
          textAlignVertical: null,
        },
        children: [],
      },
    ],
  });
});

test("maps rectangle image fills as image nodes", () => {
  const structure = normalizeFigmaNode({
    id: "2:1",
    name: "Hero",
    type: "RECTANGLE",
    fills: [{ type: "IMAGE", imageRef: "image-ref" }],
  });

  assert.equal(structure.type, "image");
});

test("summarizes node totals by normalized type", () => {
  const summary = summarizeStructure({
    type: "frame",
    children: [
      { type: "text", children: [] },
      { type: "shape", children: [] },
      { type: "text", children: [] },
    ],
  });

  assert.deepEqual(summary, {
    totalNodes: 4,
    types: {
      frame: 1,
      shape: 1,
      text: 2,
    },
  });
});
