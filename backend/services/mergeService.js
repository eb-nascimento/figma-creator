const { saveConsolidated } = require("./candidateStore");
const { generateMergePatches } = require("./iaEngine");

// Propriedades CSS cosméticas permitidas em patches
const ALLOWED_PATCH_PROPS = new Set([
  "display", "position", "top", "right", "bottom", "left", "z-index",
  "width", "min-width", "max-width", "height", "min-height", "max-height",
  "box-sizing", "overflow",
  "margin", "margin-top", "margin-right", "margin-bottom", "margin-left",
  "padding", "padding-top", "padding-right", "padding-bottom", "padding-left",
  "gap", "row-gap", "column-gap", "justify-content", "align-items",
  "align-content", "justify-items", "flex", "flex-wrap",
  "grid-template-columns", "grid-template-rows", "grid-template-areas",
  "grid-column", "grid-row", "order",
  "border-radius", "border-top-left-radius", "border-top-right-radius",
  "border-bottom-left-radius", "border-bottom-right-radius",
  "box-shadow", "text-shadow", "outline", "border", "border-top", "border-bottom",
  "border-left", "border-right", "border-color", "border-width",
  "background", "background-color", "color", "font-size", "font-family",
  "font-weight", "line-height", "text-align", "letter-spacing", "transition",
]);

const FIGMA_ONLY_PROPS = new Set([
  "border-radius", "border-top-left-radius", "border-top-right-radius",
  "border-bottom-left-radius", "border-bottom-right-radius",
  "box-shadow", "text-shadow", "letter-spacing", "transition", "outline",
]);

const MIN_AI_VISUAL_REFINEMENT_CONFIDENCE = 0.65;

// Seletores genéricos bloqueados — nunca recebem patch sem validação explícita
const BLOCKED_SELECTORS = new Set([
  "button", ".button", ".btn", "th", "td", "tr", "label", "span",
  "input", "textarea", "select", ".form-field", ".table", ".summary-card",
  ".summary-value", ".summary-label", "a", "p", "div", "h1", "h2", "h3",
  "h4", "h5", "h6", "ul", "ol", "li", "form", "section", "article", "nav",
  "header", "footer", "main", "aside",
]);

class MergeServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "MergeServiceError";
    this.statusCode = statusCode;
  }
}

// Extrai todas as classes (.xxx) e tags presentes no HTML
function extractSelectorsFromHtml(html) {
  const found = new Set();
  const classRe = /class="([^"]+)"/g;
  let m;
  while ((m = classRe.exec(html)) !== null) {
    for (const cls of m[1].split(/\s+/)) {
      if (cls.trim()) found.add("." + cls.trim());
    }
  }
  const tagRe = /<([a-z][a-z0-9]*)\b/gi;
  while ((m = tagRe.exec(html)) !== null) found.add(m[1].toLowerCase());

  const figmaIdRe = /data-figma-id="([^"]+)"/g;
  while ((m = figmaIdRe.exec(html)) !== null) {
    found.add(`[data-figma-id="${m[1]}"]`);
  }

  return found;
}

function extractClassToFigmaIds(html) {
  const result = new Map();
  const elementRe = /<([a-z][a-z0-9]*)\b([^>]*)>/gi;
  let match;

  while ((match = elementRe.exec(html)) !== null) {
    const attrs = match[2] || "";
    const classMatch = attrs.match(/class="([^"]+)"/);
    const figmaMatch = attrs.match(/data-figma-id="([^"]+)"/);

    if (!classMatch || !figmaMatch) continue;

    for (const cls of classMatch[1].split(/\s+/).filter(Boolean)) {
      if (!result.has(cls)) {
        result.set(cls, new Set());
      }
      result.get(cls).add(figmaMatch[1]);
    }
  }

  return result;
}

// Parser CSS simples: selector → { prop: value }
function parseCssRules(cssText) {
  const rules = {};
  const cleaned = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const re = /([^{]+)\{([^}]+)\}/g;
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    const selector = m[1].trim();
    const block = m[2].trim();
    const decls = {};
    for (const dec of block.split(";")) {
      const d = dec.trim();
      if (!d) continue;
      const idx = d.indexOf(":");
      if (idx === -1) continue;
      decls[d.slice(0, idx).trim()] = d.slice(idx + 1).trim();
    }
    rules[selector] = decls;
  }
  return rules;
}

