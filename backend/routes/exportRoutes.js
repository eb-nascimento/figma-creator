const path = require("node:path");
const { getConsolidated } = require("../services/candidateStore");
const { DEBUG_LOG_FILE, appendDebugLog } = require("../services/debugLogger");
const { exportToZip, exportToGitLocal } = require("../services/exportService");

async function handleExportZip(request, response) {
  try {
    const zipBuffer = await exportToZip();
    const consolidated = getConsolidated();
    appendDebugLog("export.zip", {
      output: "projeto_consolidado.zip",
      sizeBytes: zipBuffer.length,
      files: {
        "index.html": consolidated?.html || "",
        "styles.css": consolidated?.css || "",
      },
    });
    response.writeHead(200, {
      "Content-Type": "application/zip; charset=utf-8",
      "Content-Disposition": 'attachment; filename="projeto_consolidado.zip"',
      "Access-Control-Allow-Origin": "*",
    });
    response.end(zipBuffer);
  } catch (error) {
    response.writeHead(error.statusCode || 500, {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    });
    response.end(JSON.stringify({ error: error.message || "Erro ao exportar ZIP." }));
  }
}

async function handleExportGit(requestBody) {
  // Resolve workspace root
  const workspaceRoot = path.resolve(__dirname, "..", "..");
  const result = await exportToGitLocal(workspaceRoot);
  const consolidated = getConsolidated();
  appendDebugLog("export.git.local", {
    result,
    files: {
      "index.html": consolidated?.html || "",
      "styles.css": consolidated?.css || "",
    },
  });
  return {
    ...result,
    debugLog: DEBUG_LOG_FILE,
  };
}

module.exports = {
  handleExportZip,
  handleExportGit,
};
