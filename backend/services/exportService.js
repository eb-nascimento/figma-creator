const fs = require("node:fs/promises");
const path = require("node:path");
const { exec } = require("node:child_process");
const { getConsolidated } = require("./candidateStore");

class ExportServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "ExportServiceError";
    this.statusCode = statusCode;
  }
}

// 1. High-Performance, Dependency-Free ZIP Encoder in Pure JS
function getCrc32(buffer) {
  let table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buffer.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buffer[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

function generateZipBuffer(files = []) {
  const localHeaders = [];
  const centralDirectories = [];
  let offset = 0;

  for (const file of files) {
    const filenameBuf = Buffer.from(file.name, "utf-8");
    const contentBuf = Buffer.from(file.content, "utf-8");
    const crc = getCrc32(contentBuf);
    
    const dosTime = 0x2100; // Mock DOS time
    const dosDate = 0x5C21; // Mock DOS date (2026-01-01)

    // A. Build Local File Header
    const lfHeader = Buffer.alloc(30);
    lfHeader.writeUInt32LE(0x04034b50, 0); // Signature
    lfHeader.writeUInt16LE(10, 4);          // Version needed
    lfHeader.writeUInt16LE(0, 6);           // General purpose bit flag
    lfHeader.writeUInt16LE(0, 8);           // Compression method (0 = Stored/Uncompressed)
    lfHeader.writeUInt16LE(dosTime, 10);    // Last mod time
    lfHeader.writeUInt16LE(dosDate, 12);    // Last mod date
    lfHeader.writeUInt32LE(crc, 14);        // CRC-32
    lfHeader.writeUInt32LE(contentBuf.length, 18); // Compressed size
    lfHeader.writeUInt32LE(contentBuf.length, 22); // Uncompressed size
    lfHeader.writeUInt16LE(filenameBuf.length, 26); // Filename length
    lfHeader.writeUInt16LE(0, 28);          // Extra field length

    const lfRecord = Buffer.concat([lfHeader, filenameBuf, contentBuf]);
    localHeaders.push(lfRecord);

    // B. Build Central Directory File Header
    const cdHeader = Buffer.alloc(46);
    cdHeader.writeUInt32LE(0x02014b50, 0); // Signature
    cdHeader.writeUInt16LE(20, 4);          // Version made by
    cdHeader.writeUInt16LE(10, 6);          // Version needed
    cdHeader.writeUInt16LE(0, 8);           // General purpose bit flag
    cdHeader.writeUInt16LE(0, 10);          // Compression method
    cdHeader.writeUInt16LE(dosTime, 12);    // Last mod time
    cdHeader.writeUInt16LE(dosDate, 14);    // Last mod date
    cdHeader.writeUInt32LE(crc, 16);        // CRC-32
    cdHeader.writeUInt32LE(contentBuf.length, 20); // Compressed size
    cdHeader.writeUInt32LE(contentBuf.length, 24); // Uncompressed size
    cdHeader.writeUInt16LE(filenameBuf.length, 28); // Filename length
    cdHeader.writeUInt16LE(0, 30);          // Extra field length
    cdHeader.writeUInt16LE(0, 32);          // File comment length
    cdHeader.writeUInt16LE(0, 34);          // Disk number start
    cdHeader.writeUInt16LE(0, 36);          // Internal file attributes
    cdHeader.writeUInt32LE(0, 38);          // External file attributes
    cdHeader.writeUInt32LE(offset, 42);     // Local header offset

    const cdRecord = Buffer.concat([cdHeader, filenameBuf]);
    centralDirectories.push(cdRecord);

    offset += lfRecord.length;
  }

  const lhBuffer = Buffer.concat(localHeaders);
  const cdBuffer = Buffer.concat(centralDirectories);

  // C. Build End of Central Directory Record
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);  // Signature
  eocd.writeUInt16LE(0, 4);           // Number of this disk
  eocd.writeUInt16LE(0, 6);           // Disk where central dir starts
  eocd.writeUInt16LE(files.length, 8); // Number of central dir records on this disk
  eocd.writeUInt16LE(files.length, 10); // Total number of central dir records
  eocd.writeUInt32LE(cdBuffer.length, 12); // Size of central directory
  eocd.writeUInt32LE(lhBuffer.length, 16); // Offset of start of central directory, relative to start of archive
  eocd.writeUInt16LE(0, 20);          // Comment length

  return Buffer.concat([lhBuffer, cdBuffer, eocd]);
}

function getConsolidatedFiles() {
  const consolidated = getConsolidated();
  if (!consolidated) {
    throw new ExportServiceError("Consolidacao do RF11.2 nao encontrada. Realize o Merge Hibrido primeiro.", 400);
  }
  return [
    { name: "index.html", content: consolidated.html },
    { name: "styles.css", content: consolidated.css },
  ];
}

async function exportToZip() {
  const files = getConsolidatedFiles();
  return generateZipBuffer(files);
}

function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || error.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

async function exportToGitLocal(workspaceRoot) {
  const files = getConsolidatedFiles();
  const exportDir = path.resolve(workspaceRoot, "exported_project");

  // Create clean directory
  await fs.mkdir(exportDir, { recursive: true });

  // Write files
  for (const file of files) {
    await fs.writeFile(path.join(exportDir, file.name), file.content, "utf-8");
  }

  // Initialize and commit local Git repo
  const logs = [];
  try {
    const initLog = await runCommand("git init", exportDir);
    logs.push(`[Git] ${initLog}`);

    // Set mock author to avoid committing issues if git settings are missing
    await runCommand('git config user.name "Figma Creator"', exportDir);
    await runCommand('git config user.email "figma-creator@local.com"', exportDir);

    await runCommand("git add .", exportDir);
    const commitLog = await runCommand('git commit -m "Commit inicial - Figma Creator Merge Hibrido"', exportDir);
    logs.push(`[Git] ${commitLog}`);
  } catch (error) {
    throw new ExportServiceError(`Erro ao inicializar repositorio Git: ${error.message}`, 500);
  }

  return {
    success: true,
    path: exportDir,
    logs,
  };
}

module.exports = {
  ExportServiceError,
  exportToZip,
  exportToGitLocal,
  generateZipBuffer,
};
