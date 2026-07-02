"use strict";

const path = require("path");

let stripFrontmatter;
try {
  stripFrontmatter = require(path.resolve(
    __dirname, "..", "scripts", "adapters", "utils"
  )).stripFrontmatter;
} catch {
  stripFrontmatter = (content) => {
    if (!content.startsWith("---")) return content;
    const second = content.indexOf("---", 3);
    if (second === -1) return content;
    return content.slice(second + 3).trimStart();
  };
}

module.exports = { stripFrontmatter };
