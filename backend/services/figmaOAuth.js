const crypto = require("node:crypto");
const { getFigmaOAuthConfig } = require("../config/oauth");

class FigmaOAuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message);
    this.name = "FigmaOAuthError";
    this.statusCode = statusCode;
  }
}

function createAuthorizationUrl(state, config = getFigmaOAuthConfig()) {
  const authorizationUrl = new URL("https://www.figma.com/oauth");
  authorizationUrl.searchParams.set("client_id", config.clientId);
  authorizationUrl.searchParams.set("redirect_uri", config.redirectUri);
  authorizationUrl.searchParams.set("scope", config.scopes);
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("response_type", "code");

  return authorizationUrl.toString();
}

function createOAuthState() {
  return crypto.randomBytes(32).toString("hex");
}

function createBasicAuthHeader(config) {
  return `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString(
    "base64"
  )}`;
}

async function requestToken(params, config, fetchImpl) {
  const response = await fetchImpl("https://api.figma.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: createBasicAuthHeader(config),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });

  if (!response.ok) {
    throw new FigmaOAuthError("Falha ao autenticar com OAuth do Figma.", 401);
  }

  return response.json();
}

async function exchangeCodeForToken(code, options = {}) {
  const config = options.config || getFigmaOAuthConfig();
  const fetchImpl = options.fetchImpl || fetch;

  if (!code) {
    throw new FigmaOAuthError("Authorization code nao informado.", 400);
  }

  return requestToken(
    {
      redirect_uri: config.redirectUri,
      code,
      grant_type: "authorization_code",
    },
    config,
    fetchImpl
  );
}

async function refreshAccessToken(refreshToken, options = {}) {
  const config = options.config || getFigmaOAuthConfig();
  const fetchImpl = options.fetchImpl || fetch;

  if (!refreshToken) {
    throw new FigmaOAuthError("Refresh token nao disponivel.", 401);
  }

  return requestToken(
    {
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    },
    config,
    fetchImpl
  );
}

function normalizeTokenResponse(tokenResponse) {
  const expiresIn = Number(tokenResponse.expires_in || 0);

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token || null,
    expiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null,
  };
}

async function getValidAccessToken(session, options = {}) {
  if (!session || !session.figmaToken || !session.figmaToken.accessToken) {
    throw new FigmaOAuthError("Usuario nao autenticado com Figma.", 401);
  }

  const token = session.figmaToken;
  const shouldRefresh = token.expiresAt && token.expiresAt - Date.now() < 60000;

  if (!shouldRefresh) {
    return token.accessToken;
  }

  if (!token.refreshToken) {
    throw new FigmaOAuthError("Token do Figma expirado. Conecte novamente.", 401);
  }

  const refreshedToken = await refreshAccessToken(token.refreshToken, options);
  session.figmaToken = normalizeTokenResponse(refreshedToken);

  return session.figmaToken.accessToken;
}

module.exports = {
  FigmaOAuthError,
  createAuthorizationUrl,
  createOAuthState,
  exchangeCodeForToken,
  getValidAccessToken,
  normalizeTokenResponse,
  refreshAccessToken,
};
