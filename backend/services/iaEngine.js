const { isFigmaHostname } = require("./figmaUrl");

class IaEngineError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "IaEngineError";
    this.statusCode = statusCode;
  }
}

// Seletores genéricos que NUNCA devem receber patches sem validação explícita
const GENERIC_BLOCKED_SELECTORS = new Set([
  "button", ".button", "th", "td", "tr", "label", "span", "input",
  "textarea", "select", ".form-field", ".table", ".summary-card",
  ".summary-value", ".summary-label", ".btn", "a", "p", "div",
]);

const MERGE_PATCH_PROPS = new Set([
  "background-color", "color", "border", "border-color", "border-width",
  "border-top", "border-bottom", "border-left", "border-right",
  "position", "left", "top", "right", "bottom", "z-index",
  "width", "height", "min-width", "min-height", "padding", "gap",
  "display", "align-items", "justify-content",
  "font-family", "font-size", "font-weight", "line-height", "text-align",
  "text-shadow", "outline",
]);

// The generated CSS already maps Figma geometry into semantic layout rules.
// Reapplying pixel geometry during merge collapses flow content such as forms and tables.
const SAFE_FIGMA_VISUAL_OVERLAY_PROPS = new Set([
  "background-color", "color", "border", "border-color", "border-width",
  "border-top", "border-bottom", "border-left", "border-right",
  "border-radius", "border-top-left-radius", "border-top-right-radius",
  "border-bottom-left-radius", "border-bottom-right-radius",
  "box-shadow", "text-shadow", "outline", "font-family", "font-weight", "text-align",
  "letter-spacing", "transition",
]);

function keepSafeFigmaVisualOverlayProps(props = {}) {
  return Object.fromEntries(
    Object.entries(props).filter(([prop]) => SAFE_FIGMA_VISUAL_OVERLAY_PROPS.has(prop))
  );
}

