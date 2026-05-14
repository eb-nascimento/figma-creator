class OAuthConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "OAuthConfigError";
    this.statusCode = 500;
  }
}

function getFigmaOAuthConfig() {
  const clientId = process.env.FIGMA_CLIENT_ID;
  const clientSecret = process.env.FIGMA_CLIENT_SECRET;
  const redirectUri = process.env.FIGMA_REDIRECT_URI;
  const scopes = process.env.FIGMA_OAUTH_SCOPES || "file_content:read";

  if (!clientId || !clientSecret || !redirectUri) {
    throw new OAuthConfigError(
      "OAuth do Figma nao configurado. Defina FIGMA_CLIENT_ID, FIGMA_CLIENT_SECRET e FIGMA_REDIRECT_URI."
    );
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    scopes,
  };
}

module.exports = {
  OAuthConfigError,
  getFigmaOAuthConfig,
};
