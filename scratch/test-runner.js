const payload = {
  structure: {
    id: "0:1",
    name: "Test",
    type: "FRAME",
    layout: { width: 100, height: 100 },
    children: []
  },
  html: "<div>Test</div>",
  css: "div { color: red; }",
  mode: "visual-first",
  figmaLink: "https://www.figma.com/design/abcdef/Test-File?node-id=0-1"
};

fetch("http://localhost:3000/api/generate/ai/run", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
})
  .then(async res => {
    const data = await res.json();
    return { status: res.status, data };
  })
  .then(console.log)
  .catch(console.error);
