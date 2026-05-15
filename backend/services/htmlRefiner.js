const { escapeHtml } = require("./htmlGenerator");

const GENERIC_NAME_PARTS = new Set([
  "group",
  "rectangle",
  "vector",
  "frame",
  "shape",
  "layer",
]);

const ICON_NAME_MAP = {
  caretdown: "select",
  chevrondown: "expand",
  circlesfour: "overview",
  firstaid: "add",
  funnel: "filter",
  gearsix: "settings",
  slidershorizontal: "filters",
};

const LABEL_BY_ROLE = {
  add: "Adicionar",
  expand: "Expandir",
  filter: "Filtrar",
  filters: "Filtros",
  graphic: "Acao",
  overview: "Visao geral",
  select: "Selecionar",
  settings: "Configuracoes",
};

const ACTION_NAME_PARTS = new Set([
  "adicionar",
  "botao",
  "btn",
  "button",
  "cancelar",
  "categoria",
  "filtro",
  "filtrar",
  "mais",
  "metodo",
  "mostrar",
  "salvar",
]);

const SUMMARY_CARD_PARTS = new Set(["carteira", "entrada", "saida", "saldo", "total"]);

const FIELD_PARTS = new Set(["categoria", "data", "descricao", "metodo", "valor"]);

function toKebabCase(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function getNameParts(node) {
  return toKebabCase(node.name)
    .split("-")
    .filter((part) => part && !GENERIC_NAME_PARTS.has(part) && !/^\d+$/.test(part));
}

function isIconNode(node) {
  const name = toKebabCase(node.name).replace(/-/g, "");

  return (
    Object.prototype.hasOwnProperty.call(ICON_NAME_MAP, name) ||
    node.figmaType === "VECTOR" ||
    node.type === "shape" && Object.prototype.hasOwnProperty.call(ICON_NAME_MAP, name)
  );
}

function isGraphicIconNode(node) {
  return node.figmaType === "VECTOR";
}

function isDecorativeShapeNode(node) {
  return (
    node.type === "shape" &&
    !isGraphicIconNode(node) &&
    !isIconNode(node) &&
    (!node.children || node.children.length === 0)
  );
}

function getIconRole(node) {
  const compactName = toKebabCase(node.name).replace(/-/g, "");
  return ICON_NAME_MAP[compactName] || getNameParts(node)[0] || "graphic";
}

function hasIconChild(node) {
  return (node.children || []).some((child) => isIconNode(child));
}

function hasGraphicIconChild(node) {
  return (node.children || []).some((child) => isGraphicIconNode(child));
}

function countActionChildren(node) {
  return (node.children || []).filter((child) => isButtonLike(child)).length;
}

function isMenuNode(node) {
  return getNameParts(node).includes("menu");
}

function isSidebarNode(node) {
  const layout = node.layout || {};
  return isMenuNode(node) && typeof layout.width === "number" && layout.width <= 120;
}

function isFormNode(node) {
  const parts = getNameParts(node);
  const children = node.children || [];
  const hasFields = children.some((child) => getNameParts(child).includes("campos"));
  const hasSubmitAction = children.some((child) =>
    getNameParts(child).includes("salvar") || Boolean(findActionTextChild(child))
  );

  return (
    parts.includes("form") ||
    parts.includes("formulario") ||
    parts.includes("nova") && parts.includes("movimentacao") && hasFields && hasSubmitAction
  );
}

function isSummaryCardNode(node, isRoot = false) {
  if (isRoot) {
    return false;
  }

  const parts = getNameParts(node);
  const textValues = getTextDescendants(node);
  const hasSummaryName = parts.some((part) => SUMMARY_CARD_PARTS.has(part));
  const hasMoneyValue = textValues.some((text) => /R\$\s?\d/.test(text));

  return hasSummaryName && hasMoneyValue;
}

function isSegmentedControlNode(node) {
  const parts = getNameParts(node);
  return parts.includes("entrada") && parts.includes("saida");
}

function isDataGridNode(node) {
  const children = node.children || [];
  const hasTable = children.some(c => isTableNode(c) || c.className === "table-wrapper");
  const hasFilter = children.some((c) => getNameParts(c).includes("filtro"));
  return hasTable && hasFilter;
}

function getSummaryCardModifier(node) {
  const part = getNameParts(node).find((namePart) => SUMMARY_CARD_PARTS.has(namePart));
  return part ? ` summary-card--${part}` : "";
}

function isFieldNode(node) {
  return getNameParts(node).some((part) => FIELD_PARTS.has(part));
}

function getFieldRole(node) {
  return getNameParts(node).find((part) => FIELD_PARTS.has(part)) || "field";
}

function isTableRowNode(node) {
  return getNameParts(node).includes("linha");
}

function isTableHeaderNode(node) {
  return getNameParts(node).includes("cabecalho");
}

function isTableNode(node) {
  const children = node.children || [];
  return (
    getNameParts(node).includes("tabela") &&
    children.some((child) => isTableRowNode(child) || isTableHeaderNode(child))
  );
}

function hasActionName(node) {
  return getNameParts(node).some((part) => ACTION_NAME_PARTS.has(part));
}

function getTextParts(node) {
  const text = node && node.text && node.text.characters;
  return toKebabCase(text).split("-").filter(Boolean);
}

function findActionTextChild(node) {
  return (node.children || []).find((child) =>
    child.type === "text" && getTextParts(child).some((part) => ACTION_NAME_PARTS.has(part))
  );
}

function isSmallControl(node) {
  const children = node.children || [];
  return children.length > 0 && children.length <= 4 && countActionChildren(node) <= 1;
}

function isButtonLike(node) {
  return (
    hasActionName(node) && isSmallControl(node) ||
    isIconNode(node) && !isGraphicIconNode(node) && isSmallControl(node) ||
    hasGraphicIconChild(node) && isSmallControl(node) ||
    Boolean(findActionTextChild(node)) && isSmallControl(node)
  );
}

function getSemanticTag(node, isRoot = false, hasInteractiveAncestor = false) {
  if (node.type === "text") {
    return getTextTag(node);
  }

  if (node.type === "image") {
    return "img";
  }

  if (isGraphicIconNode(node)) {
    return "span";
  }

  if (hasInteractiveAncestor && isButtonLike(node)) {
    return isIconNode(node) ? "span" : "div";
  }

  if (isSidebarNode(node)) {
    return "aside";
  }

  if (isSummaryCardNode(node, isRoot)) {
    return "article";
  }

  if (isSegmentedControlNode(node)) {
    return "fieldset";
  }

  if (isFieldNode(node) && !hasInteractiveAncestor && node.type !== "text") {
    return "div";
  }

  if (isFormNode(node) && !isRoot) {
    return "form";
  }

  if (isMenuNode(node)) {
    return "nav";
  }

  if (isButtonLike(node) && !isRoot) {
    return "button";
  }

  if (isRoot) {
    return "main";
  }

  if (isDataGridNode(node)) {
    return "section";
  }

  if (node.type === "frame") {
    return "section";
  }

  return "div";
}

function getTextTag(node) {
  const fontSize = node.text && node.text.fontSize;
  const parts = getNameParts(node);

  if (parts.includes("title") || parts.includes("titulo")) {
    return "h1";
  }

  if (parts.includes("subtitle") || parts.includes("subtitulo") || fontSize >= 28) {
    return "h2";
  }

  if (fontSize >= 20) {
    return "strong";
  }

  return "span";
}

function getTextClassName(tag) {
  if (tag === "h1") {
    return "title";
  }

  if (tag === "h2") {
    return "subtitle";
  }

  if (tag === "strong") {
    return "value";
  }

  return "text";
}

function getBaseClassName(node, tag, isRoot = false) {
  if (tag === "span" && (isIconNode(node) || isGraphicIconNode(node))) {
    return `icon icon-${getIconRole(node)}`;
  }

  if (node.type === "text") {
    return getTextClassName(tag);
  }

  if (tag === "nav") {
    const parts = getNameParts(node).filter((part) => part !== "menu");
    return [parts.join("-"), "menu"].filter(Boolean).join("-");
  }

  if (tag === "button") {
    const iconChild = isIconNode(node) && !isGraphicIconNode(node)
      ? node
      : (node.children || []).find(isIconNode);
    const actionTextChild = findActionTextChild(node);
    const role = actionTextChild
        ? getTextParts(actionTextChild).join("-")
        : iconChild
          ? getIconRole(iconChild)
        : getNameParts(node).join("-");

    return ["button", role && `button-${role}`].filter(Boolean).join(" ");
  }

  if (tag === "form") {
    return "movement-form";
  }

  if (isSidebarNode(node)) {
    return "sidebar";
  }

  if (isSegmentedControlNode(node)) {
    return "segmented-control";
  }

  if (isFieldNode(node)) {
    return `form-field form-field--${getFieldRole(node)}`;
  }

  if (tag === "article") {
    return `summary-card${getSummaryCardModifier(node)}`;
  }

  if (isDataGridNode(node)) {
    return "data-grid";
  }

  const parts = getNameParts(node);

  if (parts.length > 0) {
    return parts.join("-");
  }

  if (isRoot) {
    return "screen";
  }

  return tag === "div" ? "container" : tag;
}

function getRefinedClassName(
  node,
  isRoot = false,
  hasInteractiveAncestor = false
) {
  const tag = getSemanticTag(node, isRoot, hasInteractiveAncestor);
  return getBaseClassName(node, tag, isRoot);
}

function injectSemanticClasses(node, isRoot = false, interactiveContext = false) {
  if (!node) return;

  const isInteractive = Boolean(interactiveContext);
  node.semanticTag = getSemanticTag(node, isRoot, isInteractive);
  node.className = getRefinedClassName(node, isRoot, isInteractive);

  if (isTableNode(node) && !node.isWrappedInTable) {
    const originalTableNode = { ...node, isWrappedInTable: true };
    node.type = "group";
    node.figmaType = "GROUP";
    node.semanticTag = "div";
    node.className = "table-wrapper";
    node.children = [originalTableNode];
    node.isWrapper = true;
    
    injectSemanticClasses(originalTableNode, false, interactiveContext);
    return;
  }

  const hasVisibleText = getTextDescendants(node).length > 0;
  const isButton = node.semanticTag === "button";
  const childInteractiveContext = isInteractive ? interactiveContext : (isButton ? { hasText: hasVisibleText } : false);

  (node.children || []).forEach(child => {
    injectSemanticClasses(child, false, childInteractiveContext);
  });
}

function indent(level) {
  return "  ".repeat(level);
}

function toHumanLabel(value) {
  const normalized = String(value || "")
    .replace(/-/g, " ")
    .trim();

  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "Acao";
}

function getTextDescendants(node) {
  const textNodes = [];

  function visit(currentNode) {
    if (!currentNode) {
      return;
    }

    if (currentNode.type === "text" && currentNode.text && currentNode.text.characters) {
      textNodes.push(currentNode.text.characters);
    }

    (currentNode.children || []).forEach(visit);
  }

  visit(node);
  return textNodes;
}

function getButtonRole(node) {
  const iconChild = isIconNode(node) && !isGraphicIconNode(node)
    ? node
    : (node.children || []).find(isIconNode);
  const actionTextChild = findActionTextChild(node);

  if (iconChild) {
    return getIconRole(iconChild);
  }

  if (actionTextChild) {
    return getTextParts(actionTextChild).join("-");
  }

  return getNameParts(node).join("-");
}

function getButtonLabel(node) {
  const text = getTextDescendants(node).join(" ").trim();

  if (text) {
    return text;
  }

  const role = getButtonRole(node);
  return LABEL_BY_ROLE[role] || toHumanLabel(role);
}

function getButtonType(node) {
  const role = getButtonRole(node);
  return role === "salvar" ? "submit" : "button";
}

function getSortX(node) {
  return node && node.layout && typeof node.layout.x === "number" ? node.layout.x : 0;
}

function getTextChildren(node) {
  return (node.children || [])
    .filter((child) => child.type === "text")
    .sort((a, b) => getSortX(a) - getSortX(b));
}

function getColumnClassName(headerText, index) {
  const fallback = `col-${index + 1}`;
  const value = toKebabCase(headerText);

  return value ? `col-${value}` : fallback;
}

function renderTableCell(node, tag, className, level) {
  const scope = tag === "th" ? ' scope="col"' : "";

  return `${indent(level)}<${tag} class="${className}"${scope}>${escapeHtml(
    node.text && node.text.characters
  )}</${tag}>`;
}

function renderTableRow(rowNode, cellTag, columnNames, level) {
  const cells = getTextChildren(rowNode);
  const renderedCells = cells
    .map((cell, index) =>
      renderTableCell(cell, cellTag, columnNames[index] || `col-${index + 1}`, level + 1)
    )
    .join("\n");

  return [
    `${indent(level)}<tr>`,
    renderedCells,
    `${indent(level)}</tr>`,
  ].join("\n");
}

function renderTableNode(node, level) {
  const children = node.children || [];
  const headerNode = children.find(isTableHeaderNode);
  const rowNodes = children.filter((child) => isTableRowNode(child) && getTextChildren(child).length > 0);
  const headerCells = headerNode ? getTextChildren(headerNode) : [];
  const columnNames = headerCells.map((cell, index) =>
    getColumnClassName(cell.text && cell.text.characters, index)
  );
  const thead = headerNode
    ? [
        `${indent(level + 1)}<thead>`,
        renderTableRow(headerNode, "th", columnNames, level + 2),
        `${indent(level + 1)}</thead>`,
      ].join("\n")
    : "";
  const tbody = [
    `${indent(level + 1)}<tbody>`,
    rowNodes
      .map((rowNode) => renderTableRow(rowNode, "td", columnNames, level + 2))
      .join("\n"),
    `${indent(level + 1)}</tbody>`,
  ].join("\n");

  return [
    `${indent(level)}<table class="table">`,
    thead,
    tbody,
    `${indent(level)}</table>`,
  ].filter(Boolean).join("\n");
}

function renderSidebarNode(node, level) {
  const children = (node.children || [])
    .map((child) => renderRefinedNode(child, level + 2, false, false))
    .filter(Boolean)
    .join("\n");

  return [
    `${indent(level)}<aside class="sidebar">`,
    `${indent(level + 1)}<nav class="sidebar-nav" aria-label="Menu principal">`,
    children,
    `${indent(level + 1)}</nav>`,
    `${indent(level)}</aside>`,
  ].join("\n");
}

function renderSummaryCardNode(node, level) {
  const texts = getTextDescendants(node);
  const value = texts.find((text) => /R\$\s?\d/.test(text)) || "";
  const label = texts.find((text) => text !== value) || getNameParts(node).join(" ");

  return [
    `${indent(level)}<article class="${getBaseClassName(node, "article")}">`,
    `${indent(level + 1)}<span class="summary-card__label">${escapeHtml(label)}</span>`,
    `${indent(level + 1)}<strong class="summary-card__value">${escapeHtml(value)}</strong>`,
    `${indent(level)}</article>`,
  ].join("\n");
}

function renderFormField(node, level) {
  const role = getFieldRole(node);
  const id = `${role}-field`;
  const text = getTextDescendants(node).join(" ").trim();
  const label = role.charAt(0).toUpperCase() + role.slice(1);
  let control = "";

  if (role === "data") {
    let dateVal = text;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
      const [dd, mm, yyyy] = text.split("/");
      dateVal = `${yyyy}-${mm}-${dd}`;
    } else if (/^\d{2}\/\d{2}$/.test(text)) {
      const [dd, mm] = text.split("/");
      dateVal = `2025-${mm}-${dd}`;
    }
    control = `<input id="${id}" class="form-control" name="${role}" type="date" value="${escapeHtml(dateVal)}">`;
  } else if (role === "valor") {
    control = `<input id="${id}" class="form-control" name="${role}" type="text" inputmode="decimal" value="${escapeHtml(text)}">`;
  } else if (role === "descricao") {
    control = `<textarea id="${id}" class="form-control" name="${role}">${escapeHtml(text)}</textarea>`;
  } else if (role === "categoria" || role === "metodo") {
    control = `<select id="${id}" class="form-control" name="${role}">\n${indent(level + 2)}<option value="" disabled selected>Selecione</option>\n${indent(level + 1)}</select>`;
  } else {
    control = `<input id="${id}" class="form-control" name="${role}" type="text" value="${escapeHtml(text)}">`;
  }

  return [
    `${indent(level)}<div class="form-field form-field--${role}">`,
    `${indent(level + 1)}<label for="${id}">${label}</label>`,
    `${indent(level + 1)}${control}`,
    `${indent(level)}</div>`,
  ].join("\n");
}

