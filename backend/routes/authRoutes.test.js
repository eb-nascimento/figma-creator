const assert = require("node:assert/strict");
const test = require("node:test");
const {
  handleFigmaOAuthCallback,
  handleFigmaOAuthStart,
} = require("./authRoutes");

test("OAuth callback can recover session by state when cookie host changes", async (t) => {
  const previousClientId = process.env.FIGMA_CLIENT_ID;
  const previousClientSecret = process.env.FIGMA_CLIENT_SECRET;
  const previousRedirectUri = process.env.FIGMA_REDIRECT_URI;
  const previousFetch = global.fetch;

  process.env.FIGMA_CLIENT_ID = "client-id";
  process.env.FIGMA_CLIENT_SECRET = "client-secret";
  process.env.FIGMA_REDIRECT_URI = "http://localhost:3000/api/auth/figma/callback";
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      access_token: "access-token",
      refresh_token: "refresh-token",
      expires_in: 3600,
    }),
  });

  t.after(() => {
    global.fetch = previousFetch;

    if (previousClientId === undefined) {
      delete process.env.FIGMA_CLIENT_ID;
    } else {
      process.env.FIGMA_CLIENT_ID = previousClientId;
    }

    if (previousClientSecret === undefined) {
      delete process.env.FIGMA_CLIENT_SECRET;
    } else {
      process.env.FIGMA_CLIENT_SECRET = previousClientSecret;
    }

    if (previousRedirectUri === undefined) {
      delete process.env.FIGMA_REDIRECT_URI;
    } else {
      process.env.FIGMA_REDIRECT_URI = previousRedirectUri;
    }
  });

  const startResult = handleFigmaOAuthStart({ cookies: {} });
  const state = new URL(startResult.headers.Location).searchParams.get("state");
  const callbackUrl = new URL(
    `http://localhost:3000/api/auth/figma/callback?code=auth-code&state=${state}`
  );

  const result = await handleFigmaOAuthCallback({
    cookies: {},
    url: callbackUrl,
  });

  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, { connected: true });
  assert.match(result.headers["Set-Cookie"], /figma_creator_session=/);
});
