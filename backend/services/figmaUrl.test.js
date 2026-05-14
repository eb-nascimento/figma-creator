const assert = require("node:assert/strict");
const test = require("node:test");
const { extractFigmaFileKey, isFigmaHostname } = require("./figmaUrl");

test("extracts file_key from Figma file URL", () => {
  const fileKey = extractFigmaFileKey(
    "https://www.figma.com/file/AbC123xyZ/project-name?type=design"
  );

  assert.equal(fileKey, "AbC123xyZ");
});

test("extracts file_key from Figma design URL", () => {
  const fileKey = extractFigmaFileKey(
    "https://www.figma.com/design/ZyX987abc/project-name"
  );

  assert.equal(fileKey, "ZyX987abc");
});

test("accepts figma.com and figma subdomains only", () => {
  assert.equal(isFigmaHostname("figma.com"), true);
  assert.equal(isFigmaHostname("www.figma.com"), true);
  assert.equal(isFigmaHostname("evilfigma.com"), false);
  assert.equal(isFigmaHostname("figma.com.evil.test"), false);
});

test("rejects invalid URL", () => {
  assert.throws(() => extractFigmaFileKey("not a url"), /URL invalida/);
});

test("rejects URL without file_key", () => {
  assert.throws(
    () => extractFigmaFileKey("https://www.figma.com/files/team"),
    /file_key/
  );
});