function figmaColorToCss(color, opacity = 1) {
  if (!color || typeof color !== "object") {
    return null;
  }

  const r = Math.round((color.r || 0) * 255);
  const g = Math.round((color.g || 0) * 255);
  const b = Math.round((color.b || 0) * 255);
  const a = color.a === undefined ? opacity : color.a * opacity;

  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})` : `rgb(${r}, ${g}, ${b})`;
}

function firstSolidPaint(paints = []) {
  return paints.find((paint) => paint && paint.visible !== false && paint.type === "SOLID") || null;
}

function extractFigmaIdsFromHtml(html) {
  return new Set([...String(html || "").matchAll(/data-figma-id="([^"]+)"/g)].map((match) => match[1]));
}

function walkFigmaNode(node, visitor, parent = null) {
  if (!node || typeof node !== "object") {
    return;
  }

  visitor(node, parent);

  for (const child of node.children || []) {
    walkFigmaNode(child, visitor, node);
  }
}

function buildFigmaMcpPatchesFromRawDocument(jsHtml, mcpContext) {
  const rawDocument = mcpContext?.properties?.rawDocument;
  if (!mcpContext?.available || !rawDocument) {
    return [];
  }

  const htmlFigmaIds = extractFigmaIdsFromHtml(jsHtml);
  const patches = [];

  walkFigmaNode(rawDocument, (node, parent) => {
    if (!node.id || !htmlFigmaIds.has(node.id)) {
      return;
    }

    const props = {};
    const box = node.absoluteBoundingBox || {};
    const parentBox = parent?.absoluteBoundingBox || null;
    const fill = firstSolidPaint(node.fills);
    const stroke = firstSolidPaint(node.strokes);
    const radius = node.cornerRadius ?? (Array.isArray(node.rectangleCornerRadii) ? node.rectangleCornerRadii[0] : null);

    if (Number.isFinite(box.width) && box.width > 0) {
      props.width = `${Math.round(box.width)}px`;
    }
    if (Number.isFinite(box.height) && box.height > 0) {
      props.height = `${Math.round(box.height)}px`;
    }

    if (parentBox && Number.isFinite(box.x) && Number.isFinite(box.y)) {
      props.position = "absolute";
      props.left = `${Math.round(box.x - parentBox.x)}px`;
      props.top = `${Math.round(box.y - parentBox.y)}px`;
    } else if (!parentBox) {
      props.position = "relative";
    }

    if ((node.children || []).length > 0 && !props.position) {
      props.position = "relative";
    }

    if (node.layoutMode === "HORIZONTAL" || node.layoutMode === "VERTICAL") {
      props.display = "flex";
      props["flex-direction"] = node.layoutMode === "HORIZONTAL" ? "row" : "column";
      if (Number.isFinite(node.itemSpacing)) props.gap = `${Math.round(node.itemSpacing)}px`;
      if (
        Number.isFinite(node.paddingTop) ||
        Number.isFinite(node.paddingRight) ||
        Number.isFinite(node.paddingBottom) ||
        Number.isFinite(node.paddingLeft)
      ) {
        props.padding = `${Math.round(node.paddingTop || 0)}px ${Math.round(node.paddingRight || 0)}px ${Math.round(node.paddingBottom || 0)}px ${Math.round(node.paddingLeft || 0)}px`;
      }
      const primaryMap = { MIN: "flex-start", CENTER: "center", MAX: "flex-end", SPACE_BETWEEN: "space-between" };
      const counterMap = { MIN: "flex-start", CENTER: "center", MAX: "flex-end", BASELINE: "baseline" };
      if (primaryMap[node.primaryAxisAlignItems]) props["justify-content"] = primaryMap[node.primaryAxisAlignItems];
      if (counterMap[node.counterAxisAlignItems]) props["align-items"] = counterMap[node.counterAxisAlignItems];
    }
    if (radius !== null && radius !== undefined) {
      props["border-radius"] = `${Array.isArray(radius) ? radius.join("px ") + "px" : radius + "px"}`;
    }

    if (fill) {
      const fillColor = figmaColorToCss(fill.color, fill.opacity ?? node.opacity ?? 1);
      if (fillColor) {
        props[node.type === "TEXT" ? "color" : "background-color"] = fillColor;
      }
    }

    if (stroke && node.type !== "TEXT") {
      const strokeColor = figmaColorToCss(stroke.color, stroke.opacity ?? node.opacity ?? 1);
      if (strokeColor) {
        props.border = `${node.strokeWeight || 1}px solid ${strokeColor}`;
      }
    }

    if (node.type === "TEXT" && node.style) {
      if (node.style.fontFamily) props["font-family"] = `"${node.style.fontFamily}", sans-serif`;
      if (node.style.fontSize) props["font-size"] = `${node.style.fontSize}px`;
      if (node.style.fontWeight) props["font-weight"] = String(node.style.fontWeight);
      if (node.style.lineHeightPx) props["line-height"] = `${node.style.lineHeightPx}px`;
      if (node.style.textAlignHorizontal) props["text-align"] = node.style.textAlignHorizontal.toLowerCase();
    }

    const shadows = (node.effects || [])
      .filter((effect) => effect && effect.visible !== false && effect.type === "DROP_SHADOW" && effect.color)
      .map((effect) => {
        const color = figmaColorToCss(effect.color, 1);
        const x = Math.round(effect.offset?.x || 0);
        const y = Math.round(effect.offset?.y || 0);
        const radius = Math.round(effect.radius || 0);
        const spread = Math.round(effect.spread || 0);
        return node.type === "TEXT"
          ? `${x}px ${y}px ${radius}px ${color}`
          : `${x}px ${y}px ${radius}px ${spread}px ${color}`;
      });
    if (shadows.length) {
      props[node.type === "TEXT" ? "text-shadow" : "box-shadow"] = shadows.join(", ");
    }

    const safeProps = keepSafeFigmaVisualOverlayProps(props);
    if (!Object.keys(safeProps).length) {
      return;
    }

    patches.push({
      selector: `[data-figma-id="${node.id}"]`,
      props: safeProps,
      source: "figma-mcp",
      origin: "figma-raw-document",
      reason: `Propriedades visuais reais extraidas do node Figma "${node.name || node.id}".`,
      confidence: 0.98,
      figmaId: node.id,
    });
  });

  return patches;
}

function colorObjectToCss(color) {
  if (!color || typeof color !== "object") return null;
  const r = Math.round(color.r || 0);
  const g = Math.round(color.g || 0);
  const b = Math.round(color.b || 0);
  const a = color.a === undefined ? 1 : color.a;
  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${Number(a.toFixed(3))})` : `rgb(${r}, ${g}, ${b})`;
}

