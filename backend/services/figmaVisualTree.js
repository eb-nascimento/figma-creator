function cloneNode(node) {
  return JSON.parse(JSON.stringify(node));
}

function hasBounds(node) {
  const layout = node && node.layout;
  return (
    layout &&
    typeof layout.x === "number" &&
    typeof layout.y === "number" &&
    typeof layout.width === "number" &&
    typeof layout.height === "number"
  );
}

function getCenter(node) {
  const layout = node.layout || {};
  return {
    x: (layout.x || 0) + (layout.width || 0) / 2,
    y: (layout.y || 0) + (layout.height || 0) / 2,
  };
}

function compareVisualPosition(a, b) {
  if (!hasBounds(a) || !hasBounds(b)) {
    return 0;
  }

  const rowTolerance = Math.max(8, Math.min(a.layout.height || 0, b.layout.height || 0) * 0.35);
  const deltaY = a.layout.y - b.layout.y;

  if (Math.abs(deltaY) > rowTolerance) {
    return deltaY;
  }

  return a.layout.x - b.layout.x;
}

function getCoverage(child, parent) {
  if (!hasBounds(child) || !hasBounds(parent)) {
    return 0;
  }

  const childArea = child.layout.width * child.layout.height;
  const parentArea = parent.layout.width * parent.layout.height;
  return parentArea > 0 ? childArea / parentArea : 0;
}

function hasVisualPaint(node) {
  const style = node.style || {};
  return Boolean(
    style.fill ||
    style.stroke ||
    (style.fills || []).length ||
    (style.strokes || []).length ||
    (style.effects || []).length
  );
}

function isBackgroundShape(child, parent) {
  if (!child || (child.type !== "shape" && child.type !== "node") || (child.children || []).length > 0) {
    return false;
  }

  const name = String(child.name || "").toLowerCase();
  const parentName = String(parent.name || "").toLowerCase();
  const nameSuggestsBackground = /fundo|background|bg|rectangle|retangulo/.test(name);
  const parentSuggestsInteractive = /botao|btn|button|salvar|cancelar|campo|field|input|select|segmented|card|entrada|saida|opcao|tabs|tab/.test(parentName);
  
  const coverage = getCoverage(child, parent);
  const coversParent = coverage >= 0.40;

  return hasVisualPaint(child) && (coversParent || nameSuggestsBackground || (parentSuggestsInteractive && coverage >= 0.30));
}

function mergeBackgroundIntoParent(parent, backgroundNode) {
  parent.style = parent.style || {};
  const backgroundStyle = backgroundNode.style || {};

  if (backgroundStyle.fill) parent.style.fill = backgroundStyle.fill;
  if (backgroundStyle.fills && backgroundStyle.fills.length > 0) parent.style.fills = backgroundStyle.fills;
  if (backgroundStyle.stroke) parent.style.stroke = backgroundStyle.stroke;
  if (backgroundStyle.strokes && backgroundStyle.strokes.length > 0) parent.style.strokes = backgroundStyle.strokes;
  if (backgroundStyle.strokeWeight) parent.style.strokeWeight = backgroundStyle.strokeWeight;
  if (backgroundStyle.borderRadius !== undefined && backgroundStyle.borderRadius !== null) parent.style.borderRadius = backgroundStyle.borderRadius;
  if (backgroundStyle.effects && backgroundStyle.effects.length > 0) parent.style.effects = backgroundStyle.effects;

  parent.visual = {
    ...(parent.visual || {}),
    backgroundFrom: backgroundNode.id,
  };
}

function inferRegion(node, parent) {
  if (!hasBounds(node) || !hasBounds(parent)) {
    return "content";
  }

  const center = getCenter(node);
  const parentLayout = parent.layout;
  const relativeX = (center.x - parentLayout.x) / parentLayout.width;
  const relativeY = (center.y - parentLayout.y) / parentLayout.height;

  if (relativeY <= 0.18) return "top";
  if (relativeY >= 0.82) return "bottom";
  if (relativeX <= 0.22) return "left";
  if (relativeX >= 0.78) return "right";
  return "center";
}

function inferLayoutKind(children) {
  const boundedChildren = children.filter(hasBounds);
  if (boundedChildren.length < 2) {
    return "single";
  }

  const sortedByY = [...boundedChildren].sort((a, b) => a.layout.y - b.layout.y);
  const sortedByX = [...boundedChildren].sort((a, b) => a.layout.x - b.layout.x);
  const ySpread = sortedByY[sortedByY.length - 1].layout.y - sortedByY[0].layout.y;
  const xSpread = sortedByX[sortedByX.length - 1].layout.x - sortedByX[0].layout.x;
  const avgHeight = boundedChildren.reduce((sum, child) => sum + child.layout.height, 0) / boundedChildren.length;
  const avgWidth = boundedChildren.reduce((sum, child) => sum + child.layout.width, 0) / boundedChildren.length;

  if (ySpread <= avgHeight * 0.55 && xSpread > avgWidth * 0.75) {
    return "horizontal";
  }

  if (xSpread <= avgWidth * 0.55 && ySpread > avgHeight * 0.75) {
    return "vertical";
  }

  return "grid";
}

function normalizeNodeVisual(node, parent = null) {
  const current = cloneNode(node);
  const children = (current.children || [])
    .map((child) => normalizeNodeVisual(child, current))
    .filter(Boolean);
  const keptChildren = [];

  children.forEach((child) => {
    if (isBackgroundShape(child, current)) {
      mergeBackgroundIntoParent(current, child);
      return;
    }

    keptChildren.push(child);
  });

  const sortedChildren = keptChildren
    .map((child, index) => ({
      child,
      originalIndex: index,
    }))
    .sort((a, b) => compareVisualPosition(a.child, b.child) || a.originalIndex - b.originalIndex)
    .map(({ child }, visualIndex) => {
      child.visual = {
        ...(child.visual || {}),
        order: visualIndex + 1,
        region: inferRegion(child, current),
      };
      return child;
    });

  current.children = sortedChildren;
  current.visual = {
    ...(current.visual || {}),
    normalized: true,
    region: parent ? inferRegion(current, parent) : "screen",
    layoutKind: inferLayoutKind(sortedChildren),
    childCount: sortedChildren.length,
  };

  return current;
}

function normalizeVisualTree(structure) {
  if (!structure) {
    return null;
  }

  return normalizeNodeVisual(structure);
}

module.exports = {
  normalizeVisualTree,
};