function parseCssRuleList(cssText) {
  const rules = [];
  const cleaned = cssText.replace(/\/\*[\s\S]*?\*\//g, "");
  const re = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = re.exec(cleaned)) !== null) {
    const selector = match[1].trim();
    const decls = {};

    for (const dec of match[2].trim().split(";")) {
      const d = dec.trim();
      if (!d) continue;
      const idx = d.indexOf(":");
      if (idx === -1) continue;
      decls[d.slice(0, idx).trim()] = d.slice(idx + 1).trim();
    }

    rules.push({ selector, decls });
  }

  return rules;
}

function stringifyCssRules(rules) {
  let out = "";
  for (const sel of Object.keys(rules)) {
    const decls = rules[sel];
    if (!Object.keys(decls).length) continue;
    out += `${sel} {\n`;
    for (const [p, v] of Object.entries(decls)) out += `  ${p}: ${v};\n`;
    out += "}\n\n";
  }
  return out.trim();
}

function normalizeCssValue(value) {
  return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function selectorMatchesTarget(ruleSelector, targetSelector) {
  const selectors = ruleSelector.split(",").map((selector) => selector.trim());

  return selectors.some((selector) => {
    if (selector === targetSelector) return true;

    if (targetSelector.startsWith("[data-figma-id=")) {
      return selector.includes(targetSelector);
    }

    if (targetSelector.startsWith(".")) {
      return selector.split(/\s+|>|\+|~/).some((part) => part === targetSelector);
    }

    return selector === targetSelector;
  });
}

function getEffectiveValue(ruleList, selector, prop) {
  let value;

  for (const rule of ruleList) {
    if (selectorMatchesTarget(rule.selector, selector) && rule.decls[prop] !== undefined) {
      value = rule.decls[prop];
    }
  }

  return value;
}

function buildAppliedPatchCss(appliedPatches) {
  if (!appliedPatches.length) {
    return "";
  }

  const grouped = new Map();

  for (const patch of appliedPatches) {
    if (!grouped.has(patch.selector)) {
      grouped.set(patch.selector, {});
    }
    Object.assign(grouped.get(patch.selector), patch.props);
  }

  let out = "/* AI/MCP Applied Patches */\n";
  for (const [selector, props] of grouped.entries()) {
    out += `${selector} {\n`;
    for (const [prop, value] of Object.entries(props)) {
      out += `  ${prop}: ${value};\n`;
    }
    out += "}\n\n";
  }

  return out.trim();
}

function extractCssClassesFromSelectors(cssText) {
  const classes = new Set();
  const classRe = /\.([a-zA-Z_-][a-zA-Z0-9_-]*)/g;

  for (const rule of parseCssRuleList(cssText)) {
    let match;
    while ((match = classRe.exec(rule.selector)) !== null) {
      classes.add(match[1]);
    }
  }

  return classes;
}

function summarizeCssDiff(baseRules, mergedRules) {
  const summary = {
    changedDeclarations: [],
    addedRules: [],
    changedRules: 0,
  };

  for (const [selector, mergedProps] of Object.entries(mergedRules)) {
    const baseProps = baseRules[selector] || {};
    const selectorChanges = [];

    if (!baseRules[selector]) {
      summary.addedRules.push(selector);
    }

    for (const [prop, after] of Object.entries(mergedProps)) {
      const before = baseProps[prop];
      if (normalizeCssValue(before) !== normalizeCssValue(after)) {
        selectorChanges.push({ selector, prop, before: before || null, after });
      }
    }

    if (selectorChanges.length) {
      summary.changedRules += 1;
      summary.changedDeclarations.push(...selectorChanges);
    }
  }

  return summary;
}

/**
 * Constrói relatório textual legível a partir do objeto report.
 */
function buildReportText(report) {
  const lines = ["=== RELATÓRIO DE MERGE HÍBRIDO (RF11.2) ===\n"];

  lines.push(`✅ Patches ACEITOS (${report.accepted.length}):`);
  if (report.accepted.length === 0) {
    lines.push("  (nenhum patch aceito)");
  } else {
    for (const p of report.accepted) {
      const props = Object.keys(p.props).join(", ");
      lines.push(`  [${p.source}] ${p.selector} → ${props} (confiança: ${(p.confidence * 100).toFixed(0)}%)`);
      lines.push(`    Motivo: ${p.reason}`);
    }
  }

  lines.push(`\n❌ Patches REJEITADOS (${report.rejected.length}):`);
  if (report.rejected.length === 0) {
    lines.push("  (nenhum patch rejeitado)");
  } else {
    for (const p of report.rejected) {
      lines.push(`  [${p.source}] ${p.selector} → Motivo: ${p.reason}`);
    }
  }

  lines.push(`\nPatches ACEITOS SEM EFEITO VISUAL (${report.acceptedNoEffect.length}):`);
  if (report.acceptedNoEffect.length === 0) {
    lines.push("  (nenhum patch aceito sem efeito)");
  } else {
    for (const p of report.acceptedNoEffect) {
      const props = Object.keys(p.props || {}).join(", ");
      lines.push(`  [${p.source}] ${p.selector} -> ${props} Motivo: ${p.reason}`);
    }
  }

  lines.push(`\n⚠️  CONFLITOS resolvidos (${report.conflicts.length}):`);
  if (report.conflicts.length === 0) {
    lines.push("  (nenhum conflito)");
  } else {
    for (const c of report.conflicts) {
      lines.push(`  ${c.selector}.${c.prop}: "${c.winner}" prevaleceu sobre "${c.loser}" (regra: ${c.rule})`);
    }
  }

  lines.push(`\n🔍 VALIDAÇÕES PÓS-MERGE:`);
  for (const v of report.validations) lines.push(`  ${v}`);

  lines.push(`\n📌 DIFERENÇAS REAIS NO CSS CONSOLIDADO (${report.diffSummary.changedDeclarations.length}):`);
  if (report.diffSummary.changedDeclarations.length === 0) {
    lines.push("  nenhum patch visual relevante foi aplicado");
  } else {
    for (const change of report.diffSummary.changedDeclarations) {
      lines.push(`  ${change.selector} { ${change.prop}: ${change.before || "(novo)"} → ${change.after} }`);
    }
  }

  return lines.join("\n");
}

/**
 * Merge Híbrido por Patches Seletivos com AI Merge Agent (RF11.2).
 *
 * 1. Invoca o AI Merge Agent para gerar patches comparando JS base e candidato IA.
 * 2. Combina com patches pré-armazenados do Agent Runner (precedência: figma-mcp > ai-merge-agent).
 * 3. Valida e aplica apenas patches com seletores presentes no HTML JS base.
 * 4. Gera relatório estruturado e versão consolidada.
 */
async function performHybridMerge(jsHtml, jsCssText, iaHtml, iaCssText, storedPatches, aiOptions = {}) {
  if (!jsHtml) throw new MergeServiceError("HTML determinista original e obrigatorio.");
  if (!jsCssText) throw new MergeServiceError("CSS determinista original e obrigatorio.");

  // 1. HTML base imutável — sempre o JS
  const mergedHtml = jsHtml;

  // 2. Seletores presentes no HTML base
  const htmlSelectors = extractSelectorsFromHtml(jsHtml);
  const classToFigmaIds = extractClassToFigmaIds(jsHtml);

  // 3. CSS base JS como regras estruturadas
  const originalBaseRules = parseCssRules(jsCssText);
  const baseRules = parseCssRules(jsCssText);
  const originalRuleList = parseCssRuleList(jsCssText);

  // 4. AI Merge Agent — gera patches comparando as duas versões
  const { apiKey, mcpContext } = aiOptions;
  let aiPatches = [];
  try {
    aiPatches = await generateMergePatches({
      jsHtml, jsCss: jsCssText,
      iaHtml: iaHtml || "", iaCss: iaCssText || "",
      mcpContext: mcpContext || { available: false },
      apiKey: apiKey || null,
    });
  } catch (_e) {
    aiPatches = [];
  }

  // 5. Consolidar patches: stored (Agent Runner) + AI Merge Agent
  // figma-mcp tem precedência; para o mesmo seletor+prop, figma-mcp vence ai-merge-agent vence ia-inference
  const sourceWeight = {
    "figma-mcp": 3,
    "ai-visual-refinement": 2.4,
    "ai-merge-agent": 2,
    "deterministic-fallback": 1,
    "ia-inference": 1,
  };
  const patchWeight = (patch) => {
    const base = sourceWeight[patch.source] || 0;
    if (patch.origin === "figma-normalized-structure") return base + 0.8;
    if (patch.origin === "figma-raw-document") return base + 1;
    return base;
  };
  const patchMap = new Map(); // "selector||prop" → patch com maior peso
  const allPatches = [...(storedPatches || []), ...aiPatches];
  for (const p of allPatches) {
    for (const prop of Object.keys(p.props || {})) {
      const key = `${p.selector}||${prop}`;
      const existing = patchMap.get(key);
      const weight = patchWeight(p);
      const existingWeight = existing ? patchWeight(existing) : -1;
      if (weight >= existingWeight) {
        patchMap.set(key, { ...p, props: { [prop]: p.props[prop] } });
      }
    }
  }
  const patches = [...patchMap.values()];

  const report = {
    accepted: [],
    rejected: [],
    conflicts: [],
    acceptedNoEffect: [],
    validations: [],
    diffSummary: {
      changedDeclarations: [],
      addedRules: [],
      changedRules: 0,
    },
    relevantPatchCount: 0,
  };

  const appliedFinalPatches = [];

  // 5. Aplicar patches seletivamente
  for (const patch of patches) {
    const { selector, props, source = "ia-inference", reason = "", confidence = 0.5, figmaId = null } = patch;
    const resolvedTargets = [];

    if (figmaId && htmlSelectors.has(`[data-figma-id="${figmaId}"]`)) {
      resolvedTargets.push(`[data-figma-id="${figmaId}"]`);
    } else if (selector.startsWith(".") && classToFigmaIds.has(selector.slice(1))) {
      for (const id of classToFigmaIds.get(selector.slice(1))) {
        resolvedTargets.push(`[data-figma-id="${id}"]`);
      }
    } else {
      resolvedTargets.push(selector);
    }
    const targetSelectors = [...new Set(resolvedTargets)];
    const isTrackedAiVisualRefinement =
      source === "ai-visual-refinement" &&
      confidence >= MIN_AI_VISUAL_REFINEMENT_CONFIDENCE &&
      targetSelectors.some((target) => target.startsWith("[data-figma-id="));

    // Rejeitar se seletor genérico bloqueado e ausente no HTML
    if (BLOCKED_SELECTORS.has(selector) && !htmlSelectors.has(selector)) {
      report.rejected.push({
        selector, source, reason: `Seletor genérico bloqueado e ausente no HTML base. Original: ${reason}`,
      });
      continue;
    }

    // Rejeitar se o seletor (classe/tag) não existe no HTML base
    if (!targetSelectors.some((target) => htmlSelectors.has(target) || target.startsWith("#"))) {
      report.rejected.push({
        selector, source, reason: `Seletor ausente no HTML base. Original: ${reason}`,
      });
      continue;
    }

    if (source === "ai-visual-refinement" && !isTrackedAiVisualRefinement) {
      report.rejected.push({
        selector,
        source,
        reason: "Refinamento visual IA sem seletor data-figma-id rastreavel ou confianca minima.",
      });
      continue;
    }

    // Filtrar apenas props cosméticas permitidas
    const allowedProps = {};
    for (const [prop, val] of Object.entries(props || {})) {
      if (!ALLOWED_PATCH_PROPS.has(prop)) {
        report.rejected.push({
          selector, source,
          reason: `Propriedade "${prop}" não é permitida em patches cosméticos.`,
        });
        continue;
      }

      if (FIGMA_ONLY_PROPS.has(prop) && source !== "figma-mcp" && !isTrackedAiVisualRefinement) {
        report.rejected.push({
          selector,
          source,
          reason: `Propriedade "${prop}" rejeitada: exige origem Figma/MCP ou refinamento visual IA rastreavel para evitar embelezamento generico.`,
        });
        continue;
      }

      const existingValue = targetSelectors.some((target) =>
        normalizeCssValue(getEffectiveValue(originalRuleList, target, prop)) === normalizeCssValue(val)
      )
        ? val
        : undefined;
      if (normalizeCssValue(existingValue) === normalizeCssValue(val)) {
        report.rejected.push({
          selector,
          source,
          reason: `Patch sem diferença visual real para "${prop}".`,
        });
        continue;
      }

      allowedProps[prop] = val;
    }

    if (!Object.keys(allowedProps).length) continue;

    // Aplicar props ao seletor nas regras base (ou criar novo se for seletor específico)
    if (!baseRules[selector]) {
      baseRules[selector] = {};
    }

    const acceptedProps = {};
    for (const [prop, val] of Object.entries(allowedProps)) {
      const existing = baseRules[selector][prop];

      // Conflito: mesma prop, origem diferente — figma-mcp vence ia-inference
      if (existing !== undefined) {
        const existingIsFromJs = true; // base JS tem prioridade sobre ia-inference
        if (source === "figma-mcp") {
          report.conflicts.push({
            selector, prop,
            winner: val, loser: existing,
            rule: "figma-mcp > js-base",
          });
          baseRules[selector][prop] = val;
          acceptedProps[prop] = val;
        } else if (source === "ia-inference" || source === "deterministic-fallback") {
          // Inferencia generica nao sobrescreve valor ja existente no JS base.
          report.conflicts.push({
            selector, prop,
            winner: existing, loser: val,
            rule: "js-base > ia-inference",
          });
        } else {
          report.conflicts.push({
            selector, prop,
            winner: val, loser: existing,
            rule: "ai-merge-agent candidate-diff > js-base",
          });
          baseRules[selector][prop] = val;
          acceptedProps[prop] = val;
        }
      } else {
        baseRules[selector][prop] = val;
        acceptedProps[prop] = val;
      }
    }

    if (Object.keys(acceptedProps).length) {
      for (const targetSelector of targetSelectors) {
        if (!htmlSelectors.has(targetSelector) && !targetSelector.startsWith("#")) continue;
        const resolvedFigmaId = figmaId || (targetSelector.match(/\[data-figma-id="([^"]+)"\]/) || [])[1] || null;
        const acceptedPatch = {
          selector: targetSelector,
          props: acceptedProps,
          source,
          reason: targetSelector !== selector
            ? `${reason} Seletor promovido de ${selector} para ${targetSelector}.`
            : reason,
          confidence,
          figmaId: resolvedFigmaId,
        };
        report.accepted.push(acceptedPatch);
        appliedFinalPatches.push(acceptedPatch);
      }
    }
  }

  // 6. Gerar CSS consolidado
  const appliedPatchCss = buildAppliedPatchCss(appliedFinalPatches);
  const mergedCss = [stringifyCssRules(baseRules), appliedPatchCss].filter(Boolean).join("\n\n");
  const mergedRules = parseCssRules(mergedCss);
  report.diffSummary = summarizeCssDiff(originalBaseRules, mergedRules);
  report.relevantPatchCount = report.diffSummary.changedDeclarations.length;

  // 7. Validação pós-merge
  // 7a. Seletores CSS órfãos
  const cssClasses = extractCssClassesFromSelectors(mergedCss);

  for (const cssClass of cssClasses) {
    if (!htmlSelectors.has("." + cssClass)) {
      report.validations.push(`[Seletor Órfão] .${cssClass} definido no CSS mas ausente no HTML.`);
    }
  }

  // 7b. Classes HTML sem CSS
  for (const sel of htmlSelectors) {
    if (sel.startsWith(".")) {
      const cls = sel.slice(1);
      if (!cssClasses.has(cls)) {
        report.validations.push(`[Sem Estilo] Classe HTML "${cls}" não possui regra CSS correspondente.`);
      }
    }
  }

  // 7c. Integridade data-figma-id
  const jsFigmaIds = [...jsHtml.matchAll(/data-figma-id="([^"]+)"/g)].map(m => m[1]);
  const mergedFigmaIds = new Set([...mergedHtml.matchAll(/data-figma-id="([^"]+)"/g)].map(m => m[1]));
  const missing = jsFigmaIds.filter(id => !mergedFigmaIds.has(id));
  if (missing.length > 0) {
    report.validations.push(`[ERRO] data-figma-id ausentes após merge: ${missing.join(", ")}`);
  } else {
    report.validations.push(`[OK] Todos os ${jsFigmaIds.length} atributo(s) data-figma-id preservados.`);
  }

  if (report.relevantPatchCount === 0) {
    report.validations.push("[AVISO] nenhum patch visual relevante foi aplicado.");
  } else if (report.accepted.length < 5) {
    report.validations.push("[AVISO] Merge sem melhoria visual relevante.");
  } else {
    report.validations.push(`[OK] ${report.relevantPatchCount} diferença(s) visual(is) real(is) aplicada(s) ao CSS consolidado.`);
  }

  report.validations.push(`[OK] Merge concluído: ${report.accepted.length} patch(es) aceito(s), ${report.rejected.length} rejeitado(s).`);

  // 8. Logs legíveis (para compatibilidade com frontend existente)
  const reportText = buildReportText(report);
  const logs = reportText.split("\n");

  // 9. Persistir versão consolidada
  const saved = saveConsolidated(mergedHtml, mergedCss, logs);

  return {
    success: true,
    html: saved.html,
    css: saved.css,
    logs: saved.logs,
    report,
    reportText,
    synchronized: missing.length === 0,
  };
}

module.exports = {
  MergeServiceError,
  performHybridMerge,
};