function walkNormalizedNode(node, visitor, parent = null) {
  if (!node || typeof node !== "object") return;
  visitor(node, parent);
  for (const child of node.children || []) {
    walkNormalizedNode(child, visitor, node);
  }
}

function buildFigmaMcpPatchesFromNormalizedStructure(jsHtml, mcpContext) {
  const structure = mcpContext?.normalizedStructure || mcpContext?.properties?.normalizedStructure;
  if (!structure) {
    return [];
  }

  const htmlFigmaIds = extractFigmaIdsFromHtml(jsHtml);
  const patches = [];

  walkNormalizedNode(structure, (node, parent) => {
    if (!node.id || !htmlFigmaIds.has(node.id)) return;

    const layout = node.layout || {};
    const parentLayout = parent?.layout || null;
    const style = node.style || {};
    const text = node.text || null;
    const props = { "box-sizing": "border-box" };

    if (Number.isFinite(layout.width)) props.width = `${Math.round(layout.width)}px`;
    if (Number.isFinite(layout.height)) props.height = `${Math.round(layout.height)}px`;

    if (parentLayout && Number.isFinite(layout.x) && Number.isFinite(layout.y) && Number.isFinite(parentLayout.x) && Number.isFinite(parentLayout.y)) {
      props.position = "absolute";
      props.left = `${Math.round(layout.x - parentLayout.x)}px`;
      props.top = `${Math.round(layout.y - parentLayout.y)}px`;
    } else {
      props.position = "relative";
      props.overflow = "hidden";
    }

    if (layout.layoutMode === "HORIZONTAL" || layout.layoutMode === "VERTICAL") {
      props.display = "flex";
      props["flex-direction"] = layout.layoutMode === "HORIZONTAL" ? "row" : "column";
      if (Number.isFinite(layout.itemSpacing)) props.gap = `${Math.round(layout.itemSpacing)}px`;
      if (
        Number.isFinite(layout.paddingTop) ||
        Number.isFinite(layout.paddingRight) ||
        Number.isFinite(layout.paddingBottom) ||
        Number.isFinite(layout.paddingLeft)
      ) {
        props.padding = `${Math.round(layout.paddingTop || 0)}px ${Math.round(layout.paddingRight || 0)}px ${Math.round(layout.paddingBottom || 0)}px ${Math.round(layout.paddingLeft || 0)}px`;
      }
    }

    if (style.borderRadius) props["border-radius"] = `${style.borderRadius}px`;
    if (style.fill && node.type !== "text") {
      const fill = colorObjectToCss(style.fill);
      if (fill) props["background-color"] = fill;
    }
    if (style.stroke && style.strokeWeight && node.type !== "text") {
      const stroke = colorObjectToCss(style.stroke);
      if (stroke) props.border = `${style.strokeWeight}px solid ${stroke}`;
    }

    if (text) {
      if (text.fontFamily) props["font-family"] = `"${text.fontFamily}", sans-serif`;
      if (text.fontSize) props["font-size"] = `${text.fontSize}px`;
      if (text.fontWeight) props["font-weight"] = String(text.fontWeight);
      if (text.lineHeightPx) props["line-height"] = `${text.lineHeightPx}px`;
      if (text.letterSpacing) props["letter-spacing"] = `${text.letterSpacing}px`;
      if (text.textAlignHorizontal) props["text-align"] = text.textAlignHorizontal.toLowerCase();
      const textFill = text.fills?.find((fill) => fill.type === "SOLID" && fill.color)?.color || style.fill;
      const textColor = colorObjectToCss(textFill);
      if (textColor) props.color = textColor;
    }

    const safeProps = keepSafeFigmaVisualOverlayProps(props);
    if (!Object.keys(safeProps).length) {
      return;
    }

    patches.push({
      selector: `[data-figma-id="${node.id}"]`,
      props: safeProps,
      source: "figma-mcp",
      origin: "figma-normalized-structure",
      reason: `Camada visual deterministica da arvore normalizada Figma para "${node.name || node.id}".`,
      confidence: 0.99,
      figmaId: node.id,
    });
  });

  return patches;
}

