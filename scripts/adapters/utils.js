"use strict";

/**
 * Shared adapter utilities — stripFrontmatter and extractField.
 *
 * These pure functions are used by all adapters and hooks.
 * One definition, many consumers.
 */

/**
 * Strip YAML frontmatter (---...---) from markdown content.
 */
function stripFrontmatter(content) {
  if (!content.startsWith("---")) return content;
  const second = content.indexOf("---", 3);
  if (second === -1) return content;
  return content.slice(second + 3).trimStart();
}

/**
 * Extract a field from YAML frontmatter.
 */
function extractField(content, field) {
  if (!content.startsWith("---")) return null;
  const end = content.indexOf("---", 3);
  if (end === -1) return null;
  const fm = content.slice(3, end);
  // Simple field extraction — handles single-line and multi-line (>) values
  const re = new RegExp(`^${field}:\\s*(.+?)$`, "m");
  const m = fm.match(re);
  if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  // Multi-line with >
  const mlRe = new RegExp(`^${field}:\\s*>\\s*\\n((?:\\s+.+\\n)*)`, "m");
  const ml = fm.match(mlRe);
  if (ml) return ml[1].replace(/^\s{2}/gm, "").trim();
  return null;
}

module.exports = { stripFrontmatter, extractField };
