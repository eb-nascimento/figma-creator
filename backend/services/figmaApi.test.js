const assert = require("node:assert/strict");
const test = require("node:test");
const { fetchFigmaFile } = require("./figmaApi");

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