function parseCssRules(cssText) {
  const rules = {};
  const cleaned = String(cssText || "").replace(/\/\*[\s\S]*?\*\//g, "");
  const re = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = re.exec(cleaned)) !== null) {
    const selector = match[1].trim();
    const declarations = {};

    for (const rawDeclaration of match[2].split(";")) {
      const declaration = rawDeclaration.trim();
      const separator = declaration.indexOf(":");
      if (separator === -1) continue;
      declarations[declaration.slice(0, separator).trim()] = declaration.slice(separator + 1).trim();
    }

    if (selector) rules[selector] = declarations;
  }

  return rules;
}

/**
 * Extrai todas as classes e seletores usados em um trecho de HTML.
 * Retorna um Set de strings como ".nome-da-classe" e "tag".
 */
function extractSelectorsFromHtml(html) {
  const found = new Set();
  // Classes
  const classRegex = /class="([^"]+)"/g;
  let m;
  while ((m = classRegex.exec(html)) !== null) {
    for (const cls of m[1].split(/\s+/)) {
      if (cls.trim()) found.add("." + cls.trim());
    }
  }
  // Tags semânticas
  const tagRegex = /<([a-z][a-z0-9]*)\b/gi;
  while ((m = tagRegex.exec(html)) !== null) {
    found.add(m[1].toLowerCase());
  }
  return found;
}

function parseIaJson(rawText) {
  const text = String(rawText || "").trim();

  try {
    return JSON.parse(text);
  } catch (_error) {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) {
      return JSON.parse(fenced[1].trim());
    }

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(text.slice(firstBrace, lastBrace + 1));
    }

    throw _error;
  }
}

function normalizeAiVisualRefinementPatch(patch = {}) {
  const claimedFigmaSource = patch.source === "figma-mcp";
  const sourceNote = claimedFigmaSource
    ? " Sugestao guiada por contexto Figma da IA; valores Figma deterministicos continuam prioritarios."
    : "";

  return {
    ...patch,
    source: "ai-visual-refinement",
    origin: claimedFigmaSource ? "ai-figma-guided" : "ai-visual-refinement",
    reason: `${patch.reason || "Refinamento visual proposto pela IA."}${sourceNote}`,
  };
}

async function improveWithRealIa(prompt, html, css, mcpContext, apiKey) {
  const fetchImpl = globalThis.fetch || fetch;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const systemInstruction = `
    Você é um Engenheiro Frontend Especialista em transformar layouts do Figma em HTML/CSS responsivo e visualmente cuidado.
    Você receberá um HTML base determinístico (gerado por parser local), a folha de estilo CSS correspondente, e informações de contexto visual extraídas via MCP do Figma.
    
    Sua tarefa é retornar APENAS um JSON com dois campos:
    - "html": o HTML original com os atributos data-figma-id preservados intactos (pode ajustar classes se necessário).
    - "patches": array de objetos de patch seletivos para melhorar o CSS, cada um com:
        { "selector": string, "props": { [prop]: value }, "source": "ai-visual-refinement", "reason": string, "confidence": 0.0..1.0, "figmaId": string opcional }
    
    REGRAS OBRIGATÓRIAS:
    1. NÃO retorne um bloco CSS completo. Retorne somente patches.
    2. Patches só podem usar seletores que EXISTAM no HTML fornecido. Prefira [data-figma-id="N:M"] para um elemento especifico.
    3. NUNCA crie patches para seletores genéricos como: button, th, td, tr, label, span, input, textarea, select, .form-field, .table, .summary-card, a menos que eles apareçam explicitamente como classes no HTML.
    4. Preserve TODOS os atributos data-figma-id.
    5. Propriedades permitidas nos patches: border-radius, box-shadow, text-shadow, border, border-color, background-color, color, font-family, font-size, font-weight, line-height, letter-spacing, padding, gap, transition, outline.
    6. Busque uma tela web responsiva, bonita e legivel: use o Figma/API, a arvore normalizada, o HTML e o CSS como evidencia para recuperar acabamento visual perdido pelo parser sem forcar geometria literal quebrada.
    7. Nao aplique tema generico nem patches globais. Refinamentos esteticos devem ser especificos, rastreaveis e coerentes com o frame.
    8. Nao use box-shadow ou border de caixa para simular efeito que pertence a letras; para sombra textual prefira text-shadow.
    9. Nenhum elemento pode exceder o parent no layout responsivo; contenha divs, textos, imagens, tabelas, formularios e controles dentro do container.
    10. Preserve a direcao estrutural extraida; nao inverta flex-direction row/column para adaptar breakpoint.
    11. Retorne APENAS um JSON válido: {"html": "...", "patches": [...]}
  `;

  const userMessage = `
    Prompt de Instrução:
    ${prompt}

    HTML Base:
    \`\`\`html
    ${html}
    \`\`\`

    CSS Base:
    \`\`\`css
    ${css}
    \`\`\`

    Contexto Figma/API:
    \`\`\`json
    ${JSON.stringify(mcpContext || { available: false }).slice(0, 12000)}
    \`\`\`
  `;

  try {
    const response = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Chamada de API falhou: Status ${response.status}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("Resposta de IA vazia.");

    const parsed = parseIaJson(rawText);
    if (!parsed.html || !Array.isArray(parsed.patches)) {
      throw new Error("Campos 'html' ou 'patches' ausentes no JSON de resposta.");
    }
    return {
      html: parsed.html,
      css,            // CSS base preservado — patches serão aplicados no merge
      patches: parsed.patches.map(normalizeAiVisualRefinementPatch),
      source: "gemini-api",
    };
  } catch (error) {
    throw new IaEngineError(`Erro na geracao IA Real: ${error.message}`);
  }
}

