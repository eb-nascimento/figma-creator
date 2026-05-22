const state = {
  fileUrl: "",
  frames: [],
  extractedStructure: null,
  generatingHtml: false,
  generatedHtml: null,
  refinedHtml: null,
  refiningHtml: false,
  selectedFrame: null,
  selectedFrameId: null,
  selectingFrameId: null,
  extractingStructure: false,
  generatingCss: false,
  generatedCss: null,
  previewMode: "desktop",
  generatingAiContext: false,
  aiContext: null,
  previewFitMode: "fit",

  // New state variables for RF11 / RF11.1 / RF11.2
  jsHtml: null,
  jsCss: null,
  iaHtml: null,
  iaCss: null,
  runningAgentRunner: false,
  merging: false,
  activePreviewName: "nenhuma",
  activePreviewHash: "",
  activePreviewTimestamp: "",
};

const elements = {
  authStatus: document.querySelector("#auth-status"),
  connectButton: document.querySelector("#connect-button"),
  extractStructureButton: document.querySelector("#extract-structure-button"),
  feedback: document.querySelector("#feedback"),
  figmaForm: document.querySelector("#figma-form"),
  figmaUrl: document.querySelector("#figma-url"),
  frameCount: document.querySelector("#frame-count"),
  framesList: document.querySelector("#frames-list"),
  generateHtmlButton: document.querySelector("#generate-html-button"),
  generatedHtml: document.querySelector("#generated-html"),
  loadFramesButton: document.querySelector("#load-frames-button"),
  logoutButton: document.querySelector("#logout-button"),
  refinedHtml: document.querySelector("#refined-html"),
  refineHtmlButton: document.querySelector("#refine-html-button"),
  generateCssButton: document.querySelector("#generate-css-button"),
  generatedCss: document.querySelector("#generated-css"),
  generateAiContextButton: document.querySelector("#generate-ai-context-button"),
  aiContextJson: document.querySelector("#ai-context-json"),
  selectedId: document.querySelector("#selected-id"),
  selectedName: document.querySelector("#selected-name"),
  selectedPage: document.querySelector("#selected-page"),
  selectionDetails: document.querySelector("#selection-details"),
  selectionEmpty: document.querySelector("#selection-empty"),
  structureJson: document.querySelector("#structure-json"),
  structureSummary: document.querySelector("#structure-summary"),
  previewFrame: document.querySelector("#result-preview"),
  previewFrameShell: document.querySelector("#preview-frame-shell"),
  previewModeButtons: document.querySelectorAll(".preview-mode-button"),
  previewStatus: document.querySelector("#preview-status"),
  previewVersionInfo: document.querySelector("#preview-version-info"),
  previewReloadButton: document.querySelector("#preview-reload-button"),

  // New UI elements
  runAgentRunnerButton: document.querySelector("#run-agent-runner-button"),
  aiRunnerStatus: document.querySelector("#ai-runner-status"),
  aiRunnerStatusText: document.querySelector("#ai-runner-status-text"),
  codeJsBase: document.querySelector("#code-js-base"),
  codeIaCandidate: document.querySelector("#code-ia-candidate"),
  runMergeButton: document.querySelector("#run-merge-button"),
  mergeLogsContainer: document.querySelector("#merge-logs-container"),
  mergeValidationLogs: document.querySelector("#merge-validation-logs"),
  exportZipButton: document.querySelector("#export-zip-button"),
  exportGitButton: document.querySelector("#export-git-button"),
  exportFeedback: document.querySelector("#export-feedback"),
  candidatePreview: document.querySelector("#candidate-preview"),
  previewIaBox: document.querySelector("#preview-ia-box"),
  previewJsTitle: document.querySelector("#preview-js-title"),
};

function hashContent(value) {
  const text = String(value || "");
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }

  return Math.abs(hash).toString(16).padStart(8, "0").slice(0, 8);
}

function setFeedback(message, options = {}) {
  elements.feedback.textContent = message;
  elements.feedback.classList.toggle("error", Boolean(options.error));
}

function setLoading(isLoading) {
  elements.loadFramesButton.disabled = isLoading;
  elements.loadFramesButton.textContent = isLoading ? "Carregando..." : "Carregar telas";
}

function setStructureLoading(isLoading) {
  state.extractingStructure = isLoading;
  elements.extractStructureButton.disabled = isLoading || !state.selectedFrame;
  elements.extractStructureButton.textContent = isLoading
    ? "Extraindo..."
    : "Extrair estrutura";
}

function setHtmlLoading(isLoading) {
  state.generatingHtml = isLoading;
  elements.generateHtmlButton.disabled = isLoading || !state.extractedStructure;
  elements.generateHtmlButton.textContent = isLoading ? "Gerando..." : "Gerar HTML";
}

