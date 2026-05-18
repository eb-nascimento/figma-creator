const { injectSemanticClasses } = require("./htmlRefiner");

function toKebabCase(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function rgbaToCss(r, g, b, a) {
  const toHex = (n) => Math.round(n || 0).toString(16).padStart(2, "0").toUpperCase();
  if (a === 1 || typeof a === "undefined") {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  return `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(2))})`;
}

function extractColorFromPaint(paint) {
  if (paint && paint.type === "SOLID" && paint.color) {
    return {
      css: rgbaToCss(paint.color.r, paint.color.g, paint.color.b, paint.color.a),
      r: paint.color.r,
      g: paint.color.g,
      b: paint.color.b,
      a: paint.color.a !== undefined ? paint.color.a : 1
    };
  }
  return null;
}

function colorInfoToCss(color) {
  if (!color) return "";
  return rgbaToCss(color.r, color.g, color.b, color.a);
}

function getBrightness(r, g, b) {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function collectColors(node, colorsObj) {
  if (!node) return;

  const style = node.style || {};
  const paints = [...(style.fills || []), ...(style.strokes || [])];
  
  if (node.text && node.text.fills) {
     paints.push(...node.text.fills);
  }

  paints.forEach(paint => {
    const colorInfo = extractColorFromPaint(paint);
    if (colorInfo) {
      const c = colorInfo.css;
      if (!colorsObj[c]) {
        colorsObj[c] = { count: 1, ...colorInfo };
      } else {
        colorsObj[c].count++;
      }
    }
  });

  (node.children || []).forEach(child => collectColors(child, colorsObj));
}

function generateColorTokens(colorsObj) {
  const sortedColors = Object.values(colorsObj).sort((a, b) => b.count - a.count);
  const tokens = {};
  
  let primaryFound = false;
  let textCount = 1;
  let surfaceCount = 1;
  let borderCount = 1;
  let accentCount = 1;

  sortedColors.forEach((colorObj) => {
    if (colorObj.count <= 1) return;

    const { css, r, g, b, a } = colorObj;
    const brightness = getBrightness(r, g, b);
    const isGrayscale = Math.abs(r - g) < 15 && Math.abs(g - b) < 15;

    let varName = "";

    if (brightness > 240 && a === 1) {
      if (surfaceCount === 1) {
          varName = "--color-surface";
      } else if (surfaceCount === 2) {
          varName = "--color-surface-alt";
      } else {
          varName = `--color-surface-${surfaceCount}`;
      }
      surfaceCount++;
    } else if (brightness < 80 && a === 1) {
      varName = textCount === 1 ? "--color-text" : `--color-text-secondary`;
      textCount++;
    } else if (isGrayscale && brightness >= 80 && brightness <= 240) {
      varName = borderCount === 1 ? "--color-border" : `--color-border-${borderCount++}`;
    } else {
      if (!primaryFound) {
        varName = "--color-primary";
        primaryFound = true;
      } else {
        varName = `--color-accent-${accentCount++}`;
      }
    }

    if (Object.values(tokens).includes(varName)) {
      varName = `${varName}-alt`;
    }

    tokens[css] = varName;
  });

  return tokens;
}

function getBaseComponentRules(options = {}) {
  const isVisualFirst = options.mode === "visual-first";
  return {
    "input, select, textarea, button": {
      "appearance": "none",
      "-webkit-appearance": "none",
      "-moz-appearance": "none",
      "border": "none",
      "padding": "0",
      "margin": "0",
      "background": "transparent",
      "font": "inherit",
      "color": "inherit",
      "outline": "none"
    },
    "fieldset": {
      "border": "none",
      "padding": "0",
      "margin": "0",
      "min-width": "0"
    },
    "label": {
      "display": "inline-block",
      "cursor": "default"
    },
    ".table-wrapper": {
      "width": "100%",
      "overflow-x": "auto"
    },
    ".table": {
      "width": "100%",
      "border-collapse": "collapse",
      "text-align": "left"
    },
    ".table th, .table td": {
      "padding": "12px 16px",
      "vertical-align": "middle",
      ...(isVisualFirst ? {} : { "border-bottom": "1px solid var(--color-border, #e2e8f0)" })
    },
    ".table th": {
      "font-weight": "600"
    },
    ".table tbody tr:hover": {
      "background-color": "rgba(0, 0, 0, 0.02)"
    },
    ".button": {
      "display": "inline-flex",
      "align-items": "center",
      "justify-content": "center",
      "cursor": "pointer",
      "border": "none",
      "background": "transparent",
      "color": "inherit",
      "box-sizing": "border-box"
    },
    ".button:hover": {
      "opacity": "0.9"
    },
    ".button:active": {
      "opacity": "1"
    },
    ".button:disabled": {
      "opacity": "0.5",
      "cursor": "not-allowed"
    },
    ".form-control": {
      "width": "100%",
      "font": "inherit",
      "color": "inherit",
      "background": "transparent",
      "border": "none",
      "box-sizing": "border-box",
      "appearance": "none",
      "-webkit-appearance": "none",
      "-moz-appearance": "none"
    },
    ".form-control:focus": {
      "outline": "2px solid currentColor",
      "outline-offset": "2px"
    },
    ".form-field": {
      "display": "flex",
      "flex-direction": "column",
      "gap": "6px",
      "width": "100%"
    },
    ".form-field label": {
      "font": "inherit",
      "color": "inherit"
    },
    ".summary-card": {
      "display": "flex",
      "flex-direction": "column",
      "gap": "8px"
    },
    ".sidebar": {
      "display": "flex",
      "flex-direction": "column",
      "height": "100%"
    },
    ".sidebar-nav": {
      "display": "flex",
      "flex-direction": "column",
      "gap": "8px",
      "padding": "16px"
    },
    ".movimentacoes": {
      "display": "flex",
      "flex-direction": "column",
      "gap": "16px",
      "width": "100%"
    },
    ".campos": {
      "display": "grid",
      "grid-template-columns": "repeat(auto-fit, minmax(200px, 1fr))",
      "gap": "16px",
      "width": "100%"
    },
    ".segmented-control": {
      "display": "inline-flex",
      "gap": "4px"
    },
    ".summary-card__label": {
      "font": "inherit"
    },
    ".summary-card__value": {
      "font": "inherit"
    },
    ".valores": {
      "display": "grid",
      "grid-template-columns": "repeat(auto-fit, minmax(240px, 1fr))",
      "gap": "24px",
      "width": "100%"
    },
    ".movement-form": {
      "display": "flex",
      "flex-direction": "column",
      "gap": "24px",
      "width": "100%"
    },
    ".segmented-control__option": {
      "cursor": "pointer",
      "transition": "all 0.2s"
    },
    ".segmented-control__option input:checked + span": {
      "font-weight": "700"
    },
    ".segmented-control__option:has(input:checked)": {
      "outline": "1px solid currentColor"
    },
    ".button-mostrar-mais": {
      "width": "100%"
    },
    ".button-salvar": {
      "width": "100%"
    },
    ".icon": {
      "display": "inline-flex",
      "align-items": "center",
      "justify-content": "center",
      "flex-shrink": "0"
    }
  };
}

const GENERIC_CLASSES = ["button", "subtitle", "title", "icon", "form-control", "form-field"];

function buildRules(node, colorTokens, isRoot = false, parentNode = null, options = {}) {
  const rules = {};
  const layout = node.layout || {};
  const style = node.style || {};

  let parentDirection = "column"; // default if no parent
  if (parentNode && parentNode.layout) {
    const parentLayout = parentNode.layout;
    if (parentLayout.layoutMode === "HORIZONTAL") {
      parentDirection = "row";
    } else if (parentLayout.layoutMode === "VERTICAL") {
      parentDirection = "column";
    } else {
      // Se não houver layoutMode explícito, podemos inferir a direção do pai usando
      // a lógica de adjacência yDiff!
      const parentChildren = parentNode.children || [];
      if (parentChildren.length > 1) {
        let allYClose = true;
        const sortedByX = [...parentChildren].sort((a, b) => a.layout.x - b.layout.x);
        for (let i = 0; i < sortedByX.length - 1; i++) {
          const yDiff = Math.abs(sortedByX[i].layout.y - sortedByX[i+1].layout.y);
          const maxHeight = Math.max(sortedByX[i].layout.height || 0, sortedByX[i+1].layout.height || 0);
          if (yDiff > 25 && yDiff > maxHeight * 0.4) {
            allYClose = false;
            break;
          }
        }
        const xPositions = parentChildren.map(c => c.layout.x);
        const yPositions = parentChildren.map(c => c.layout.y);
        const minX = Math.min(...xPositions);
        const maxX = Math.max(...xPositions);
        const minY = Math.min(...yPositions);
        const maxY = Math.max(...yPositions);
        if (allYClose && (maxX - minX > maxY - minY)) {
          parentDirection = "row";
        } else {
          parentDirection = "column";
        }
      }
    }
  }

  const isIcon = (node.className && node.className.includes("icon")) || node.figmaType === "VECTOR" || node.type === "shape";
  const isGeneric = options.mode === "visual-first" ? false : (node.className && GENERIC_CLASSES.some(g => node.className === g));

  const nonFlexTags = ["table", "thead", "tbody", "tr", "td", "th", "ul", "ol", "li"];
  const isTableEl = nonFlexTags.includes(node.semanticTag);

  if (!isTableEl) {
    if (layout.layoutMode === "HORIZONTAL" || layout.layoutMode === "VERTICAL") {
      rules["display"] = "flex";
      rules["flex-direction"] = layout.layoutMode === "HORIZONTAL" ? "row" : "column";
      
      if (layout.itemSpacing) {
        rules["gap"] = `${layout.itemSpacing}px`;
      }

      if (layout.paddingTop || layout.paddingBottom || layout.paddingLeft || layout.paddingRight) {
        rules["padding"] = `${layout.paddingTop || 0}px ${layout.paddingRight || 0}px ${layout.paddingBottom || 0}px ${layout.paddingLeft || 0}px`;
      }

      if (layout.primaryAxisAlignItems) {
        const map = { MIN: "flex-start", CENTER: "center", MAX: "flex-end", SPACE_BETWEEN: "space-between" };
        if (map[layout.primaryAxisAlignItems]) rules["justify-content"] = map[layout.primaryAxisAlignItems];
      }

      if (layout.counterAxisAlignItems) {
        const map = { MIN: "flex-start", CENTER: "center", MAX: "flex-end", BASELINE: "baseline" };
        if (map[layout.counterAxisAlignItems]) rules["align-items"] = map[layout.counterAxisAlignItems];
      }
    } else if (node.className && node.className.includes("card-grid")) {
      rules["display"] = "grid";
      rules["gap"] = "24px";
      rules["grid-template-columns"] = "repeat(auto-fit, minmax(280px, 1fr))";
    }
  }

  const isFlexibleContainer = node.className && (
    node.className.includes("card") ||
    node.className.includes("form") ||
    node.className.includes("sidebar") ||
    node.className.includes("main") ||
    node.className.includes("container") ||
    node.className.includes("wrapper") ||
    node.className.includes("header") ||
    node.className.includes("footer") ||
    node.className.includes("nav") ||
    node.className.includes("grid")
  );

  if (typeof layout.width === "number" && typeof layout.height === "number" && !isGeneric && (!isTableEl || options.mode === "visual-first")) {
    const isSmallComponent = (
      node.semanticTag === "button" ||
      (node.className && (node.className.includes("field") || node.className.includes("button") || node.className.includes("icon") || node.className.includes("summary-card"))) ||
      (!isRoot && layout.height < 200)
    );

    if (options.mode === "visual-first") {
      rules["box-sizing"] = "border-box";
      if (typeof layout.width === "number") {
        rules["width"] = `${layout.width}px`;
      }
      if (typeof layout.height === "number") {
        const hasChildren = node.children && node.children.length > 0;
        if (hasChildren && !isSmallComponent) {
          rules["min-height"] = `${layout.height}px`;
        } else {
          rules["height"] = `${layout.height}px`;
        }
      }
      if (isRoot) {
        rules["position"] = "relative";
        rules["overflow"] = "hidden";
      } else {
        rules["flex-shrink"] = "0";
      }
    } else {
      if (isRoot) {
        rules["--figma-width"] = `${layout.width}px; width: ${layout.width}px`;
        rules["--figma-height"] = `${layout.height}px; min-height: ${layout.height}px`;
        rules["width"] = "100%";
        rules["max-width"] = "1920px";
        rules["min-height"] = "100vh";
      } else if (node.semanticTag === "img" || isIcon) {
        rules["width"] = `${layout.width}px`;
        rules["height"] = `${layout.height}px`;
        rules["flex-shrink"] = "0";
      } else if (isSmallComponent) {
        rules["box-sizing"] = "border-box";
        if (parentDirection === "row") {
          rules["flex-shrink"] = "0";
          rules["width"] = `${layout.width}px`;
        } else {
          if (layout.width < 250) {
            rules["width"] = `${layout.width}px`;
          } else {
            rules["width"] = "100%";
            rules["max-width"] = `${layout.width}px`;
          }
        }
        rules["height"] = `${layout.height}px`;
      } else {
        rules["box-sizing"] = "border-box";
        if (parentDirection === "row") {
          rules["flex-basis"] = `${layout.width}px`;
          rules["flex-grow"] = "0";
          rules["flex-shrink"] = "1";
          rules["max-width"] = "100%";
        } else {
          rules["width"] = "100%";
          rules["max-width"] = `${layout.width}px`;
        }
        rules["min-height"] = `${layout.height}px`;
      }
    }
  }

  const isTextNode = node.type === "text" || node.semanticTag === "span" || node.semanticTag === "p" || ["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.semanticTag);
  const solidFill = (style.fills || []).find(f => f.type === "SOLID");
  if (solidFill && !isTextNode && !isGeneric) {
    const color = extractColorFromPaint(solidFill);
    if (color && color.css) {
      const colorVal = colorTokens[color.css] ? `var(${colorTokens[color.css]})` : color.css;
      if (isIcon) {
        rules["color"] = colorVal;
      } else {
        rules["background-color"] = colorVal;
      }
    }
  }

  if (style.borderRadius) {
    rules["border-radius"] = `${style.borderRadius}px`;
  }

  const solidStroke = (style.strokes || []).find(f => f.type === "SOLID");
  if (solidStroke && style.strokeWeight) {
    const color = extractColorFromPaint(solidStroke);
    if (color && color.css) {
      const colorVal = colorTokens[color.css] ? `var(${colorTokens[color.css]})` : color.css;
      rules["border"] = `${style.strokeWeight}px solid ${colorVal}`;
    }
  }

  const shadows = (style.effects || [])
    .filter((effect) => effect.type === "DROP_SHADOW" && effect.color)
    .map((effect) => {
      const offset = effect.offset || {};
      const x = offset.x || 0;
      const y = offset.y || 0;
      const radius = effect.radius || 0;
      const spread = effect.spread || 0;
      return `${x}px ${y}px ${radius}px ${spread}px ${colorInfoToCss(effect.color)}`;
    });

  const textShadows = (style.effects || [])
    .filter((effect) => effect.type === "DROP_SHADOW" && effect.color)
    .map((effect) => {
      const offset = effect.offset || {};
      const x = offset.x || 0;
      const y = offset.y || 0;
      const radius = effect.radius || 0;
      return `${x}px ${y}px ${radius}px ${colorInfoToCss(effect.color)}`;
    });

  const hasBackgroundOrBorder = rules["background-color"] || rules["border"] || rules["border-radius"];

  if (shadows.length > 0) {
    if (isTextNode || !hasBackgroundOrBorder) {
      rules["text-shadow"] = textShadows.join(", ");
    } else if (!isGeneric) {
      rules["box-shadow"] = shadows.join(", ");
    }
  }

  if (node.type === "text" && node.text) {
    const t = node.text;
    if (t.fontFamily) rules["font-family"] = `"${t.fontFamily}", sans-serif`;
    if (t.fontSize) {
      const fs = t.fontSize;
      if (options.mode === "visual-first") {
        rules["font-size"] = `${fs}px`;
      } else {
        if (fs >= 18) {
          rules["font-size"] = `clamp(${Math.round(fs * 0.6)}px, ${Number((fs / 1920 * 100).toFixed(3))}vw, ${fs}px)`;
        } else {
          rules["font-size"] = `${fs}px`;
        }
      }
    }
    if (t.fontWeight) rules["font-weight"] = t.fontWeight;
    if (t.lineHeightPx) rules["line-height"] = `${t.lineHeightPx}px`;
    if (t.letterSpacing) rules["letter-spacing"] = `${t.letterSpacing}px`;

    if (t.textAlignHorizontal) {
      const map = { LEFT: "left", CENTER: "center", RIGHT: "right", JUSTIFIED: "justify" };
      if (map[t.textAlignHorizontal]) rules["text-align"] = map[t.textAlignHorizontal];
    }
    
    const textFill = (t.fills || []).find(f => f.type === "SOLID") || (style.fills || []).find(f => f.type === "SOLID");
    if (textFill) {
      const color = extractColorFromPaint(textFill);
      if (color && color.css) {
        rules["color"] = colorTokens[color.css] ? `var(${colorTokens[color.css]})` : color.css;
      }
    }
  }

  if (node.className && node.className.includes("button") && rules["background-color"]) {
     const bg = rules["background-color"];
     if (bg === "#FFFFFF" || bg === "var(--color-surface)") {
         rules["color"] = "var(--color-text, #333)";
     }
  }

  if (options.mode === "visual-first") {
    const logs = [];

    // Check missing visual features
    if (!style.borderRadius && (
      node.semanticTag === "button" || 
      (node.className && (
        node.className.includes("card") || 
        node.className.includes("field") || 
        node.className.includes("control") ||
        node.className.includes("segmented")
      ))
    )) {
      logs.push("radius ausente");
    }

    const fillsList = style.fills || [];
    if (fillsList.length === 0 && !isTextNode) {
      logs.push("fill ausente");
    }

    if (node.figmaType === "VECTOR" && (!node.vectorData && !node.path && !node.fillGeometry && !node.strokeGeometry)) {
      logs.push("vector ausente");
    }

    const effectsList = style.effects || [];
    const hasShadow = effectsList.some(e => e.type === "DROP_SHADOW");
    if (!hasShadow && (node.className && node.className.includes("card"))) {
      logs.push("shadow ausente");
    }

    const SUPPORTED_FIGMA_PROPERTIES = new Set([
      "width", "height", "x", "y", "fills", "strokes", "strokeWeight", "borderRadius",
      "effects", "fontFamily", "fontSize", "fontWeight", "lineHeightPx", "letterSpacing",
      "textAlignHorizontal", "opacity", "paddingTop", "paddingBottom", "paddingLeft",
      "paddingRight", "itemSpacing"
    ]);

    const unsupported = [];
    if (node.style) {
      Object.keys(node.style).forEach(key => {
        if (!SUPPORTED_FIGMA_PROPERTIES.has(key)) unsupported.push(`style.${key}`);
      });
    }
    if (node.layout) {
      Object.keys(node.layout).forEach(key => {
        if (!SUPPORTED_FIGMA_PROPERTIES.has(key)) unsupported.push(`layout.${key}`);
      });
    }
    if (unsupported.length > 0) {
      logs.push(`unsupported properties: ${unsupported.join(", ")}`);
    }

    if (logs.length > 0) {
      console.log(`[Figma Visual-First Log] Node "${node.name}" (${node.id}) ignored properties: ${logs.join(" | ")}`);
    }
  }

  return rules;
}

function collectActiveSelectorsFromHtml(htmlString, set) {
  if (!htmlString) return;

  const tagRegex = /<([a-z0-9-]+)(?=\s|>)/gi;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(htmlString)) !== null) {
    set.add(tagMatch[1].toLowerCase());
  }

  const classRegex = /class="([^"]+)"/gi;
  let classMatch;
  while ((classMatch = classRegex.exec(htmlString)) !== null) {
    const classNames = classMatch[1].split(/\s+/);
    classNames.forEach(c => {
      if (c) set.add("." + c);
    });
  }
}