/**
 * Gerador determinístico de patches.
 * Emite patches seletivos SOMENTE para seletores encontrados no HTML.
 * Nunca adiciona CSS global ou regras genéricas.
 */
function improveWithDeterministicIa(html, css, mcpContext, mode) {
  const htmlSelectors = extractSelectorsFromHtml(html);
  const patches = [];

  // 1. Patches para containers/cards encontrados no HTML
  const cardClasses = [...htmlSelectors].filter(s =>
    s.startsWith(".") && /card|container|panel|shell|workspace/.test(s) &&
    !GENERIC_BLOCKED_SELECTORS.has(s)
  );
  for (const sel of cardClasses) {
    patches.push({
      selector: sel,
      props: {
        "border-radius": "12px",
        "box-shadow": "0 8px 30px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.02)",
        "border": "1px solid #eef2f6",
      },
      source: "ia-inference",
      reason: "Estilo cosmético premium para container/card detectado no HTML.",
      confidence: 0.72,
    });
  }

  // 2. Patches para botões com classe específica encontrada no HTML
  const btnClasses = [...htmlSelectors].filter(s =>
    s.startsWith(".") && /btn-|button-|submit-|action-/.test(s) &&
    !GENERIC_BLOCKED_SELECTORS.has(s)
  );
  for (const sel of btnClasses) {
    patches.push({
      selector: sel,
      props: {
        "border-radius": "8px",
        "transition": "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "letter-spacing": "0.025em",
      },
      source: "ia-inference",
      reason: "Refinamento cosmético de botão com classe específica encontrada no HTML.",
      confidence: 0.68,
    });
  }

  // 3. Patches via contexto MCP real (alta confiança)
  if (mcpContext && mcpContext.available && mcpContext.properties) {
    const props = mcpContext.properties;

    // Aplicar radius e shadow MCP apenas em classes de card/container encontradas no HTML
    for (const sel of cardClasses) {
      if (props.cornerRadius) {
        patches.push({
          selector: sel,
          props: { "border-radius": `${props.cornerRadius}px` },
          source: "figma-mcp",
          reason: `cornerRadius=${props.cornerRadius} extraído do contexto Figma/MCP para '${props.name}'.`,
          confidence: 0.95,
        });
      }
      if (props.boxShadow) {
        patches.push({
          selector: sel,
          props: { "box-shadow": props.boxShadow },
          source: "figma-mcp",
          reason: `boxShadow extraído do contexto Figma/MCP para '${props.name}'.`,
          confidence: 0.95,
        });
      }
    }
  }

  return {
    html,             // HTML preservado intacto
    css,              // CSS base preservado — patches serão aplicados no merge
    patches,
    source: "deterministic-ia-visual-enhancer",
  };
}

