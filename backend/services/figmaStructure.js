const NODE_TYPE_MAP = {
  BOOLEAN_OPERATION: "shape",
  COMPONENT: "component",
  ELLIPSE: "shape",
  FRAME: "frame",
  GROUP: "group",
  INSTANCE: "component",
  LINE: "shape",
  POLYGON: "shape",
  RECTANGLE: "shape",
  SECTION: "container",
  STAR: "shape",
  TEXT: "text",
  VECTOR: "shape",
};

function roundNumber(value) {
  return typeof value === "number" ? Math.round(value * 100) / 100 : null;
}

function normalizeColor(color, opacity = 1) {
  if (!color) {
    return null;
  }

  return {
    r: roundNumber((color.r || 0) * 255),
    g: roundNumber((color.g || 0) * 255),
    b: roundNumber((color.b || 0) * 255),
    a: roundNumber((color.a ?? 1) * opacity),
  };
}

function getFirstSolidPaint(paints) {
  if (!Array.isArray(paints)) {
    return null;
  }

  return paints.find((paint) => paint && paint.visible !== false && paint.type === "SOLID") || null;
}

function hasImageFill(node) {
  return Array.isArray(node.fills) && node.fills.some((fill) => fill && fill.type === "IMAGE");
}

function mapNodeType(node) {
  if (node.type === "RECTANGLE" && hasImageFill(node)) {
    return "image";
  }

  return NODE_TYPE_MAP[node.type] || "node";
}

function normalizeLayout(node) {
  const bounds = node.absoluteBoundingBox || {};

  return {
    x: roundNumber(bounds.x),
    y: roundNumber(bounds.y),
    width: roundNumber(bounds.width),
    height: roundNumber(bounds.height),
  };
}

function normalizeStyle(node) {
  const fill = getFirstSolidPaint(node.fills);
  const stroke = getFirstSolidPaint(node.strokes);

  return {
    opacity: roundNumber(node.opacity ?? 1),
    fill: fill ? normalizeColor(fill.color, fill.opacity ?? 1) : null,
    stroke: stroke ? normalizeColor(stroke.color, stroke.opacity ?? 1) : null,
    borderRadius: roundNumber(node.cornerRadius),
  };
}

function normalizeText(node) {
  if (node.type !== "TEXT") {
    return null;
  }

  const style = node.style || {};

  return {
    characters: node.characters || "",
    fontFamily: style.fontFamily || null,
    fontSize: roundNumber(style.fontSize),
    fontWeight: style.fontWeight || null,
    lineHeightPx: roundNumber(style.lineHeightPx),
    letterSpacing: roundNumber(style.letterSpacing),
    textAlignHorizontal: style.textAlignHorizontal || null,
    textAlignVertical: style.textAlignVertical || null,
  };
}

function normalizeFigmaNode(node) {
  if (!node || node.visible === false) {
    return null;
  }

  const children = Array.isArray(node.children)
    ? node.children.map(normalizeFigmaNode).filter(Boolean)
    : [];

  return {
    id: node.id,
    name: node.name,
    type: mapNodeType(node),
    figmaType: node.type,
    layout: normalizeLayout(node),
    style: normalizeStyle(node),
    text: normalizeText(node),
    children,
  };
}

function summarizeStructure(structure) {
  const summary = {
    totalNodes: 0,
    types: {},
  };

  function visit(node) {
    if (!node) {
      return;
    }

    summary.totalNodes += 1;
    summary.types[node.type] = (summary.types[node.type] || 0) + 1;
    node.children.forEach(visit);
  }

  visit(structure);
  return summary;
}

module.exports = {
  normalizeFigmaNode,
  summarizeStructure,
};
