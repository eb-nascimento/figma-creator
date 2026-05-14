const http = require("node:http");
const { loadEnv } = require("./config/env");
const { parseCookies } = require("./services/cookies");
const {
  handleFigmaOAuthCallback,
  handleFigmaOAuthLogout,
  handleFigmaOAuthStart,
  handleFigmaOAuthStatus,
} = require("./routes/authRoutes");
const { handleFigmaFrames, handleFigmaImport } = require("./routes/figmaRoutes");

loadEnv();

const PORT = Number(process.env.PORT || 3000);

function getCorsHeaders(request) {
  const origin = request.headers.origin;

  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Credentials": origin ? "true" : "false",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function sendJson(request, response, statusCode, payload, headers = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...getCorsHeaders(request),
    ...headers,
  });
  response.end(JSON.stringify(payload));
}

function sendRedirect(response, statusCode, location, headers = {}) {
  response.writeHead(statusCode, {
    Location: location,
    ...headers,
  });
  response.end();
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("JSON invalido.");
    error.statusCode = 400;
    throw error;
  }
}

async function requestListener(request, response) {
  const requestUrl = new URL(request.url, "http://localhost");
  const requestContext = {
    cookies: parseCookies(request.headers.cookie),
    url: requestUrl,
  };

  if (request.method === "OPTIONS") {
    sendJson(request, response, 204, {});
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/health") {
    sendJson(request, response, 200, { status: "ok" });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/auth/figma/start") {
    try {
      const result = handleFigmaOAuthStart(requestContext);
      sendRedirect(response, result.statusCode, result.headers.Location, {
        "Set-Cookie": result.headers["Set-Cookie"],
      });
    } catch (error) {
      sendJson(request, response, error.statusCode || 500, {
        error: error.message || "Erro interno do servidor.",
      });
    }
    return;
  }

  if (
    request.method === "GET" &&
    requestUrl.pathname === "/api/auth/figma/callback"
  ) {
    try {
      const result = await handleFigmaOAuthCallback(requestContext);

      if (result.statusCode === 302) {
        sendRedirect(response, result.statusCode, result.headers.Location, {
          "Set-Cookie": result.headers["Set-Cookie"],
        });
        return;
      }

      sendJson(request, response, result.statusCode, result.body, result.headers);
    } catch (error) {
      sendJson(request, response, error.statusCode || 500, {
        error: error.message || "Erro interno do servidor.",
      });
    }
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/auth/figma/status") {
    sendJson(request, response, 200, handleFigmaOAuthStatus(requestContext));
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/auth/figma/logout") {
    const result = handleFigmaOAuthLogout(requestContext);
    sendJson(request, response, result.statusCode, result.body, result.headers);
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/figma/import") {
    try {
      const body = await readJsonBody(request);
      const result = await handleFigmaImport(body, requestContext);
      sendJson(request, response, 200, result);
    } catch (error) {
      sendJson(request, response, error.statusCode || 500, {
        error: error.message || "Erro interno do servidor.",
      });
    }
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/figma/frames") {
    try {
      const body = await readJsonBody(request);
      const result = await handleFigmaFrames(body, requestContext);
      sendJson(request, response, 200, result);
    } catch (error) {
      sendJson(request, response, error.statusCode || 500, {
        error: error.message || "Erro interno do servidor.",
      });
    }
    return;
  }

  sendJson(request, response, 404, { error: "Rota nao encontrada." });
}

if (require.main === module) {
  http.createServer(requestListener).listen(PORT, () => {
    console.log(`Figma Creator backend running on http://localhost:${PORT}`);
  });
}

module.exports = {
  requestListener,
  readJsonBody,
};
