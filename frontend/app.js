const state = {
  fileUrl: "",
  frames: [],
  extractedStructure: null,
  generatingHtml: false,
  generatedHtml: null,
  refiningHtml: false,
  selectedFrame: null,
  selectedFrameId: null,
  selectingFrameId: null,
  extractingStructure: false,
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
  selectedId: document.querySelector("#selected-id"),
  selectedName: document.querySelector("#selected-name"),
  selectedPage: document.querySelector("#selected-page"),
  selectionDetails: document.querySelector("#selection-details"),
  selectionEmpty: document.querySelector("#selection-empty"),
  structureJson: document.querySelector("#structure-json"),
  structureSummary: document.querySelector("#structure-summary"),
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
}

function resetRefinedHtmlPanel() {
  elements.refineHtmlButton.disabled = true;
  elements.refinedHtml.textContent = state.generatedHtml
    ? "Refine o HTML gerado antes de seguir para o CSS."
    : "Gere o HTML antes de refinar.";
}

function renderRefinedHtml(payload) {
  elements.refinedHtml.textContent = payload.html;
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

    renderRefinedHtml(payload);
    setFeedback("HTML refinado com sucesso.");
  } catch (error) {
    setFeedback(error.message, { error: true });
  } finally {
    setRefineHtmlLoading(false);
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

refreshAuthStatus().catch((error) => {
  setFeedback(error.message, { error: true });
});
