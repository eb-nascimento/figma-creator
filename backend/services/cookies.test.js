const assert = require("node:assert/strict");
const test = require("node:test");
const { parseCookies, serializeCookie } = require("./cookies");

test("parses cookies from request header", () => {
  const cookies = parseCookies("a=1; figma_creator_session=session%201");

  assert.equal(cookies.a, "1");
  assert.equal(cookies.figma_creator_session, "session 1");
});

test("serializes secure cookie attributes", () => {
  const cookie = serializeCookie("session", "abc", {
    httpOnly: true,
    path: "/",
    sameSite: "Lax",
    maxAge: 0,
  });

  assert.equal(cookie, "session=abc; Max-Age=0; Path=/; HttpOnly; SameSite=Lax");
});
