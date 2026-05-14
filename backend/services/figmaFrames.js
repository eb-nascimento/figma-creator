function extractMainFrames(figmaFile) {
  const pages = figmaFile && figmaFile.document && figmaFile.document.children;

  if (!Array.isArray(pages)) {
    return [];
  }

  return pages.flatMap((page) => {
    if (!page || page.type !== "CANVAS" || !Array.isArray(page.children)) {
      return [];
    }

    return page.children
      .filter((node) => node && node.type === "FRAME")
      .map((frame) => ({
        id: frame.id,
        name: frame.name,
      }));
  });
}

module.exports = {
  extractMainFrames,
};