function setRefineHtmlLoading(isLoading) {
  state.refiningHtml = isLoading;
  elements.refineHtmlButton.disabled = isLoading || !state.generatedHtml;
  elements.refineHtmlButton.textContent = isLoading ? "Refinando..." : "Refinar HTML";
}

function setCssLoading(isLoading) {
  state.generatingCss = isLoading;
  elements.generateCssButton.disabled = isLoading || !state.extractedStructure;
  elements.generateCssButton.textContent = isLoading ? "Gerando..." : "Gerar CSS";
}

function setAiContextLoading(isLoading) {
  state.generatingAiContext = isLoading;

  if (!elements.generateAiContextButton) {
    return;
  }

  elements.generateAiContextButton.disabled = isLoading || !state.extractedStructure;
  elements.generateAiContextButton.textContent = isLoading
    ? "Gerando..."
    : "Gerar contexto MCP";
}

function setAgentRunnerLoading(isLoading) {
  state.runningAgentRunner = isLoading;
  if (elements.runAgentRunnerButton) {
    elements.runAgentRunnerButton.disabled = isLoading;
    elements.runAgentRunnerButton.textContent = isLoading ? "Processando..." : "Executar Agent Runner IA";
  }
  if (elements.aiRunnerStatus) {
    elements.aiRunnerStatus.style.display = isLoading ? "block" : "none";
  }
}

function setMergeLoading(isLoading) {
  state.merging = isLoading;
  if (elements.runMergeButton) {
    elements.runMergeButton.disabled = isLoading;
    elements.runMergeButton.textContent = isLoading ? "Mesclando..." : "Mesclar Código (Merge Híbrido)";
  }
}

function checkOrquestradorAvailability() {
  const hasStructure = !!state.extractedStructure;
  const hasHtml = !!state.refinedHtml || !!state.generatedHtml;
  const hasCss = !!state.generatedCss;
  const isAvailable = hasStructure && hasHtml && hasCss;

  if (elements.runAgentRunnerButton) {
    elements.runAgentRunnerButton.disabled = !isAvailable;
  }
}

function resetOrquestradorPanel() {
  state.jsHtml = null;
  state.jsCss = null;
  state.iaHtml = null;
  state.iaCss = null;

  if (elements.runAgentRunnerButton) elements.runAgentRunnerButton.disabled = true;
  if (elements.runMergeButton) elements.runMergeButton.disabled = true;
  if (elements.exportZipButton) elements.exportZipButton.disabled = true;
  if (elements.exportGitButton) elements.exportGitButton.disabled = true;
  if (elements.aiRunnerStatus) elements.aiRunnerStatus.style.display = "none";
  if (elements.codeJsBase) elements.codeJsBase.textContent = "Gere o HTML/CSS determinístico primeiro.";
  if (elements.codeIaCandidate) elements.codeIaCandidate.textContent = "Aguardando execução do Agent Runner...";
  if (elements.mergeLogsContainer) elements.mergeLogsContainer.style.display = "none";
  if (elements.mergeValidationLogs) elements.mergeValidationLogs.textContent = "Aguardando mesclagem...";
  if (elements.exportFeedback) elements.exportFeedback.textContent = "";
  if (elements.previewIaBox) elements.previewIaBox.style.display = "none";
  if (elements.previewJsTitle) elements.previewJsTitle.style.display = "none";
  if (elements.previewJsTitle) elements.previewJsTitle.textContent = "Preview JS Determinístico";
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Falha na requisicao.");
  }

  return payload;
}

async function refreshAuthStatus() {
  const status = await requestJson("/api/auth/figma/status");

  elements.authStatus.textContent = status.connected
    ? "Conectado ao Figma"
    : "Nao conectado ao Figma";
  elements.connectButton.hidden = status.connected;
  elements.logoutButton.hidden = !status.connected;
}

function renderFrames() {
  elements.frameCount.textContent = `${state.frames.length} telas`;
  elements.framesList.replaceChildren(
    ...state.frames.map((frame) => {
      const isSelecting = frame.id === state.selectingFrameId;
      const button = document.createElement("button");
      const preview = document.createElement("span");
      const title = document.createElement("span");
      const meta = document.createElement("span");

      button.type = "button";
      button.className = "frame-card";
      button.disabled = Boolean(state.selectingFrameId);
      button.setAttribute("aria-pressed", String(frame.id === state.selectedFrameId));
      button.setAttribute("aria-busy", String(isSelecting));
      button.addEventListener("click", () => selectFrame(frame.id));

      preview.className = "frame-preview";

      if (frame.thumbnailUrl) {
        const image = document.createElement("img");
        image.src = frame.thumbnailUrl;
        image.alt = "";
        preview.append(image);
      } else {
        preview.textContent = "Sem preview";
      }

      title.className = "frame-title";
      title.textContent = frame.name;

      meta.className = "frame-meta";
      meta.textContent = isSelecting
        ? "Selecionando..."
        : `${frame.pageName || "Pagina sem nome"} | ${frame.id}`;

      button.append(preview, title, meta);
      return button;
    })
  );
}