function renderSegmentedControlNode(node, level) {
  const options = (node.children || []).filter((c) => c.children).map((c, idx) => {
    const label = getTextDescendants(c).join(" ").trim() || getNameParts(c)[0] || "Opção";
    const val = toKebabCase(label);
    const checked = idx === 0 ? " checked" : "";
    return `${indent(level + 1)}<label class="segmented-control__option"><input type="radio" name="${toKebabCase(node.name)}" value="${val}"${checked}> <span>${escapeHtml(label)}</span></label>`;
  });
  return [
    `${indent(level)}<fieldset class="segmented-control">`,
    `${indent(level + 1)}<legend class="sr-only">Opções</legend>`,
    ...options,
    `${indent(level)}</fieldset>`
  ].join("\n");
}

function renderRefinedNode(
  node,
  level = 0,
  isRoot = false,
  interactiveContext = false
) {
  if (isDecorativeShapeNode(node)) {
    return "";
  }

  if (isTableNode(node)) {
    return renderTableNode(node, level);
  }

  const isInteractive = Boolean(interactiveContext);
  const tag = node.semanticTag || getSemanticTag(node, isRoot, isInteractive);
  const className = node.className || getRefinedClassName(node, isRoot, isInteractive);

  if (isSidebarNode(node)) {
    return renderSidebarNode(node, level);
  }

  if (isSummaryCardNode(node, isRoot)) {
    return renderSummaryCardNode(node, level);
  }

  if (isSegmentedControlNode(node)) {
    return renderSegmentedControlNode(node, level);
  }

  if (isFieldNode(node) && !isInteractive && node.type !== "text") {
    return renderFormField(node, level);
  }

  if (tag === "img") {
    return `${indent(level)}<img class="${className}" src="" alt="${escapeHtml(node.name || "Imagem")}">`;
  }

  if (node.type === "text") {
    if (isInteractive) {
      return `${indent(level)}<span class="button-label">${escapeHtml(
        node.text && node.text.characters
      )}</span>`;
    }

    return `${indent(level)}<${tag} class="${className}">${escapeHtml(
      node.text && node.text.characters
    )}</${tag}>`;
  }

  if (tag === "span") {
    const isDecorativeIconInButton = interactiveContext && interactiveContext.hasText;
    const ariaHidden = isGraphicIconNode(node) || isDecorativeIconInButton ? ' aria-hidden="true"' : "";
    return `${indent(level)}<span class="${className}"${ariaHidden}></span>`;
  }

  const hasVisibleText = getTextDescendants(node).length > 0;
  const isButton = tag === "button";
  const childInteractiveContext = isInteractive ? interactiveContext : (isButton ? { hasText: hasVisibleText } : false);

  const sortedChildren = [...(node.children || [])].sort((a, b) => {
    const aTag = getSemanticTag(a, false, false);
    const bTag = getSemanticTag(b, false, false);
    const aIsHeading = ["h1", "h2", "h3"].includes(aTag);
    const bIsHeading = ["h1", "h2", "h3"].includes(bTag);
    if (aIsHeading && !bIsHeading) return -1;
    if (!aIsHeading && bIsHeading) return 1;
    return 0;
  });

  const children = sortedChildren
    .map((child) =>
      renderRefinedNode(child, level + 1, false, childInteractiveContext)
    )
    .filter(Boolean)
    .join("\n");
  const ariaLabel = tag === "button" && !hasVisibleText
    ? ` aria-label="${escapeHtml(getButtonLabel(node))}"`
    : "";
  const attributes = tag === "button"
    ? ` class="${className}" type="${getButtonType(node)}"${ariaLabel}`
    : ` class="${className}"`;

  if (!children) {
    return `${indent(level)}<${tag}${attributes}></${tag}>`;
  }

  return [
    `${indent(level)}<${tag}${attributes}>`,
    children,
    `${indent(level)}</${tag}>`,
  ].join("\n");
}

function refineHtml(structure) {
  if (!structure) {
    const error = new Error("Estrutura nao informada para refinamento de HTML.");
    error.statusCode = 400;
    throw error;
  }

  injectSemanticClasses(structure, true, false);
  structure.isRefined = true;

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(structure.name || "Figma Export")}</title>
  </head>
  <body>
${renderRefinedNode(structure, 2, true)}
  </body>
</html>`;

  return { html, structure };
}

module.exports = {
  refineHtml,
  injectSemanticClasses,
};
