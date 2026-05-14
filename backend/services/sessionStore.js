const crypto = require("node:crypto");

const SESSION_COOKIE_NAME = "figma_creator_session";
const sessions = new Map();

function createSession() {
  const sessionId = crypto.randomUUID();
  const session = {
    id: sessionId,
    createdAt: Date.now(),
    oauthState: null,
    figmaToken: null,
  };

  sessions.set(sessionId, session);
  return session;
}

function getSession(sessionId) {
  if (!sessionId) {
    return null;
  }

  return sessions.get(sessionId) || null;
}

function getOrCreateSession(sessionId) {
  return getSession(sessionId) || createSession();
}

function getSessionByOAuthState(oauthState) {
  if (!oauthState) {
    return null;
  }

  for (const session of sessions.values()) {
    if (session.oauthState === oauthState) {
      return session;
    }
  }

  return null;
}

function deleteSession(sessionId) {
  if (sessionId) {
    sessions.delete(sessionId);
  }
}

module.exports = {
  SESSION_COOKIE_NAME,
  createSession,
  deleteSession,
  getOrCreateSession,
  getSession,
  getSessionByOAuthState,
};
