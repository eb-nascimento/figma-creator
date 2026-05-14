const assert = require("node:assert/strict");
const test = require("node:test");
const {
  createAuthorizationUrl,
  exchangeCodeForToken,
  getValidAccessToken,
  normalizeTokenResponse,
} = require("./figmaOAuth");

const config = {
  clientId: "client-id",
  clientSecret: "client-secret",
  redirectUri: "http://localhost:3000/api/auth/figma/callback",
  scopes: "file_content:read",
};

test("creates Figma OAuth authorization URL", () => {
  const authorizationUrl = new URL(createAuthorizationUrl("state123", config));

  assert.equal(authorizationUrl.origin + authorizationUrl.pathname, "https://www.figma.com/oauth");
  assert.equal(authorizationUrl.searchParams.get("client_id"), "client-id");
  assert.equal(
    authorizationUrl.searchParams.get("redirect_uri"),
    "http://localhost:3000/api/auth/figma/callback"
  );
  assert.equal(authorizationUrl.searchParams.get("scope"), "file_content:read");
  assert.equal(authorizationUrl.searchParams.get("state"), "state123");
  assert.equal(authorizationUrl.searchParams.get("response_type"), "code");
});

test("exchanges authorization code using client credentials", async () => {
  const tokenResponse = {
    access_token: "access-token",
    refresh_token: "refresh-token",
    expires_in: 3600,
  };

  const result = await exchangeCodeForToken("auth-code", {
    config,
    fetchImpl: async (url, options) => {
      assert.equal(url, "https://api.figma.com/v1/oauth/token");
      assert.equal(options.method, "POST");
      assert.equal(
        options.headers.Authorization,
        `Basic ${Buffer.from("client-id:client-secret").toString("base64")}`
      );

      const body = new URLSearchParams(options.body);
      assert.equal(body.get("grant_type"), "authorization_code");
      assert.equal(body.get("code"), "auth-code");
      assert.equal(body.get("redirect_uri"), config.redirectUri);

      return {
        ok: true,
        json: async () => tokenResponse,
      };
    },
  });

  assert.deepEqual(result, tokenResponse);
});

test("refreshes expired session token when refresh token is available", async () => {
  const session = {
    figmaToken: {
      accessToken: "expired-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() - 1000,
    },
  };

  const accessToken = await getValidAccessToken(session, {
    config,
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        access_token: "new-access-token",
        refresh_token: "new-refresh-token",
        expires_in: 3600,
      }),
    }),
  });

  assert.equal(accessToken, "new-access-token");
  assert.equal(session.figmaToken.refreshToken, "new-refresh-token");
});

test("normalizes token response for session storage", () => {
  const normalized = normalizeTokenResponse({
    access_token: "access-token",
    refresh_token: "refresh-token",
    expires_in: 3600,
  });

  assert.equal(normalized.accessToken, "access-token");
  assert.equal(normalized.refreshToken, "refresh-token");
  assert.equal(typeof normalized.expiresAt, "number");
});