function renderSelection(frame) {
  elements.selectionEmpty.hidden = Boolean(frame);
  elements.selectionDetails.hidden = !frame;
  elements.extractStructureButton.disabled = !frame || state.extractingStructure;

  if (!frame) {
    elements.selectedName.textContent = "";
    elements.selectedPage.textContent = "";
    elements.selectedId.textContent = "";
    return;
  }

  elements.selectedName.textContent = frame.name;
  elements.selectedPage.textContent = frame.pageName || "Pagina sem nome";
  elements.selectedId.textContent = frame.id;
}

function resetStructurePanel() {
  state.extractedStructure = null;
  elements.structureSummary.textContent = state.selectedFrame
    ? "Estrutura ainda nao extraida"
    : "Aguardando frame";
  elements.structureJson.textContent = state.selectedFrame
    ? "Clique em Extrair estrutura para buscar a arvore do frame."
    : "Selecione um frame e extraia a estrutura.";
  resetHtmlPanel();
  resetCssPanel();
  resetAiContextPanel();
  resetOrquestradorPanel();
}

function renderStructure(payload) {
  const typeEntries = Object.entries(payload.summary.types)
    .sort(([typeA], [typeB]) => typeA.localeCompare(typeB))
    .map(([type, count]) => `${type}: ${count}`)
    .join(" | ");

  elements.structureSummary.textContent = `${payload.summary.totalNodes} nos | ${typeEntries}`;
  elements.structureJson.textContent = JSON.stringify(payload.structure, null, 2);
  state.extractedStructure = payload.structure;
  elements.generateHtmlButton.disabled = false;
  elements.generateCssButton.disabled = false;
  if (elements.generateAiContextButton) {
    elements.generateAiContextButton.disabled = false;
  }
  checkOrquestradorAvailability();
}

function resetHtmlPanel() {
  state.generatedHtml = null;
  elements.generateHtmlButton.disabled = true;
  elements.generatedHtml.textContent = state.selectedFrame
    ? "Extraia a estrutura antes de gerar HTML."
    : "Selecione um frame e extraia a estrutura antes de gerar HTML.";
  resetRefinedHtmlPanel();
}

function renderGeneratedHtml(payload) {
  state.generatedHtml = payload.html;
  elements.generatedHtml.textContent = payload.html;
  elements.refineHtmlButton.disabled = false;
  resetAiContextPanel();
  resetPreview();
  checkOrquestradorAvailability();
}

function resetRefinedHtmlPanel() {
  state.refinedHtml = null;
  elements.refineHtmlButton.disabled = true;
  elements.refinedHtml.textContent = state.generatedHtml
    ? "Refine o HTML gerado antes de seguir para o CSS."
    : "Gere o HTML antes de refinar.";
  resetPreview();
}

function renderRefinedHtml(payload) {
  state.refinedHtml = payload.html;
  elements.refinedHtml.textContent = payload.html;
  resetAiContextPanel();
  renderPreview();
  checkOrquestradorAvailability();
}

function resetCssPanel() {
  state.generatedCss = null;
  elements.generateCssButton.disabled = true;
  elements.generatedCss.textContent = state.selectedFrame
    ? "Extraia a estrutura antes de gerar CSS."
    : "Selecione um frame e extraia a estrutura antes de gerar CSS.";
  resetPreview();
}

function renderGeneratedCss(payload) {
  state.generatedCss = payload.css;
  elements.generatedCss.textContent = payload.css;
  resetAiContextPanel();
  renderPreview();
  checkOrquestradorAvailability();
}

function resetAiContextPanel() {
  state.aiContext = null;

  if (!elements.aiContextJson || !elements.generateAiContextButton) {
    return;
  }

  elements.generateAiContextButton.disabled = !state.extractedStructure;
  elements.aiContextJson.textContent = state.extractedStructure
    ? "Gere o contexto IA/MCP usando a URL do Figma informada no topo."
    : "Extraia a estrutura antes de gerar o contexto IA/MCP.";
}

function renderAiContext(payload) {
  state.aiContext = payload;

  if (elements.aiContextJson) {
    elements.aiContextJson.textContent = JSON.stringify(payload, null, 2);
  }
}

