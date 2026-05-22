const store = {
  jsVersion: null,    // { html, css }
  iaCandidate: null,  // { html, css, patches, metadata }
  consolidated: null, // { html, css, logs }
};

function saveJsVersion(html, css) {
  store.jsVersion = { html, css };
  return store.jsVersion;
}

function getJsVersion() {
  return store.jsVersion;
}

function saveIaCandidate(html, css, metadata = {}, patches = []) {
  store.iaCandidate = {
    html,
    css,
    patches,
    metadata: {
      origem: "ia-mcp",
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
  return store.iaCandidate;
}

function getIaCandidate() {
  return store.iaCandidate;
}

function saveConsolidated(html, css, logs = []) {
  store.consolidated = { html, css, logs };
  return store.consolidated;
}

function getConsolidated() {
  return store.consolidated;
}

function clearStore() {
  store.jsVersion = null;
  store.iaCandidate = null;
  store.consolidated = null;
}

module.exports = {
  saveJsVersion,
  getJsVersion,
  saveIaCandidate,
  getIaCandidate,
  saveConsolidated,
  getConsolidated,
  clearStore,
};