function generateCandidateDiffPatches(jsHtml, jsCss, iaCss) {
  const htmlSelectors = extractSelectorsFromHtml(jsHtml);
  const baseRules = parseCssRules(jsCss);
  const candidateRules = parseCssRules(iaCss);
  const patches = [];

  for (const [selector, candidateProps] of Object.entries(candidateRules)) {
    if (!htmlSelectors.has(selector) || GENERIC_BLOCKED_SELECTORS.has(selector)) {
      continue;
    }

    const baseProps = baseRules[selector] || {};
    const props = {};

    for (const [prop, value] of Object.entries(candidateProps)) {
      if (!MERGE_PATCH_PROPS.has(prop)) continue;
      if (String(baseProps[prop] || "").trim() === String(value || "").trim()) continue;
      props[prop] = value;
    }

    if (Object.keys(props).length) {
      patches.push({
        selector,
        props,
        source: "ai-merge-agent",
        reason: "Diferenca visual real entre CSS base JS e CSS candidato IA/MCP.",
        confidence: 0.72,
      });
    }
  }

  return patches;
}

function normalizeAiMergePatch(p, figmaIdMap) {
  return {
    ...p,
    figmaId: p.figmaId || figmaIdMap[p.selector] || null,
    source: p.source === "figma-mcp" ? "ai-merge-agent" : (p.source || "ai-merge-agent"),
    origin: p.source === "figma-mcp" ? "ai-claimed-figma" : (p.origin || "ai-merge-agent"),
    reason: p.source === "figma-mcp"
      ? `${p.reason || ""} Origem rebaixada: apenas patches extraidos do rawDocument real podem usar source=figma-mcp.`
      : p.reason,
  };
}

function dedupePatchesPreferRawFigma(patches) {
  const priority = (patch) => {
    if (patch.origin === "figma-raw-document") return 4;
    if (patch.origin === "figma-normalized-structure") return 3.8;
    if (patch.source === "figma-mcp") return 3;
    if (patch.source === "ai-merge-agent") return 2;
    return 1;
  };
  const map = new Map();

  for (const patch of patches) {
    for (const prop of Object.keys(patch.props || {})) {
      const key = `${patch.selector}||${prop}`;
      const single = { ...patch, props: { [prop]: patch.props[prop] } };
      const existing = map.get(key);
      if (!existing || priority(single) >= priority(existing)) {
        map.set(key, single);
      }
    }
  }

  return [...map.values()];
}

async function improveCode(prompt, html, css, mcpContext, mode, apiKey) {
  let fallbackReason = null;

  if (apiKey) {
    try {
      return await improveWithRealIa(prompt, html, css, mcpContext, apiKey);
    } catch (e) {
      fallbackReason = e.message;
      // Fallback to deterministic AI refiner if API fails
    }
  }

  return {
    ...improveWithDeterministicIa(html, css, mcpContext, mode),
    fallbackReason,
  };
}

/**
 * AI Merge Agent (RF11.2).
 * Compara HTML/CSS base JS com candidato IA/MCP e retorna patches seletivos.
 * Nunca retorna HTML ou CSS livres. Prefere [data-figma-id] sobre classes genéricas.
 * Fallback determinístico se API indisponível.
 */
