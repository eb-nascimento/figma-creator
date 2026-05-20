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
};

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

  if (elements.previewStatus) {
    elements.previewStatus.textContent = "Gere HTML refinado e CSS para visualizar.";
    elements.previewStatus.classList.remove("error");
  }
}

state.previewFitMode = "fit"; // default

function updatePreviewScale() {
  const iframe = elements.previewFrame;
  const shell = elements.previewFrameShell;
  const wrapper = document.querySelector("#preview-wrapper");
  if (!iframe || !shell || !wrapper) return;

  // Obter dimensões originais do figma
  const figmaWidth = (state.extractedStructure && state.extractedStructure.layout && state.extractedStructure.layout.width) || 1920;
  const figmaHeight = (state.extractedStructure && state.extractedStructure.layout && state.extractedStructure.layout.height) || 1080;

  if (state.previewFitMode === "real") {
    // Tamanho real com scroll
    wrapper.style.width = `${figmaWidth}px`;
    wrapper.style.height = `${figmaHeight}px`;
    wrapper.style.transform = "none";
    wrapper.style.marginRight = "0";
    wrapper.style.marginBottom = "0";
    shell.style.overflow = "auto";
    shell.style.height = "auto";
    shell.style.minHeight = "660px";
  } else {
    // Ajustar à tela com transform: scale
    const shellWidth = shell.clientWidth - 24; // padding correction
    
    const scale = Math.min(shellWidth / figmaWidth, 1);

    wrapper.style.width = `${figmaWidth}px`;
    wrapper.style.height = `${figmaHeight}px`;
    wrapper.style.transform = `scale(${scale})`;
    wrapper.style.marginRight = `-${figmaWidth * (1 - scale)}px`;
    wrapper.style.marginBottom = `-${figmaHeight * (1 - scale)}px`;
    
    shell.style.overflow = "hidden";
    shell.style.height = `${figmaHeight * scale + 24}px`;
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
  const styleTag = `<style>${safeCss}</style>`;

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
    elements.previewFrame.srcdoc = buildPreviewDocument(state.refinedHtml, state.generatedCss);
    
    // Agendar o cálculo de escala assim que o iframe renderizar
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
    const modeSelect = document.querySelector("#generation-mode");
    const mode = modeSelect ? modeSelect.value : "visual-first";
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
  const modeSelect = document.querySelector("#generation-mode");
  const mode = modeSelect ? modeSelect.value : "visual-first";

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

refreshAuthStatus().catch((error) => {
  setFeedback(error.message, { error: true });
});
