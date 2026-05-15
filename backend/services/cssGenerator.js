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

function getBaseComponentRules() {
  return {
    ".table-wrapper": {
      "width": "100%",
      "overflow-x": "auto",
      "border-radius": "8px",
      "box-shadow": "0 1px 3px rgba(0,0,0,0.1)",
      "background": "var(--color-surface, #FFF)"
    },
    ".table": {
      "width": "100%",
      "border-collapse": "collapse",
      "text-align": "left",
      "font-size": "14px"
    },
    ".table th, .table td": {
      "padding": "12px 16px",
      "border-bottom": "1px solid var(--color-border, #E2E8F0)",
      "color": "var(--color-text, #333)"
    },
    ".table th": {
      "font-weight": "600",
      "background-color": "var(--color-surface, #F8FAFC)"
    },
    ".table tbody tr:hover": {
      "background-color": "var(--color-surface, #F1F5F9)"
    },
    ".button": {
      "display": "inline-flex",
      "align-items": "center",
      "justify-content": "center",
      "padding": "8px 16px",
      "border-radius": "6px",
      "font-weight": "500",
      "font-size": "14px",
      "cursor": "pointer",
      "transition": "all 0.2s ease-in-out",
      "border": "none",
      "background-color": "var(--color-primary, #007BFF)",
      "color": "var(--color-surface, #FFF)" // Pode ser sobrescrito pelo state modifier
    },
    ".button:hover": {
      "opacity": "0.9",
      "transform": "translateY(-1px)"
    },
    ".button:active": {
      "transform": "translateY(0)"
    },
    ".button:disabled": {
      "opacity": "0.5",
      "cursor": "not-allowed"
    },
    ".form-control": {
      "width": "100%",
      "padding": "10px 12px",
      "border": "1px solid var(--color-border, #CBD5E1)",
      "border-radius": "6px",
      "font-size": "14px",
      "background-color": "var(--color-surface, #FFF)",
      "color": "var(--color-text, #333)",
      "transition": "border-color 0.2s"
    },
    ".form-control:focus": {
      "outline": "none",
      "border-color": "var(--color-primary, #007BFF)",
      "box-shadow": "0 0 0 3px rgba(0, 123, 255, 0.1)"
    },
    ".form-field": {
      "display": "flex",
      "flex-direction": "column",
      "gap": "6px",
      "width": "100%"
    },
    ".form-field label": {
      "font-size": "14px",
      "font-weight": "500",
      "color": "var(--color-text, #333)"
    },
    ".summary-card": {
      "background-color": "var(--color-surface, #FFF)",
      "border-radius": "8px",
      "padding": "24px",
      "box-shadow": "0 1px 3px rgba(0,0,0,0.1)",
      "display": "flex",
      "flex-direction": "column",
      "gap": "8px"
    },
    ".sidebar": {
      "background-color": "var(--color-surface, #FFF)",
      "border-right": "1px solid var(--color-border, #E2E8F0)",
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
    ".data-grid": {
      "display": "flex",
      "flex-direction": "column",
      "gap": "24px",
      "width": "100%"
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
      "background-color": "var(--color-surface-alt, #F1F5F9)",
      "padding": "4px",
      "border-radius": "8px",
      "gap": "4px"
    },
    ".summary-card__label": {
      "font-size": "14px",
      "color": "var(--color-text-secondary, #64748B)"
    },
    ".summary-card__value": {
      "font-size": "24px",
      "font-weight": "bold",
      "color": "var(--color-text, #333)"
    },
    ".table-wrapper": {
      "overflow-x": "auto",
      "width": "100%",
      "border": "1px solid var(--color-border, #E2E8F0)",
      "border-radius": "8px",
      "background-color": "var(--color-surface, #FFF)"
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
      "background-color": "var(--color-surface, #FFF)",
      "padding": "32px",
      "border-radius": "12px",
      "box-shadow": "0 1px 3px rgba(0,0,0,0.1)",
      "width": "100%",
      "max-width": "600px"
    },
    ".segmented-control__option": {
      "padding": "8px 16px",
      "border-radius": "6px",
      "font-weight": "500",
      "color": "var(--color-text-secondary, #64748B)",
      "cursor": "pointer",
      "transition": "all 0.2s"
    },
    ".segmented-control__option input:checked + span": {
      "color": "var(--color-text, #333)"
    },
    ".segmented-control__option:has(input:checked)": {
      "background-color": "var(--color-surface, #FFF)",
      "box-shadow": "0 1px 2px rgba(0,0,0,0.05)"
    },
    ".screen": {
      "display": "flex",
      "flex-direction": "column",
      "width": "100%",
      "min-height": "100vh"
    },
    ".screen:has(> .sidebar)": {
      "flex-direction": "row"
    },
    ".screen > :not(.sidebar)": {
      "flex": "1",
      "display": "flex",
      "flex-direction": "column",
      "padding": "32px",
      "gap": "24px",
      "overflow-y": "auto",
      "max-width": "1200px",
      "margin": "0 auto"
    },
    ".button-mostrar-mais": {
      "width": "100%",
      "background-color": "transparent",
      "border": "1px solid var(--color-border, #E2E8F0)",
      "color": "var(--color-primary, #007BFF)"
    },
    ".button-filtro": {
      "background-color": "var(--color-surface-alt, #F1F5F9)",
      "color": "var(--color-text, #333)"
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

function buildRules(node, colorTokens) {
  const rules = {};
  const layout = node.layout || {};
  const style = node.style || {};

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

  const isGeneric = node.className && GENERIC_CLASSES.some(g => node.className === g);
  
  if (layout.width && !isGeneric && !rules["display"]) {
     // Apenas aplicamos larguras fixas se for estritamente necessario e não for genérico
     if (node.semanticTag === "img" || (node.className && node.className.includes("icon"))) {
        rules["width"] = `${layout.width}px`;
        rules["height"] = `${layout.height}px`;
     }
  }

  const solidFill = (style.fills || []).find(f => f.type === "SOLID");
  if (solidFill) {
    const color = extractColorFromPaint(solidFill);
    if (color && color.css) {
      rules["background-color"] = colorTokens[color.css] ? `var(${colorTokens[color.css]})` : color.css;
    }
  }

  if (style.borderRadius && !isGeneric) {
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

  if (node.type === "text" && node.text) {
    const t = node.text;
    if (t.fontFamily) rules["font-family"] = `"${t.fontFamily}", sans-serif`;
    if (t.fontSize && !isGeneric) rules["font-size"] = `${t.fontSize}px`;
    if (t.fontWeight && !isGeneric) rules["font-weight"] = t.fontWeight;
    if (t.lineHeightPx && !isGeneric) rules["line-height"] = `${t.lineHeightPx}px`;
    if (t.textAlignHorizontal) {
      const map = { LEFT: "left", CENTER: "center", RIGHT: "right", JUSTIFIED: "justify" };
      if (map[t.textAlignHorizontal]) rules["text-align"] = map[t.textAlignHorizontal];
    }
    
    const textFill = (t.fills || []).find(f => f.type === "SOLID");
    if (textFill) {
      const color = extractColorFromPaint(textFill);
      if (color && color.css) {
        rules["color"] = colorTokens[color.css] ? `var(${colorTokens[color.css]})` : color.css;
      }
    }
  }

  // Handle specific overrides for button texts
  if (node.className && node.className.includes("button") && rules["background-color"]) {
     const bg = rules["background-color"];
     if (bg === "#FFFFFF" || bg === "var(--color-surface)") {
         rules["color"] = "var(--color-text, #333)"; // Prevents white on white
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
  // Simplificação: extrai as classes e tags do seletor. Se for descendente `.form-field input`,
  // garante que .form-field e input existam no conjunto ativo.
  const parts = selector.split(/[ :]+/).filter(Boolean); // split spaces, colons (like :hover)
  for (const part of parts) {
     if (part === "hover" || part === "active" || part === "disabled" || part === "focus") continue;
     if (part.startsWith(">") || part.startsWith("+") || part.startsWith("~")) continue;
     if (!activeSet.has(part)) {
         return false; // se alguma parte do seletor não existe na árvore, descarta.
     }
  }
  return true;
}

function extractCssRules(node, colorTokens, layers, activeSet) {
  if (!node) return;

  if (node.className) {
    const rules = buildRules(node, colorTokens);

    if (Object.keys(rules).length > 0) {
      const classNames = node.className.split(" ");
      const targetClass = classNames.length > 1 
         ? "." + (classNames.find(c => c.includes("--") || c !== classNames[0]) || classNames[classNames.length - 1])
         : "." + classNames[0];

      if (selectorExistsInHtml(targetClass, activeSet)) {
        if (!layers.modifiers[targetClass]) {
          layers.modifiers[targetClass] = {};
        }
        Object.assign(layers.modifiers[targetClass], rules);
      }
    }
  }

  (node.children || []).forEach(child => extractCssRules(child, colorTokens, layers, activeSet));
}

function generateCss(structure, htmlString = "") {
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
     // Geramos temporariamente para não perder o mapa de seletores caso
     // a API de CSS tenha sido chamada diretamente sem o HTML.
     htmlString = refineHtml(structure).html;
  }

  const activeSelectors = new Set();
  collectActiveSelectorsFromHtml(htmlString, activeSelectors);
  
  // Incluir html, body e seletores universais para o reset
  activeSelectors.add("*");
  activeSelectors.add("body");
  activeSelectors.add("html");

  const colorsObj = {};
  collectColors(structure, colorsObj);
  const colorTokens = generateColorTokens(colorsObj);

  const layers = {
    components: getBaseComponentRules(),
    modifiers: {}
  };

  extractCssRules(structure, colorTokens, layers, activeSelectors);
  
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

  // Layout layer removed hardcoded main-layout and content-area.

  cssString += "/* 3. Components (Reusable Base) */\n";
  let hasComponents = false;
  Object.entries(layers.components).forEach(([selector, rules]) => {
    // Only output if the base component exists in the HTML
    // We treat comma separated selectors by checking if ANY part exists
    const selectors = selector.split(",").map(s => s.trim());
    const validSelectors = selectors.filter(s => selectorExistsInHtml(s, activeSelectors));
    
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

  cssString += "/* 4. States & Modifiers (Extracted from Figma) */\n";
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

  cssString += "/* 5. Responsiveness */\n";
  cssString += `@media (max-width: 768px) {\n`;
  if (activeSelectors.has(".sidebar")) {
     cssString += `  .sidebar {\n    display: none; /* Add toggle logic in JS */\n  }\n`;
  }
  if (activeSelectors.has(".form-field")) {
     cssString += `  .form-field {\n    width: 100%;\n  }\n`;
  }
  cssString += `}\n`;

  return cssString.trim() + "\n";
}

module.exports = {
  generateCss,
};