function selectorExistsInHtml(selector, activeSet) {
  const parts = selector.split(/[ :]+/).filter(Boolean);
  for (const part of parts) {
     if (part === "hover" || part === "active" || part === "disabled" || part === "focus") continue;
     if (part.startsWith(">") || part.startsWith("+") || part.startsWith("~")) continue;
     if (!activeSet.has(part)) {
        return false;
     }
  }
  return true;
}

function getRootSelectorFromHtml(htmlString) {
  const bodyRootMatch = String(htmlString || "").match(/<body>\s*<([a-z0-9-]+)([^>]*)>/i);
  if (!bodyRootMatch) {
    return "";
  }

  const attributes = bodyRootMatch[2] || "";
  const classMatch = attributes.match(/class="([^"]+)"/i);
  if (classMatch) {
    const className = classMatch[1].split(/\s+/).find(Boolean);
    return className ? `.${className}` : bodyRootMatch[1].toLowerCase();
  }

  return bodyRootMatch[1].toLowerCase();
}

function selectorExistsInGeneratedHtml(selector, activeSet) {
  const classMatches = selector.match(/\.[a-zA-Z0-9_-]+/g) || [];
  for (const className of classMatches) {
    if (!activeSet.has(className)) {
      return false;
    }
  }

  const selectorWithoutClasses = selector
    .replace(/\.[a-zA-Z0-9_-]+/g, " ")
    .replace(/:[a-zA-Z-]+(\([^)]*\))?/g, " ")
    .replace(/[#>+~*,[\]="'()]/g, " ");
  const tagNames = selectorWithoutClasses
    .split(/\s+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  for (const tagName of tagNames) {
    if (!activeSet.has(tagName)) {
      return false;
    }
  }

  return true;
}

function calculateGeometryRules(node, rules, options = {}) {
  const isTableContainer = ["table", "thead", "tbody", "tr"].includes(node.semanticTag);
  if (isTableContainer) {
     return;
  }
  const isTableCell = ["td", "th"].includes(node.semanticTag);
  const isTableEl = isTableCell;

  if (options.mode === "visual-first") {
     if (isTableCell) {
        return;
     }
  }

  const layout = node.layout || {};
  const children = (node.children || []).filter(c => c && c.layout && typeof c.layout.x === "number" && typeof c.layout.y === "number");

  if (children.length === 0) {
    return;
  }

  if (typeof layout.x === "number" && typeof layout.y === "number" && typeof layout.width === "number" && typeof layout.height === "number") {
    const minX = Math.min(...children.map(c => c.layout.x));
    const minY = Math.min(...children.map(c => c.layout.y));
    const maxX = Math.max(...children.map(c => c.layout.x + (c.layout.width || 0)));
    const maxY = Math.max(...children.map(c => c.layout.y + (c.layout.height || 0)));

    let paddingTop = Math.max(0, Math.round(minY - layout.y));
    let paddingLeft = Math.max(0, Math.round(minX - layout.x));
    let paddingBottom = Math.max(0, Math.round((layout.y + layout.height) - maxY));
    let paddingRight = Math.max(0, Math.round((layout.x + layout.width) - maxX));

    if (isTableCell) {
      paddingTop = Math.min(paddingTop, 12);
      paddingBottom = Math.min(paddingBottom, 12);
      paddingLeft = Math.min(paddingLeft, 16);
      paddingRight = Math.min(paddingRight, 16);
    }

    if (paddingTop < layout.height * 0.4 && paddingLeft < layout.width * 0.4 && paddingBottom < layout.height * 0.4 && paddingRight < layout.width * 0.4) {
      if (paddingTop > 2 || paddingLeft > 2 || paddingBottom > 2 || paddingRight > 2) {
         if (paddingTop === paddingBottom && paddingLeft === paddingRight) {
            if (paddingTop === paddingLeft) {
              rules["padding"] = `${paddingTop}px`;
            } else {
              rules["padding"] = `${paddingTop}px ${paddingLeft}px`;
            }
         } else {
            rules["padding"] = `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`;
         }
      }
    }
  }

  if (isTableEl) {
     return;
  }

  // Evitar conflito de padding vertical com botões de altura fixa
  if (node.semanticTag === "button" && rules["padding"] && layout.height) {
    const pads = rules["padding"].split(" ");
    if (pads.length === 4) {
      rules["padding"] = `0px ${pads[1]} 0px ${pads[3]}`;
    } else if (pads.length === 2) {
      rules["padding"] = `0px ${pads[1]}`;
    } else {
      rules["padding"] = `0px 16px`;
    }
  }

  if (children.length > 1) {
    const isHorizontal = node.layout && node.layout.layoutMode === "HORIZONTAL";
    
    let inferredDirection = "vertical";
    const sortedByX = [...children].sort((a, b) => a.layout.x - b.layout.x);
    
    // Se todos os elementos adjacentes têm y muito próximos (dentro de 25px ou 40% da altura máxima),
    // e a largura total é maior que a altura total, podemos inferir horizontal.
    let allYClose = true;
    for (let i = 0; i < sortedByX.length - 1; i++) {
      const yDiff = Math.abs(sortedByX[i].layout.y - sortedByX[i+1].layout.y);
      const maxHeight = Math.max(sortedByX[i].layout.height || 0, sortedByX[i+1].layout.height || 0);
      if (yDiff > 25 && yDiff > maxHeight * 0.4) {
        allYClose = false;
        break;
      }
    }
    
    const xPositions = children.map(c => c.layout.x);
    const yPositions = children.map(c => c.layout.y);
    const minX = Math.min(...xPositions);
    const maxX = Math.max(...xPositions);
    const minY = Math.min(...yPositions);
    const maxY = Math.max(...yPositions);
    
    if (allYClose && (maxX - minX > maxY - minY)) {
       inferredDirection = "horizontal";
    }

    if (isHorizontal || inferredDirection === "horizontal") {
      const sorted = [...children].sort((a, b) => a.layout.x - b.layout.x);
      const gaps = [];
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i+1].layout.x - (sorted[i].layout.x + (sorted[i].layout.width || 0));
        gaps.push(Math.max(0, Math.round(gap)));
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      if (avgGap > 2 && avgGap < 80) {
        rules["gap"] = `${Math.round(avgGap)}px`;
      }
      rules["display"] = "flex";
      rules["flex-direction"] = "row";
    } else {
      const sorted = [...children].sort((a, b) => a.layout.y - b.layout.y);
      const gaps = [];
      for (let i = 0; i < sorted.length - 1; i++) {
        const gap = sorted[i+1].layout.y - (sorted[i].layout.y + (sorted[i].layout.height || 0));
        gaps.push(Math.max(0, Math.round(gap)));
      }
      const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      if (avgGap > 2 && avgGap < 80) {
        rules["gap"] = `${Math.round(avgGap)}px`;
      }
      rules["display"] = "flex";
      rules["flex-direction"] = "column";
    }
  }

  if (rules["display"] === "flex") {
    const textChildren = children.filter(c => c.type === "text" && c.text);
    if (textChildren.length > 0) {
       const textAligns = textChildren.map(c => c.text.textAlignHorizontal).filter(Boolean);
       if (textAligns.includes("CENTER")) {
          rules["align-items"] = "center";
          if (rules["flex-direction"] === "row") {
             rules["justify-content"] = "center";
          }
       }
    }
  }
}

function extractCssRules(node, colorTokens, layers, activeSet, isRoot = false, parentNode = null, options = {}) {
  if (!node) return;

  if (node.type === "shape" && (!node.children || node.children.length === 0)) {
    return;
  }

  const rules = buildRules(node, colorTokens, isRoot, parentNode, options);
  calculateGeometryRules(node, rules, options);

  if (Object.keys(rules).length > 0) {
    if (!layers.figmaIdRules) {
      layers.figmaIdRules = {};
    }
    const figmaIdSelector = `[data-figma-id="${node.id}"]`;
    layers.figmaIdRules[figmaIdSelector] = { ...rules };

    // Se for um nó de form-field, extrair estilos visuais para o controle interno
    const isField = node.className && node.className.includes("form-field");
    if (isField) {
      const controlSelector = `[data-figma-id="${node.id}-control"]`;
      const controlRules = {};

      const visualProps = [
        "background-color", "border", "border-radius", "box-shadow",
        "font-family", "font-size", "font-weight", "line-height",
        "letter-spacing", "text-align", "color", "padding"
      ];

      visualProps.forEach(prop => {
        if (rules[prop] !== undefined) {
          controlRules[prop] = rules[prop];
          delete rules[prop];
          if (layers.figmaIdRules[figmaIdSelector]) {
            delete layers.figmaIdRules[figmaIdSelector][prop];
          }
        }
      });

      controlRules["width"] = "100%";
      controlRules["outline"] = "none";
      controlRules["box-sizing"] = "border-box";
      controlRules["appearance"] = "none";
      controlRules["-webkit-appearance"] = "none";
      controlRules["-moz-appearance"] = "none";

      if (controlRules["padding"]) {
        const pads = controlRules["padding"].split(" ");
        if (pads.length === 4) {
          controlRules["padding"] = `0px ${pads[1]} 0px ${pads[3]}`;
        } else if (pads.length === 2) {
          controlRules["padding"] = `0px ${pads[1]}`;
        } else {
          controlRules["padding"] = `0px 16px`;
        }
      } else {
        controlRules["padding"] = "0px 16px";
      }

      const layout = node.layout || {};
      if (layout.height) {
        controlRules["height"] = `${layout.height}px`;
      } else if (rules["min-height"]) {
        controlRules["height"] = rules["min-height"];
      } else if (rules["flex-basis"]) {
        controlRules["height"] = rules["flex-basis"];
      }

      layers.figmaIdRules[controlSelector] = controlRules;
    }

    if (node.className) {
      const classNames = node.className.split(" ");
      const targetClass = classNames.length > 1 
         ? "." + (classNames.find(c => c.includes("--") || c !== classNames[0]) || classNames[classNames.length - 1])
         : "." + classNames[0];

      if (selectorExistsInGeneratedHtml(targetClass, activeSet)) {
        if (!layers.modifiers[targetClass]) {
          layers.modifiers[targetClass] = {};
        }
        Object.assign(layers.modifiers[targetClass], rules);
      }
    }
  }

  (node.children || []).forEach(child => extractCssRules(child, colorTokens, layers, activeSet, false, node, options));
}

function hasSelector(activeSet, selector) {
  return activeSet.has(selector);
}

function appendRule(lines, selector, rules, indentLevel = 1) {
  const pad = "  ".repeat(indentLevel);
  lines.push(`${pad}${selector} {`);
  Object.entries(rules).forEach(([prop, val]) => {
    lines.push(`${pad}  ${prop}: ${val};`);
  });
  lines.push(`${pad}}`);
}

function getNodeSelector(node) {
  if (!node || !node.className) return "";
  const classes = node.className.split(/\s+/).filter(Boolean);
  const preferred = classes.find((className) => className.includes("--")) || classes[0];
  return preferred ? `.${preferred}` : "";
}

function getVisualSortValue(node) {
  const layout = node && node.layout ? node.layout : {};
  const y = typeof layout.y === "number" ? layout.y : 0;
  const x = typeof layout.x === "number" ? layout.x : 0;
  return { x, y };
}

function isHeadingNode(node) {
  return ["h1", "h2", "h3"].includes(node && node.semanticTag);
}

function getRenderedChildrenOrder(children) {
  return [...children].sort((a, b) => {
    const aIsHeading = isHeadingNode(a);
    const bIsHeading = isHeadingNode(b);
    if (aIsHeading && !bIsHeading) return -1;
    if (!aIsHeading && bIsHeading) return 1;
    return 0;
  });
}

function getVisualChildrenOrder(children) {
  return [...children].sort((a, b) => {
    const aPos = getVisualSortValue(a);
    const bPos = getVisualSortValue(b);
    if (aPos.y !== bPos.y) return aPos.y - bPos.y;
    return aPos.x - bPos.x;
  });
}

function generateVisualOrderCss(structure, activeSelectors) {
  return "";
}

function generateResponsiveCss(activeSelectors, rootSelector = "") {
  const css = [];
  const hasRootSelector = rootSelector && selectorExistsInGeneratedHtml(rootSelector, activeSelectors);
  const contentSelector = hasRootSelector ? `${rootSelector} > :not(.sidebar)` : "";
  const rootWithSidebarSelector = hasRootSelector ? `${rootSelector}:has(> .sidebar)` : "";

  css.push("/* 6. Responsiveness */");

  // Desktop scaling media queries for fluid preview (Base 1920px)
  css.push("@media (min-width: 1441px) and (max-width: 1600px) {");
  css.push("  :root { zoom: 0.85; }");
  css.push("}");
  css.push("@media (min-width: 1201px) and (max-width: 1440px) {");
  css.push("  :root { zoom: 0.75; }");
  css.push("}");
  css.push("@media (min-width: 1025px) and (max-width: 1200px) {");
  css.push("  :root { zoom: 0.65; }");
  css.push("}");
  css.push("@media (min-width: 769px) and (max-width: 1024px) {");
  css.push("  :root { zoom: 0.55; }");
  css.push("}");
  css.push("@media (max-width: 768px) {");
  css.push("  :root { zoom: 1 !important; }");
  css.push("}");

  const tabletRules = [];
  
  const responsiveTargetSelector = [
    rootSelector,
    ".sidebar",
    ".main-content",
    ".container",
    ".wrapper",
    "[class*='card']",
    "[class*='form']",
    ".table-wrapper",
    ".table",
    "[class*='region']"
  ].filter(Boolean).join(", ");



  if (hasRootSelector && hasSelector(activeSelectors, ".sidebar")) {
    appendRule(tabletRules, rootWithSidebarSelector, {
      "flex-direction": "row; flex-direction: row !important"
    });
    appendRule(tabletRules, ".sidebar", {
      "width": "96px; width: 96px !important",
      "flex": "0 0 96px; flex: 0 0 96px !important"
    });
    appendRule(tabletRules, contentSelector, {
      "min-width": "0; min-width: 0 !important"
    });
  }
  if (hasSelector(activeSelectors, ".valores")) {
    appendRule(tabletRules, ".valores", {
      "grid-template-columns": "repeat(2, minmax(0, 1fr)); grid-template-columns: repeat(2, minmax(0, 1fr)) !important",
      "gap": "16px; gap: 16px !important"
    });
  }
  if (hasSelector(activeSelectors, ".campos")) {
    appendRule(tabletRules, ".campos", {
      "grid-template-columns": "repeat(2, minmax(0, 1fr)); grid-template-columns: repeat(2, minmax(0, 1fr)) !important"
    });
  }
  if (hasSelector(activeSelectors, ".movement-form")) {
    appendRule(tabletRules, ".movement-form", {
      "max-width": "100%; max-width: 100% !important"
    });
  }

  // Reduzir botões, fontes e gaps responsivamente em 1024px
  appendRule(tabletRules, "body", {
    "font-size": "15px; font-size: 15px !important"
  });
  if (hasSelector(activeSelectors, ".button")) {
    appendRule(tabletRules, ".button", {
      "padding": "0px 14px; padding: 0px 14px !important",
      "font-size": "14px; font-size: 14px !important",
      "height": "auto; height: auto !important",
      "min-height": "40px; min-height: 40px !important"
    });
  }
  if (hasSelector(activeSelectors, ".form-field")) {
    appendRule(tabletRules, ".form-field", {
      "gap": "4px; gap: 4px !important"
    });
  }

  if (tabletRules.length > 0) {
    css.push("@media (max-width: 1024px) {");
    css.push(...tabletRules);
    css.push("}");
    css.push("");
  }

  const mobileRules = [];

  appendRule(mobileRules, responsiveTargetSelector, {
    "width": "100%; width: 100% !important",
    "max-width": "100%; max-width: 100% !important",
    "min-height": "auto; min-height: auto !important",
    "height": "auto; height: auto !important"
  });

  if (hasRootSelector && hasSelector(activeSelectors, ".sidebar")) {
    appendRule(mobileRules, rootWithSidebarSelector, {
      "flex-direction": "column; flex-direction: column !important"
    });
    appendRule(mobileRules, ".sidebar", {
      "width": "100%; width: 100% !important",
      "flex": "0 0 auto; flex: 0 0 auto !important",
      "height": "auto; height: auto !important"
    });
    appendRule(mobileRules, ".sidebar-nav", {
      "flex-direction": "row; flex-direction: row !important",
      "overflow-x": "auto; overflow-x: auto !important"
    });
  }
  if (hasRootSelector) {
    appendRule(mobileRules, contentSelector, {
      "max-width": "100%; max-width: 100% !important"
    });
  }
  if (hasSelector(activeSelectors, ".valores")) {
    appendRule(mobileRules, ".valores", {
      "grid-template-columns": "1fr; grid-template-columns: 1fr !important",
      "gap": "12px; gap: 12px !important"
    });
  }
  if (hasSelector(activeSelectors, ".campos")) {
    appendRule(mobileRules, ".campos", {
      "grid-template-columns": "1fr; grid-template-columns: 1fr !important"
    });
  }
  if (hasSelector(activeSelectors, ".form-field")) {
    appendRule(mobileRules, ".form-field", {
      "width": "100%; width: 100% !important"
    });
  }
  if (hasSelector(activeSelectors, ".form-control")) {
    appendRule(mobileRules, ".form-control", {
      "width": "100%; width: 100% !important"
    });
  }
  if (hasSelector(activeSelectors, ".movement-form")) {
    appendRule(mobileRules, ".movement-form", {
      "gap": "16px; gap: 16px !important"
    });
  }
  
  if (hasSelector(activeSelectors, ".table-wrapper")) {
    appendRule(mobileRules, ".table-wrapper", {
      "overflow-x": "auto; overflow-x: auto !important",
      "-webkit-overflow-scrolling": "touch; -webkit-overflow-scrolling: touch !important"
    });
  }
  if (hasSelector(activeSelectors, ".table")) {
    appendRule(mobileRules, ".table", {
      "min-width": "640px; min-width: 640px !important",
      "width": "max-content; width: max-content !important"
    });
  }
  if (hasSelector(activeSelectors, ".data-grid")) {
    appendRule(mobileRules, ".data-grid", {
      "gap": "16px; gap: 16px !important"
    });
  }

  // Reduzir botões, fontes, gaps e controles responsivamente em 768px
  appendRule(mobileRules, "body", {
    "font-size": "14px; font-size: 14px !important"
  });
  if (hasSelector(activeSelectors, ".button")) {
    appendRule(mobileRules, ".button", {
      "padding": "0px 12px; padding: 0px 12px !important",
      "font-size": "13px; font-size: 13px !important",
      "height": "auto; height: auto !important",
      "min-height": "36px; min-height: 36px !important"
    });
  }
  if (hasSelector(activeSelectors, ".form-field")) {
    appendRule(mobileRules, ".form-field", {
      "gap": "2px; gap: 2px !important"
    });
  }
  appendRule(mobileRules, "[data-figma-id*='control']", {
    "height": "40px; height: 40px !important",
    "padding": "8px 12px; padding: 8px 12px !important",
    "font-size": "14px; font-size: 14px !important"
  });

  if (mobileRules.length > 0) {
    css.push("@media (max-width: 768px) {");
    css.push(...mobileRules);
    css.push("}");
    css.push("");
  }

  const smallMobileRules = [];

  appendRule(smallMobileRules, responsiveTargetSelector, {
    "width": "100%; width: 100% !important",
    "max-width": "100%; max-width: 100% !important",
    "min-height": "auto; min-height: auto !important",
    "height": "auto; height: auto !important"
  });

  if (hasRootSelector) {
    appendRule(smallMobileRules, contentSelector, {
      "max-width": "100%; max-width: 100% !important"
    });
  }
  if (hasSelector(activeSelectors, ".summary-card")) {
    appendRule(smallMobileRules, ".summary-card", {
      "max-width": "100%; max-width: 100% !important"
    });
  }
  if (hasSelector(activeSelectors, ".summary-card__value")) {
    appendRule(smallMobileRules, ".summary-card__value", {
      "font-size": "20px; font-size: 20px !important"
    });
  }
  if (hasSelector(activeSelectors, ".movement-form")) {
    appendRule(smallMobileRules, ".movement-form", {
      "max-width": "100%; max-width: 100% !important"
    });
  }

  // Reduzir botões, fontes e controles responsivamente em 480px
  appendRule(smallMobileRules, "body", {
    "font-size": "13px; font-size: 13px !important"
  });
  if (hasSelector(activeSelectors, ".button")) {
    appendRule(smallMobileRules, ".button", {
      "padding": "0px 10px; padding: 0px 10px !important",
      "font-size": "12px; font-size: 12px !important",
      "height": "auto; height: auto !important",
      "min-height": "32px; min-height: 32px !important"
    });
  }
  appendRule(smallMobileRules, "[data-figma-id*='control']", {
    "height": "36px; height: 36px !important",
    "padding": "6px 10px; padding: 6px 10px !important",
    "font-size": "13px; font-size: 13px !important"
  });

  if (smallMobileRules.length > 0) {
    css.push("@media (max-width: 480px) {");
    css.push(...smallMobileRules);
    css.push("}");
  }

  if (css.length === 1) {
    css.push("/* Sem regras responsivas detectadas */");
  }

  return css.join("\n");
}

function generateRootLayoutCss(activeSelectors, rootSelector = "", options = {}) {
  if (!rootSelector || !selectorExistsInGeneratedHtml(rootSelector, activeSelectors)) {
    return "";
  }

  const lines = ["/* 3. Layout */"];
  if (options.mode === "visual-first") {
    appendRule(lines, rootSelector, {
      "display": "flex",
      "flex-direction": "column"
    }, 0);
  } else {
    appendRule(lines, rootSelector, {
      "display": "flex",
      "flex-direction": "column",
      "width": "100%"
    }, 0);
  }

  if (hasSelector(activeSelectors, ".sidebar")) {
    if (options.mode === "visual-first") {
      appendRule(lines, `${rootSelector}:has(> .sidebar)`, {
        "flex-direction": "row"
      }, 0);
      appendRule(lines, `${rootSelector} > :not(.sidebar)`, {
        "display": "flex",
        "flex-direction": "column"
      }, 0);
    } else {
      appendRule(lines, `${rootSelector}:has(> .sidebar)`, {
        "flex-direction": "row"
      }, 0);
      appendRule(lines, `${rootSelector} > :not(.sidebar)`, {
        "flex": "1",
        "display": "flex",
        "flex-direction": "column",
        "overflow-y": "auto",
        "min-width": "0"
      }, 0);
    }
  }

  return lines.join("\n") + "\n\n";
}

function generateCss(structure, htmlString = "", options = { mode: "responsive" }) {
  if (!structure) {
    const error = new Error("Estrutura não informada para geração de CSS.");
    error.statusCode = 400;
    throw error;
  }

  if (!structure.isRefined) {
    const { injectSemanticClasses } = require("./htmlRefiner");
    injectSemanticClasses(structure, true, false);
  }

  if (!htmlString) {
     const { refineHtml } = require("./htmlRefiner");
     htmlString = refineHtml(structure).html;
  }

  const activeSelectors = new Set();
  collectActiveSelectorsFromHtml(htmlString, activeSelectors);
  const rootSelector = getRootSelectorFromHtml(htmlString);
  
  activeSelectors.add("*");
  activeSelectors.add("body");
  activeSelectors.add("html");

  const colorsObj = {};
  collectColors(structure, colorsObj);
  const colorTokens = generateColorTokens(colorsObj);

  const layers = {
    components: getBaseComponentRules(options),
    modifiers: {},
    figmaIdRules: {}
  };

  extractCssRules(structure, colorTokens, layers, activeSelectors, true, null, options);
  
  let cssString = "/* 1. Design Tokens */\n:root {\n";
  const usedVars = Object.values(colorTokens);
  
  const requiredTokens = [
    { name: "--color-primary", val: "#007BFF" },
    { name: "--color-surface", val: "#FFFFFF" },
    { name: "--color-surface-alt", val: "#F8FAFC" },
    { name: "--color-text", val: "#333333" },
    { name: "--color-text-secondary", val: "#64748B" },
    { name: "--color-border", val: "#E2E8F0" },
  ];
  
  requiredTokens.forEach(t => {
     if (!usedVars.includes(t.name)) {
        cssString += `  ${t.name}: ${t.val};\n`;
     }
  });

  if (Object.keys(colorTokens).length > 0) {
    Object.entries(colorTokens).forEach(([colorCss, varName]) => {
      cssString += `  ${varName}: ${colorCss};\n`;
    });
  }
  cssString += "}\n\n";

  cssString += "/* 2. Base & Resets */\n";
  cssString += `* {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}\n\n`;
  cssString += `body {\n  font-family: system-ui, -apple-system, sans-serif;\n  color: var(--color-text, #333);\n  background-color: var(--color-surface-alt, #F8FAFC);\n  line-height: 1.5;\n}\n\n`;

  cssString += generateRootLayoutCss(activeSelectors, rootSelector, options);
  cssString += generateVisualOrderCss(structure, activeSelectors);

  cssString += "/* 4. Components (Reusable Base) */\n";
  let hasComponents = false;
  Object.entries(layers.components).forEach(([selector, rules]) => {
    const selectors = selector.split(",").map(s => s.trim());
    const validSelectors = selectors.filter(s => selectorExistsInGeneratedHtml(s, activeSelectors));
    
    if (validSelectors.length > 0) {
      cssString += `${validSelectors.join(", ")} {\n`;
      Object.entries(rules).forEach(([prop, val]) => {
        cssString += `  ${prop}: ${val};\n`;
      });
      cssString += `}\n\n`;
      hasComponents = true;
    }
  });

  if (!hasComponents) cssString += "/* Sem componentes detectados */\n\n";

  cssString += "/* 5. States & Modifiers (Extracted from Figma) */\n";
  let hasModifiers = false;
  Object.entries(layers.modifiers).forEach(([selector, rules]) => {
    if (Object.keys(rules).length === 0) return;
    
    cssString += `${selector} {\n`;
    Object.entries(rules).forEach(([prop, val]) => {
      cssString += `  ${prop}: ${val};\n`;
    });
    cssString += `}\n\n`;
    hasModifiers = true;
  });
  
  if (!hasModifiers) cssString += "/* Sem modificadores específicos extraídos */\n\n";

  cssString += "/* 5.1. Specific Figma ID Rules (High Fidelity Overrides) */\n";
  let hasFigmaIdRules = false;
  Object.entries(layers.figmaIdRules).forEach(([selector, rules]) => {
    if (Object.keys(rules).length === 0) return;
    
    cssString += `${selector} {\n`;
    Object.entries(rules).forEach(([prop, val]) => {
      cssString += `  ${prop}: ${val};\n`;
    });
    cssString += `}\n\n`;
    hasFigmaIdRules = true;
  });
  
  if (!hasFigmaIdRules) cssString += "/* Sem overrides específicos de Figma ID */\n\n";

  if (options.mode === "visual-first") {
    cssString += "/* Modo Visual-First ativo: responsividade desativada */\n";
  } else {
    cssString += generateResponsiveCss(activeSelectors, rootSelector) + "\n";
  }

  return cssString.trim() + "\n";
}

module.exports = {
  generateCss,
  generateResponsiveCss,
};