function resetPreview() {
  if (elements.previewFrame) {
    elements.previewFrame.srcdoc = "";
  }

  state.activePreviewName = "nenhuma";
  state.activePreviewHash = "";
  state.activePreviewTimestamp = "";

  if (elements.previewStatus) {
    elements.previewStatus.textContent = "Gere HTML refinado e CSS para visualizar.";
    elements.previewStatus.classList.remove("error");
  }

  if (elements.previewVersionInfo) {
    elements.previewVersionInfo.textContent = "Versão ativa: nenhuma.";
  }
}

function updatePreviewScale() {
  const shell = elements.previewFrameShell;
  if (!shell) return;

  const figmaWidth = (state.extractedStructure && state.extractedStructure.layout && state.extractedStructure.layout.width) || 1920;
  const figmaHeight = (state.extractedStructure && state.extractedStructure.layout && state.extractedStructure.layout.height) || 1080;

  const wrappers = document.querySelectorAll("#preview-wrapper-js, #preview-wrapper-ia");
  const isSplit = elements.previewIaBox && elements.previewIaBox.style.display === "block";

  wrappers.forEach((wrapper) => {
    if (state.previewFitMode === "real") {
      wrapper.style.width = `${figmaWidth}px`;
      wrapper.style.height = `${figmaHeight}px`;
      wrapper.style.transform = "none";
      wrapper.style.marginRight = "0";
      wrapper.style.marginBottom = "0";
    } else {
      let availableWidth = shell.clientWidth - 24;
      if (isSplit) {
        availableWidth = (availableWidth - 16) / 2;
      }
      const scale = Math.min(availableWidth / figmaWidth, 1);
      wrapper.style.width = `${figmaWidth}px`;
      wrapper.style.height = `${figmaHeight}px`;
      wrapper.style.transform = `scale(${scale})`;
      wrapper.style.marginRight = `-${figmaWidth * (1 - scale)}px`;
      wrapper.style.marginBottom = `-${figmaHeight * (1 - scale)}px`;
    }
  });

  if (state.previewFitMode === "real") {
    shell.style.overflow = "auto";
    shell.style.height = "auto";
    shell.style.minHeight = "660px";
  } else {
    shell.style.overflow = "hidden";
    let maxScaledHeight = 0;
    wrappers.forEach((wrapper) => {
      const parent = wrapper.parentElement;
      if (parent && parent.style.display !== "none") {
        let availableWidth = shell.clientWidth - 24;
        if (isSplit) {
          availableWidth = (availableWidth - 16) / 2;
        }
        const scale = Math.min(availableWidth / figmaWidth, 1);
        const scaledHeight = figmaHeight * scale;
        if (scaledHeight > maxScaledHeight) {
          maxScaledHeight = scaledHeight;
        }
      }
    });
    shell.style.height = `${maxScaledHeight + 24}px`;
    shell.style.minHeight = "auto";
  }
}

function setPreviewMode(mode) {
  state.previewMode = mode;
  elements.previewFrameShell.className = `preview-frame-shell preview-frame-shell--${mode}`;
  elements.previewModeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.previewMode === mode));
  });
}

