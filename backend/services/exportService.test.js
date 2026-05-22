const test = require("node:test");
const assert = require("node:assert/strict");
const { generateZipBuffer } = require("./exportService");

test("pure JS ZIP encoder generates valid ZIP archives with correct binary signatures", () => {
  const files = [
    { name: "index.html", content: "<h1>Hello</h1>" },
    { name: "styles.css", content: "h1 { color: red; }" },
  ];

  const buffer = generateZipBuffer(files);

  assert.ok(Buffer.isBuffer(buffer));
  assert.ok(buffer.length > 100);

  // Validate ZIP local file header signature 0x04034b50 (starts with 'PK\x03\x04')
  assert.equal(buffer.readUInt32LE(0), 0x04034b50);
});
