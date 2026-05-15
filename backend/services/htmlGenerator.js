const BLOCK_TYPES = new Set(["component", "container", "frame", "group", "node", "shape"]);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toKebabCase(value) {
  return String(value || "node")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function createClassName(node) {
  const type = toKebabCase(node.type);
  const name = toKebabCase(node.name);
  const id = toKebabCase(node.id).slice(0, 24);

  return [type, name, id].filter(Boolean).join("-");
}

function getTextTag(node) {
  const fontSize = node.text && node.text.fontSize;
  const name = String(node.name || "").toLowerCase();

  if (name.includes("title") || name.includes("titulo") || fontSize >= 28) {
    return "h1";
  }

  if (name.includes("subtitle") || name.includes("subtitulo") || fontSize >= 20) {
    return "h2";
  }

  return "p";
}

function indent(level) {
  return "  ".repeat(level);
}

function renderChildren(node, level) {
  return (node.children || []).map((child) => renderNode(child, level)).join("\n");
}

function renderTextNode(node, level) {
  const tag = getTextTag(node);
  const className = createClassName(node);
  const text = escapeHtml(node.text && node.text.characters);

  return `${indent(level)}<${tag} class="${className}">${text}</${tag}>`;
}

function renderImageNode(node, level) {
  const className = createClassName(node);
  const alt = escapeHtml(node.name || "Imagem");

  return `${indent(level)}<img class="${className}" src="" alt="${alt}">`;
}

function renderBlockNode(node, level) {
  const tag = node.type === "frame" ? "section" : "div";
  const className = createClassName(node);
  const children = renderChildren(node, level + 1);

  if (!children) {
    return `${indent(level)}<${tag} class="${className}"></${tag}>`;
  }

  return [
    `${indent(level)}<${tag} class="${className}">`,
    children,
    `${indent(level)}</${tag}>`,
  ].join("\n");
}

function renderNode(node, level = 0) {
  if (!node) {
    return "";
  }

  if (node.type === "text") {
    return renderTextNode(node, level);
  }

  if (node.type === "image") {
    return renderImageNode(node, level);
  }

  if (BLOCK_TYPES.has(node.type)) {
    return renderBlockNode(node, level);
  }

  return renderBlockNode({ ...node, type: "node" }, level);
}

function generateHtml(structure) {
  if (!structure) {
    const error = new Error("Estrutura nao informada para geracao de HTML.");
    error.statusCode = 400;
    throw error;
  }

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(structure.name || "Figma Export")}</title>
  </head>
  <body>
${renderNode(structure, 2)}
  </body>
</html>`;
}

module.exports = {
  createClassName,
  escapeHtml,
  generateHtml,
  renderNode,
};
