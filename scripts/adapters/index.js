"use strict";

/**
 * Adapter registry — maps provider IDs to adapter modules.
 *
 * Providers without a dedicated adapter fall back to the default
 * passthrough behavior (copy SKILL.md as-is, compileMdYaml for agents).
 */

const cursor = require("./cursor");
const copilot = require("./copilot");
const defaultAdapter = require("./default");

const adapters = {
  cursor,
  copilot,
};

/**
 * Get the adapter for a provider. Falls back to default passthrough adapter.
 *
 * @param {string} providerId - e.g. "cursor", "copilot", "codex"
 * @returns {Object}
 */
function getAdapter(providerId) {
  return adapters[providerId] || defaultAdapter;
}

/**
 * List all registered adapter IDs.
 */
function listAdapters() {
  return Object.keys(adapters);
}

module.exports = { getAdapter, listAdapters };
