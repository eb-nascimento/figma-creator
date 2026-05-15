const assert = require("node:assert/strict");
const test = require("node:test");
const { fetchFigmaFile, fetchFigmaImages, fetchFigmaNodes } = require("./figmaApi");

test("requires an OAuth access token", async () => {
  await assert.rejects(
    () => fetchFigmaFile("FileKey123", { accessToken: "" }),
    /Usuario nao autenticado/
  );
});

test("returns full Figma JSON when API request succeeds", async () => {
  const figmaJson = {
    name: "Project",
    document: { id: "0:0", name: "Document" },
  };

  const result = await fetchFigmaFile("FileKey123", {
    accessToken: "token",
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://api.figma.com/v1/files/FileKey123");
      assert.equal(options.headers.Authorization, "Bearer token");

      return {
        ok: true,
        status: 200,
        json: async () => figmaJson,
      };
    },
  });

  assert.deepEqual(result, figmaJson);
});

test("maps authentication, permission, and inaccessible file errors", async () => {
  const cases = [
    [401, /invalido/],
    [403, /Sem permissao/],
    [404, /nao encontrado ou inacessivel/],
  ];

  for (const [status, message] of cases) {
    await assert.rejects(
      () =>
        fetchFigmaFile("FileKey123", {
          accessToken: "token",
          fetchImpl: async () => ({
            ok: false,
            status,
          }),
        }),
      message
    );
  }
});

test("returns frame preview image URLs when image request succeeds", async () => {
  const images = {
    "1:1": "https://figma-preview.test/login.png",
    "2:1": "https://figma-preview.test/dashboard.png",
  };

  const result = await fetchFigmaImages("FileKey123", ["1:1", "2:1"], {
    accessToken: "token",
    fetchImpl: async (url, options) => {
      const requestUrl = new URL(url);

      assert.equal(requestUrl.origin, "https://api.figma.com");
      assert.equal(requestUrl.pathname, "/v1/images/FileKey123");
      assert.equal(requestUrl.searchParams.get("ids"), "1:1,2:1");
      assert.equal(requestUrl.searchParams.get("format"), "png");
      assert.equal(requestUrl.searchParams.get("scale"), "1");
      assert.equal(options.headers.Authorization, "Bearer token");

      return {
        ok: true,
        status: 200,
        json: async () => ({ images }),
      };
    },
  });

  assert.deepEqual(result, images);
});

test("does not request frame previews when frame list is empty", async () => {
  const result = await fetchFigmaImages("FileKey123", [], {
    accessToken: "token",
    fetchImpl: async () => {
      throw new Error("Nao deveria consultar a API do Figma.");
    },
  });

  assert.deepEqual(result, {});
});

test("returns Figma nodes when node request succeeds", async () => {
  const nodes = {
    "1:1": {
      document: {
        id: "1:1",
        name: "Home",
        type: "FRAME",
      },
    },
  };

  const result = await fetchFigmaNodes("FileKey123", ["1:1"], {
    accessToken: "token",
    fetchImpl: async (url, options) => {
      const requestUrl = new URL(url);

      assert.equal(requestUrl.origin, "https://api.figma.com");
      assert.equal(requestUrl.pathname, "/v1/files/FileKey123/nodes");
      assert.equal(requestUrl.searchParams.get("ids"), "1:1");
      assert.equal(options.headers.Authorization, "Bearer token");

      return {
        ok: true,
        status: 200,
        json: async () => ({ nodes }),
      };
    },
  });

  assert.deepEqual(result, nodes);
});
