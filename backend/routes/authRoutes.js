const { getFigmaOAuthConfig } = require("../config/oauth");
const { serializeCookie } = require("../services/cookies");
const {
  SESSION_COOKIE_NAME,
  deleteSession,
  getOrCreateSession,
  getSession,
  getSessionByOAuthState,
} = require("../services/sessionStore");
const {
  createAuthorizationUrl,
  createOAuthState,
  exchangeCodeForToken,
  normalizeTokenResponse,
} = require("../services/figmaOAuth");

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  sameSite: "Lax",
};

function getSessionCookie(sessionId) {
  return serializeCookie(SESSION_COOKIE_NAME, sessionId, SESSION_COOKIE_OPTIONS);
}

function getClearSessionCookie() {
  return serializeCookie(SESSION_COOKIE_NAME, "", {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: 0,
  });
}

function handleFigmaOAuthStart(requestContext) {
  const config = getFigmaOAuthConfig();
  const session = getOrCreateSession(requestContext.cookies[SESSION_COOKIE_NAME]);
  const state = createOAuthState();

  session.oauthState = state;

  return {
    statusCode: 302,
    headers: {
      Location: createAuthorizationUrl(state, config),
      "Set-Cookie": getSessionCookie(session.id),
    },
    body: "",
  };
}

async function handleFigmaOAuthCallback(requestContext) {
  const code = requestContext.url.searchParams.get("code");
  const state = requestContext.url.searchParams.get("state");
  const cookieSession = getSession(requestContext.cookies[SESSION_COOKIE_NAME]);
  const stateSession = getSessionByOAuthState(state);
  const session = cookieSession || stateSession;

  if (!session || !session.oauthState || session.oauthState !== state) {
    const error = new Error("Estado OAuth invalido ou expirado.");
    error.statusCode = 401;
    throw error;
  }

  const tokenResponse = await exchangeCodeForToken(code);
  session.oauthState = null;
  session.figmaToken = normalizeTokenResponse(tokenResponse);

  if (process.env.FRONTEND_REDIRECT_URL) {
    const redirectUrl = new URL(process.env.FRONTEND_REDIRECT_URL);
    redirectUrl.searchParams.set("figma_connected", "true");

    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl.toString(),
        "Set-Cookie": getSessionCookie(session.id),
      },
      body: "",
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Set-Cookie": getSessionCookie(session.id),
    },
    body: {
      connected: true,
    },
  };
}

function handleFigmaOAuthStatus(requestContext) {
  const session = getSession(requestContext.cookies[SESSION_COOKIE_NAME]);

  return {
    connected: Boolean(session && session.figmaToken && session.figmaToken.accessToken),
  };
}

function handleFigmaOAuthLogout(requestContext) {
  deleteSession(requestContext.cookies[SESSION_COOKIE_NAME]);

  return {
    statusCode: 200,
    headers: {
      "Set-Cookie": getClearSessionCookie(),
    },
    body: {
      connected: false,
    },
  };
}

module.exports = {
  handleFigmaOAuthCallback,
  handleFigmaOAuthLogout,
  handleFigmaOAuthStart,
  handleFigmaOAuthStatus,
};
