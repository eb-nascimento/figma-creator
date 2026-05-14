const assert = require("node:assert/strict");
const test = require("node:test");
const { extractMainFrames } = require("./figmaFrames");

test("extracts only top-level frames from Figma pages preserving document order", () => {
  const frames = extractMainFrames({
    document: {
      children: [
        {
          id: "page-1",
          type: "CANVAS",
          children: [
            {
              id: "1:1",
              name: "Login",
              type: "FRAME",
              children: [
                {
                  id: "1:2",
                  name: "Nested frame",
                  type: "FRAME",
                },
              ],
            },
            {
              id: "1:3",
              name: "Component",
              type: "COMPONENT",
            },
          ],
        },
        {
          id: "page-2",
          type: "CANVAS",
          children: [
            {
              id: "2:1",
              name: "Dashboard",
              type: "FRAME",
            },
          ],
        },
      ],
    },
  });

  assert.deepEqual(frames, [
    {
      id: "1:1",
      name: "Login",
    },
    {
      id: "2:1",
      name: "Dashboard",
    },
  ]);
});

test("returns empty list when Figma document has no pages", () => {
  assert.deepEqual(extractMainFrames({ document: {} }), []);
  assert.deepEqual(extractMainFrames(null), []);
});
