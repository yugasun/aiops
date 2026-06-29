"use strict";

/**
 * Adapter registry — maps provider IDs to adapter modules.
 *
 * Providers without a dedicated adapter fall back to the default
 * passthrough behavior (copy SKILL.md as-is, compileMdYaml for agents).
 *
 * Windsurf reuses the Cursor .mdc format via createMdcAdapter() —
 * same compilation logic, different rulesDir.
 */

const cursor = require("./cursor");
const copilot = require("./copilot");

// Windsurf: same .mdc format as Cursor, different directory
const windsurf = cursor.createMdcAdapter("windsurf", ".windsurf");

const adapters = {
  cursor,
  copilot,
  windsurf,
};

/**
 * Get the adapter for a provider, or null if no dedicated adapter exists.
 *
 * @param {string} providerId - e.g. "cursor", "copilot", "codex"
 * @returns {Object|null}
 */
function getAdapter(providerId) {
  return adapters[providerId] || null;
}

/**
 * List all registered adapter IDs.
 */
function listAdapters() {
  return Object.keys(adapters);
}

module.exports = { getAdapter, listAdapters };