async function generateMergePatches({ jsHtml, jsCss, iaHtml, iaCss, mcpContext, apiKey }) {
  const htmlSelectors = extractSelectorsFromHtml(jsHtml);
  const figmaMcpPatches = buildFigmaMcpPatchesFromRawDocument(jsHtml, mcpContext);
  const normalizedStructurePatches = buildFigmaMcpPatchesFromNormalizedStructure(jsHtml, mcpContext);

  // Mapa classe → figmaId para preferência de seletor
  const figmaIdMap = {};
  const reClassFirst = /class="([^"]+)"[^>]*data-figma-id="([^"]+)"/g;
  const reIdFirst    = /data-figma-id="([^"]+)"[^>]*class="([^"]+)"/g;
  let m;
  while ((m = reClassFirst.exec(jsHtml)) !== null) {
    for (const cls of m[1].split(/\s+/)) {
      if (cls.trim()) figmaIdMap["." + cls.trim()] = m[2];
    }
  }
  while ((m = reIdFirst.exec(jsHtml)) !== null) {
    for (const cls of m[2].split(/\s+/)) {
      if (cls.trim()) figmaIdMap["." + cls.trim()] = m[1];
    }
  }

  if (apiKey) {
    try {
      const fetchImpl = globalThis.fetch || fetch;
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const systemInstruction = `
        Você é o AI Merge Agent do Figma Creator (RF11.2).
        Compare a versão HTML/CSS determinística (base JS) com a candidata IA/MCP e retorne patches CSS seletivos.
        REGRAS ABSOLUTAS:
        1. Retorne APENAS JSON válido: { "patches": [...] }. Nunca retorne HTML ou CSS livres.
        2. Cada patch: { "selector", "props", "source", "reason", "confidence", "figmaId" (opcional) }.
        3. selector deve existir no HTML base JS (classes, IDs ou tags presentes).
        4. Prefira [data-figma-id="N:M"] quando o elemento tiver data-figma-id.
        5. NUNCA crie patches para: button, th, td, tr, label, span, input, textarea, select,
           .form-field, .table, .summary-card, .summary-value, .summary-label, a, p, div,
           a menos que essas classes estejam explicitamente no HTML base.
        6. Não invente estilos. Use valores do contexto Figma/MCP ou do CSS candidato.
        6.1. box-shadow, text-shadow, transition, border-radius e letter-spacing só podem ser retornados quando source="figma-mcp".
        6.2. Rejeite embelezamentos genéricos. Prefira diferenças reais entre CSS base e CSS candidato.
        6.3. Nenhum patch pode fazer um elemento exceder seu parent no layout responsivo.
        6.4. Nao retorne patch de flex-direction para inverter row/column extraida.
        7. source: "figma-mcp" para valores do contexto Figma, "ai-merge-agent" para inferência comparativa.
        8. Propriedades permitidas: width, height, padding, gap, border-radius, box-shadow, text-shadow, border,
           border-color, background-color, color, font-size, font-weight, line-height, text-align,
           letter-spacing, transition, outline.
        9. confidence: 0.0–1.0. Prefira ≥0.7 para figma-mcp e ≥0.5 para ai-merge-agent.
      `;

      const userMessage = `
        HTML Base JS (base estrutural — preservar):
        ${jsHtml.slice(0, 4000)}

        CSS Base JS:
        ${jsCss.slice(0, 2000)}

        HTML Candidato IA/MCP (referência visual):
        ${(iaHtml || "").slice(0, 4000)}

        CSS Candidato IA/MCP (referência visual):
        ${(iaCss || "").slice(0, 2000)}

        Contexto Figma/MCP: ${JSON.stringify(mcpContext || {})}
      `;

      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userMessage }] }],
          systemInstruction: { parts: [{ text: systemInstruction }] },
          generationConfig: { responseMimeType: "application/json", temperature: 0.05 },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText.trim());
          if (Array.isArray(parsed.patches)) {
            const aiPatches = parsed.patches.map(p => normalizeAiMergePatch(p, figmaIdMap));
            return dedupePatchesPreferRawFigma([...aiPatches, ...figmaMcpPatches, ...normalizedStructurePatches]);
          }
        }
      }
    } catch (_e) {
      // Fallback to deterministic
    }
  }

  const candidateDiffPatches = generateCandidateDiffPatches(jsHtml, jsCss, iaCss || "");
  const mcpPatches = improveWithDeterministicIa(jsHtml, jsCss, mcpContext || { available: false }, "responsive")
    .patches
    .filter((patch) => patch.source === "figma-mcp");

  return dedupePatchesPreferRawFigma([...candidateDiffPatches, ...mcpPatches, ...figmaMcpPatches, ...normalizedStructurePatches].map(p => ({
    ...p,
    figmaId: p.figmaId || figmaIdMap[p.selector] || null,
    source: p.source || "ai-merge-agent",
  })));
}

module.exports = {
  IaEngineError,
  improveCode,
  generateMergePatches,
  extractSelectorsFromHtml,
  GENERIC_BLOCKED_SELECTORS,
};