function buildPreviewDocument(html, css) {
  const safeCss = css || "";
  const source = html || "";
  const renderKey = hashContent(`${source}\n${safeCss}\n${Date.now()}`);
  const styleTag = `<style data-preview-key="${renderKey}">\n/* preview-key:${renderKey} */\n${safeCss}</style>`;

  if (/<\/head>/i.test(source)) {
    return source.replace(/<\/head>/i, `${styleTag}</head>`);
  }

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${styleTag}
  </head>
  <body>
    ${source}
  </body>
</html>`;
}

function updatePreviewVersionInfo(name, html, css) {
  const hash = hashContent(`${html || ""}\n${css || ""}`);
  const timestamp = new Date().toLocaleTimeString("pt-BR");

  state.activePreviewName = name;
  state.activePreviewHash = hash;
  state.activePreviewTimestamp = timestamp;

  if (elements.previewVersionInfo) {
    elements.previewVersionInfo.textContent = `Versão ativa: ${name} | hash ${hash} | ${timestamp}`;
  }
}

function renderPreviewFrame(frame, html, css) {
  if (!frame) return;

  frame.srcdoc = "";
  const documentSource = buildPreviewDocument(html, css);
  setTimeout(() => {
    frame.srcdoc = documentSource;
  }, 0);
}

function renderPreview() {
  if (!elements.previewFrame) {
    return;
  }

  if (!state.refinedHtml || !state.generatedCss) {
    resetPreview();
    return;
  }

  try {
    elements.previewStatus.textContent = "Montando preview...";
    elements.previewStatus.classList.remove("error");
    renderPreviewFrame(elements.previewFrame, state.refinedHtml, state.generatedCss);
    updatePreviewVersionInfo(
      elements.previewJsTitle && elements.previewJsTitle.textContent.includes("Consolidado")
        ? "consolidada"
        : "base JS",
      state.refinedHtml,
      state.generatedCss
    );
    
    setTimeout(() => {
      updatePreviewScale();
    }, 100);

    elements.previewStatus.textContent = `Preview atualizado em modo ${state.previewMode}.`;
  } catch (error) {
    elements.previewFrame.srcdoc = "";
    elements.previewStatus.textContent = "Nao foi possivel renderizar o preview.";
    elements.previewStatus.classList.add("error");
  }
}

async function loadFrames(event) {
  event.preventDefault();

  state.fileUrl = elements.figmaUrl.value.trim();
  state.selectedFrame = null;
  state.selectedFrameId = null;
  state.selectingFrameId = null;
  renderSelection(null);
  resetStructurePanel();

  if (!state.fileUrl) {
    setFeedback("Informe a URL do arquivo Figma.", { error: true });
    return;
  }

  setLoading(true);
  setFeedback("Buscando telas principais...");

  try {
    const payload = await requestJson("/api/figma/frames", {
      method: "POST",
      body: JSON.stringify({ url: state.fileUrl }),
    });

    state.frames = payload.frames || [];
    renderFrames();
    setFeedback(
      state.frames.length
        ? "Telas carregadas. Selecione uma para continuar."
        : "Nenhuma tela principal encontrada."
    );
  } catch (error) {
    state.frames = [];
    renderFrames();
    setFeedback(error.message, { error: true });
  } finally {
    setLoading(false);
  }
}

async function selectFrame(frameId) {
  if (!state.fileUrl) {
    setFeedback("Carregue as telas antes de selecionar.", { error: true });
    return;
  }

  if (state.selectingFrameId) {
    return;
  }

  state.selectingFrameId = frameId;
  renderFrames();
  setFeedback("Validando selecao...");

  try {
    const payload = await requestJson("/api/figma/frame", {
      method: "POST",
      body: JSON.stringify({
        url: state.fileUrl,
        frame_id: frameId,
      }),
    });

    state.selectedFrame = payload.frame;
    state.selectedFrameId = payload.frame.id;
    renderSelection(payload.frame);
    resetStructurePanel();
    setFeedback("Frame selecionado para processamento.");
  } catch (error) {
    setFeedback(error.message, { error: true });
  } finally {
    state.selectingFrameId = null;
    renderFrames();
  }
}

async function extractStructure() {
  if (!state.selectedFrame) {
    setFeedback("Selecione um frame antes de extrair a estrutura.", { error: true });
    return;
  }

  setStructureLoading(true);
  elements.structureSummary.textContent = "Extraindo estrutura...";
  elements.structureJson.textContent = "Buscando subtree do frame no Figma...";
  setFeedback("Extraindo estrutura do frame selecionado...");

  try {
    const payload = await requestJson("/api/figma/frame/structure", {
      method: "POST",
      body: JSON.stringify({
        url: state.fileUrl,
        frame_id: state.selectedFrame.id,
      }),
    });

    renderStructure(payload);
    setFeedback("Estrutura extraida com sucesso.");
  } catch (error) {
    resetStructurePanel();
    setFeedback(error.message, { error: true });
  } finally {
    setStructureLoading(false);
  }
}

async function generateHtml() {
  if (!state.extractedStructure) {
    setFeedback("Extraia a estrutura antes de gerar HTML.", { error: true });
    return;
  }

  setHtmlLoading(true);
  elements.generatedHtml.textContent = "Gerando HTML a partir da estrutura...";
  setFeedback("Gerando HTML...");

  try {
    const payload = await requestJson("/api/generate/html", {
      method: "POST",
      body: JSON.stringify({
        structure: state.extractedStructure,
      }),
    });

    renderGeneratedHtml(payload);
    resetRefinedHtmlPanel();
    elements.refineHtmlButton.disabled = false;
    setFeedback("HTML gerado com sucesso.");
  } catch (error) {
    setFeedback(error.message, { error: true });
  } finally {
    setHtmlLoading(false);
  }
}

async function refineHtml() {
  if (!state.generatedHtml || !state.extractedStructure) {
    setFeedback("Gere o HTML antes de refinar.", { error: true });
    return;
  }

  setRefineHtmlLoading(true);
  elements.refinedHtml.textContent = "Refinando HTML com heuristicas locais...";
  setFeedback("Refinando HTML...");

  try {
    const payload = await requestJson("/api/generate/html/refine", {
      method: "POST",
      body: JSON.stringify({
        html: state.generatedHtml,
        structure: state.extractedStructure,
      }),
    });

    if (payload.structure) {
      state.extractedStructure = payload.structure;
    }
    
    renderRefinedHtml(payload);
    setFeedback("HTML refinado com sucesso.");
  } catch (error) {
    setFeedback(error.message, { error: true });
  } finally {
    setRefineHtmlLoading(false);
  }
}

async function generateCss() {
  if (!state.extractedStructure) {
    setFeedback("Extraia a estrutura antes de gerar CSS.", { error: true });
    return;
  }

  setCssLoading(true);
  elements.generatedCss.textContent = "Gerando CSS a partir da estrutura...";
  setFeedback("Gerando CSS...");

  try {
    const mode = "responsive";
    const payload = await requestJson("/api/generate/css", {
      method: "POST",
      body: JSON.stringify({
        structure: state.extractedStructure,
        mode: mode,
      }),
    });

    renderGeneratedCss(payload);
    setFeedback("CSS gerado com sucesso.");
  } catch (error) {
    setFeedback(error.message, { error: true });
  } finally {
    setCssLoading(false);
  }
}

async function generateAiContext() {
  if (!state.extractedStructure) {
    setFeedback("Extraia a estrutura antes de gerar o contexto IA/MCP.", { error: true });
    return;
  }

  const figmaLink = elements.figmaUrl.value.trim();
  const mode = "responsive";

  setAiContextLoading(true);

  if (elements.aiContextJson) {
    elements.aiContextJson.textContent = "Gerando contexto para IA/agente...";
  }

  setFeedback("Gerando contexto IA/MCP...");

  try {
    const payload = await requestJson("/api/generate/ai/context", {
      method: "POST",
      body: JSON.stringify({
        structure: state.extractedStructure,
        html: state.refinedHtml || state.generatedHtml || "",
        css: state.generatedCss || "",
        mode,
        figmaLink,
        logs: [],
      }),
    });

    renderAiContext(payload);
    setFeedback(
      payload.summary && payload.summary.hasMcpLink
        ? "Contexto IA/MCP gerado usando a URL do Figma."
        : "Contexto IA gerado sem link MCP. Fluxo local preservado."
    );
  } catch (error) {
    setFeedback(error.message, { error: true });
  } finally {
    setAiContextLoading(false);
  }
}

async function runAgentRunner() {
  if (!state.extractedStructure) {
    setFeedback("Extraia a estrutura antes de disparar o Agent Runner.", { error: true });
    return;
  }

  const figmaLink = elements.figmaUrl.value.trim();
  const mode = "responsive";

  setAgentRunnerLoading(true);
  if (elements.aiRunnerStatusText) {
    elements.aiRunnerStatusText.textContent = "Iniciando orquestrador e lendo contexto Figma/MCP...";
  }
  setFeedback("Executando orquestração automatizada IA/MCP...");

  try {
    const payload = await requestJson("/api/generate/ai/run", {
      method: "POST",
      body: JSON.stringify({
        structure: state.extractedStructure,
        html: state.refinedHtml || state.generatedHtml || "",
        css: state.generatedCss || "",
        mode,
        figmaLink,
      }),
    });

    const runnerLogs = payload.iaCandidate?.metadata?.logs || [];
    const providerStatus = payload.aiProvider?.status || "Status do provedor IA indisponivel.";

    if (elements.aiRunnerStatusText) {
      elements.aiRunnerStatusText.textContent = providerStatus;
    }

    state.jsHtml = state.refinedHtml || state.generatedHtml || "";
    state.jsCss = state.generatedCss || "";
    state.iaHtml = payload.iaCandidate.html;
    state.iaCss = payload.iaCandidate.css;

    if (elements.codeJsBase) {
      elements.codeJsBase.textContent = `<!-- HTML -->\n${state.jsHtml}\n\n/* CSS */\n${state.jsCss}`;
    }
    if (elements.codeIaCandidate) {
      const logsBlock = runnerLogs.length
        ? `/* LOGS DO AGENT RUNNER\n${runnerLogs.map((line) => `- ${line}`).join("\n")}\n*/\n\n`
        : "";
      elements.codeIaCandidate.textContent = `${logsBlock}<!-- HTML -->\n${state.iaHtml}\n\n/* CSS */\n${state.iaCss}`;
    }

    if (elements.runMergeButton) {
      elements.runMergeButton.disabled = false;
    }

    if (elements.previewIaBox) {
      elements.previewIaBox.style.display = "block";
    }
    if (elements.previewJsTitle) {
      elements.previewJsTitle.style.display = "block";
      elements.previewJsTitle.textContent = "Preview JS Determinístico";
    }

    if (elements.candidatePreview) {
      renderPreviewFrame(elements.candidatePreview, state.iaHtml, state.iaCss);
    }

    const baseHash = hashContent(`${state.jsHtml}\n${state.jsCss}`);
    const candidateHash = hashContent(`${state.iaHtml}\n${state.iaCss}`);
    const versionsAreIdentical = baseHash === candidateHash;

    setTimeout(() => {
      updatePreviewScale();
    }, 150);

    setFeedback(
      versionsAreIdentical
        ? "Versão base JS e candidata IA/MCP são idênticas. O preview pode parecer igual até o merge aplicar diferenças reais."
        : "Versão candidata IA/MCP gerada e pronta para comparação.",
      { error: versionsAreIdentical }
    );
  } catch (error) {
    setFeedback(error.message, { error: true });
    if (elements.aiRunnerStatusText) {
      elements.aiRunnerStatusText.textContent = `Erro: ${error.message}`;
    }
  } finally {
    setAgentRunnerLoading(false);
  }
}

async function runMerge() {
  if (!state.jsHtml || !state.iaHtml) {
    setFeedback("Gere a versão candidata IA antes de mesclar.", { error: true });
    return;
  }

  setMergeLoading(true);
  setFeedback("Mesclando estrutura lógica com refinamentos estéticos...");

  try {
    const payload = await requestJson("/api/generate/merge", {
      method: "POST",
      body: JSON.stringify({
        jsHtml: state.jsHtml,
        jsCss: state.jsCss,
        iaHtml: state.iaHtml,
        iaCss: state.iaCss,
      }),
    });

    state.refinedHtml = payload.html;
    state.generatedCss = payload.css;

    if (elements.refinedHtml) {
      elements.refinedHtml.textContent = payload.html;
    }

    if (elements.generatedCss) {
      elements.generatedCss.textContent = payload.css;
    }

    if (elements.previewJsTitle) {
      elements.previewJsTitle.textContent = "Preview Consolidado (Após Merge)";
    }

    renderPreview();

    if (elements.mergeValidationLogs) {
      // Use structured report text if available, fall back to logs array
      elements.mergeValidationLogs.textContent =
        payload.reportText || (Array.isArray(payload.logs) ? payload.logs.join("\n") : "");
    }
    if (elements.mergeLogsContainer) {
      elements.mergeLogsContainer.style.display = "block";
    }

    if (elements.exportZipButton) elements.exportZipButton.disabled = false;
    if (elements.exportGitButton) elements.exportGitButton.disabled = false;

    const report = payload.report || {};
    const accepted = report.accepted?.length ?? "?";
    const rejected = report.rejected?.length ?? "?";
    const mergedHash = hashContent(`${payload.html}\n${payload.css}`);
    const baseHash = hashContent(`${state.jsHtml}\n${state.jsCss}`);
    const relevantPatchCount = report.relevantPatchCount || 0;

    setFeedback(
      mergedHash === baseHash || relevantPatchCount === 0
        ? `Merge concluído — nenhum patch visual relevante foi aplicado. Base e consolidado podem estar iguais.`
        : `Merge concluído — ${accepted} patch(es) aplicado(s), ${rejected} rejeitado(s), ${relevantPatchCount} diferença(s) visual(is) real(is). Versão consolidada pronta para exportação.`,
      { error: mergedHash === baseHash || relevantPatchCount === 0 }
    );

  } catch (error) {
    setFeedback(error.message, { error: true });
  } finally {
    setMergeLoading(false);
  }
}

function reloadPreview() {
  if (!state.refinedHtml || !state.generatedCss) {
    setFeedback("Nenhuma versão disponível para recarregar no preview.", { error: true });
    return;
  }

  renderPreview();

  if (state.iaHtml && state.iaCss && elements.candidatePreview && elements.previewIaBox?.style.display === "block") {
    renderPreviewFrame(elements.candidatePreview, state.iaHtml, state.iaCss);
  }

  setFeedback(`Preview recarregado: ${state.activePreviewName} (${state.activePreviewHash}).`);
}

function exportZip() {
  if (elements.exportFeedback) {
    elements.exportFeedback.textContent = "Preparando pacote ZIP...";
    elements.exportFeedback.className = "feedback";
  }

  try {
    window.location.href = "/api/export/zip";
    setTimeout(() => {
      if (elements.exportFeedback) {
        elements.exportFeedback.textContent = "Download do pacote ZIP iniciado com sucesso!";
        elements.exportFeedback.className = "feedback success-message";
      }
    }, 1000);
  } catch (error) {
    if (elements.exportFeedback) {
      elements.exportFeedback.textContent = `Erro na exportação ZIP: ${error.message}`;
      elements.exportFeedback.className = "feedback error";
    }
  }
}

async function exportGit() {
  if (elements.exportFeedback) {
    elements.exportFeedback.textContent = "Inicializando repositório Git local e criando commit...";
    elements.exportFeedback.className = "feedback";
  }

  try {
    const payload = await requestJson("/api/export/git", {
      method: "POST",
      body: JSON.stringify({}),
    });

    if (elements.exportFeedback) {
      elements.exportFeedback.innerHTML = `
        <div style="color: var(--accent); margin-bottom: 8px;">Repositório Git inicializado e commitado com sucesso!</div>
        <div style="font-size: 11px; color: var(--muted); font-family: monospace; background: var(--surface-strong); padding: 8px; border-radius: 4px; overflow-x: auto; max-height: 120px; white-space: pre-wrap;">
          <strong>Pasta:</strong> ${payload.folder}<br><br>
          <strong>Logs Git:</strong><br>${payload.logs.join("\n")}
        </div>
      `;
      elements.exportFeedback.className = "feedback success-message";
    }
  } catch (error) {
    if (elements.exportFeedback) {
      elements.exportFeedback.textContent = `Erro na exportação Git: ${error.message}`;
      elements.exportFeedback.className = "feedback error";
    }
  }
}

// Event Listeners
elements.connectButton.addEventListener("click", () => {
  window.location.href = "/api/auth/figma/start";
});

elements.logoutButton.addEventListener("click", async () => {
  await requestJson("/api/auth/figma/logout", { method: "POST" });
  state.frames = [];
  state.selectedFrame = null;
  state.selectedFrameId = null;
  state.selectingFrameId = null;
  renderFrames();
  renderSelection(null);
  resetStructurePanel();
  await refreshAuthStatus();
  setFeedback("Sessao desconectada.");
});

elements.extractStructureButton.addEventListener("click", extractStructure);
elements.figmaForm.addEventListener("submit", loadFrames);
elements.generateHtmlButton.addEventListener("click", generateHtml);
elements.refineHtmlButton.addEventListener("click", refineHtml);
elements.generateCssButton.addEventListener("click", generateCss);
if (elements.generateAiContextButton) {
  elements.generateAiContextButton.addEventListener("click", generateAiContext);
}

// New Event Listeners
if (elements.runAgentRunnerButton) {
  elements.runAgentRunnerButton.addEventListener("click", runAgentRunner);
}
if (elements.runMergeButton) {
  elements.runMergeButton.addEventListener("click", runMerge);
}
if (elements.exportZipButton) {
  elements.exportZipButton.addEventListener("click", exportZip);
}
if (elements.exportGitButton) {
  elements.exportGitButton.addEventListener("click", exportGit);
}
if (elements.previewReloadButton) {
  elements.previewReloadButton.addEventListener("click", reloadPreview);
}

elements.previewModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setPreviewMode(button.dataset.previewMode);
    renderPreview();
  });
});

const fitButton = document.querySelector("#preview-fit-button");
const realButton = document.querySelector("#preview-real-button");

if (fitButton && realButton) {
  fitButton.addEventListener("click", () => {
    state.previewFitMode = "fit";
    fitButton.style.background = "var(--accent)";
    fitButton.style.color = "white";
    realButton.style.background = "transparent";
    realButton.style.color = "var(--text)";
    updatePreviewScale();
  });

  realButton.addEventListener("click", () => {
    state.previewFitMode = "real";
    realButton.style.background = "var(--accent)";
    realButton.style.color = "white";
    fitButton.style.background = "transparent";
    fitButton.style.color = "var(--text)";
    updatePreviewScale();
  });
}

const newTabButton = document.querySelector("#preview-new-tab-button");
if (newTabButton) {
  newTabButton.addEventListener("click", () => {
    if (!state.refinedHtml || !state.generatedCss) {
      setFeedback("Gere o HTML refinado e o CSS antes de abrir em nova aba.", { error: true });
      return;
    }
    const newWindow = window.open();
    if (newWindow) {
      const combined = buildPreviewDocument(state.refinedHtml, state.generatedCss);
      newWindow.document.write(combined);
      newWindow.document.close();
    } else {
      setFeedback("Pop-up bloqueado. Por favor, permita pop-ups para este site.", { error: true });
    }
  });
}

window.addEventListener("resize", () => {
  if (state.refinedHtml && state.generatedCss) {
    updatePreviewScale();
  }
});

document.querySelectorAll(".copy-button").forEach(button => {
  button.addEventListener("click", async () => {
    const targetId = button.getAttribute("data-target");
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    try {
      await navigator.clipboard.writeText(targetElement.textContent);
      const originalText = button.textContent;
      button.textContent = "Copiado!";
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error("Falha ao copiar:", err);
      setFeedback("Falha ao copiar para a área de transferência.", { error: true });
    }
  });
});

setPreviewMode(state.previewMode);
resetOrquestradorPanel();

refreshAuthStatus().catch((error) => {
  setFeedback(error.message, { error: true });
});
