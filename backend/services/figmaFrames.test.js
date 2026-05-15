const assert = require("node:assert/strict");
const test = require("node:test");
const { attachFrameThumbnails, extractMainFrames } = require("./figmaFrames");

test("extracts only top-level frames from Figma pages preserving document order", () => {
  const frames = extractMainFrames({
    document: {
      children: [
        {
          id: "page-1",
          name: "Authentication",
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
          name: "Product",
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
      pageId: "page-1",
      pageName: "Authentication",
      thumbnailUrl: null,
    },
    {
      id: "2:1",
      name: "Dashboard",
      pageId: "page-2",
      pageName: "Product",
      thumbnailUrl: null,
    },
  ]);
});

test("returns empty list when Figma document has no pages", () => {
  assert.deepEqual(extractMainFrames({ document: {} }), []);
  assert.deepEqual(extractMainFrames(null), []);
});

test("attaches thumbnail URLs by frame ID", () => {
  const frames = attachFrameThumbnails(
    [
      {
        id: "1:1",
        name: "Login",
        pageId: "page-1",
        pageName: "Authentication",
        thumbnailUrl: null,
      },
      {
        id: "2:1",
        name: "Dashboard",
        pageId: "page-2",
        pageName: "Product",
        thumbnailUrl: null,
      },
    ],
    {
      "1:1": "https://figma-preview.test/login.png",
    }
  );

  assert.deepEqual(frames, [
    {
      id: "1:1",
      name: "Login",
      pageId: "page-1",
      pageName: "Authentication",
      thumbnailUrl: "https://figma-preview.test/login.png",
    },
    {
      id: "2:1",
      name: "Dashboard",
      pageId: "page-2",
      pageName: "Product",
      thumbnailUrl: null,
    },
  ]);
});
