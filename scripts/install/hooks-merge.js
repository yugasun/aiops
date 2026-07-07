"use strict";

/** Substrings that identify aiops-owned hook commands (used for merge + uninstall). */
const AIOPS_HOOK_MARKERS = [
  "aiops-activate.js",
  "aiops-graph.js",
  "aiops-subagent.js",
];

function isAiopsHook(hook) {
  if (!hook || typeof hook.command !== "string") return false;
  return AIOPS_HOOK_MARKERS.some((m) => hook.command.includes(m));
}

function isAiopsHookGroup(group) {
  if (!group || !Array.isArray(group.hooks)) return false;
  return group.hooks.some(isAiopsHook);
}

function mergeHooksConfig(existing, incoming) {
  const result =
    existing && existing.hooks
      ? JSON.parse(JSON.stringify(existing))
      : { hooks: {} };
  if (!result.hooks) result.hooks = {};

  const incomingHooks = (incoming && incoming.hooks) || {};

  for (const [event, incomingGroups] of Object.entries(incomingHooks)) {
    const existingGroups = Array.isArray(result.hooks[event])
      ? result.hooks[event]
      : [];
    const preserved = existingGroups.filter((g) => !isAiopsHookGroup(g));
    const aiopsGroups = incomingGroups.filter((g) => isAiopsHookGroup(g));
    result.hooks[event] = [...preserved, ...aiopsGroups];
  }

  return result;
}

function stripAiopsHooks(config) {
  if (!config || !config.hooks) return { hooks: {} };

  const result = { hooks: {} };
  for (const [event, groups] of Object.entries(config.hooks)) {
    if (!Array.isArray(groups)) continue;
    const preserved = groups.filter((g) => !isAiopsHookGroup(g));
    if (preserved.length > 0) result.hooks[event] = preserved;
  }
  return result;
}

function parseHooksConfig(content) {
  const parsed = JSON.parse(content);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("hooks config must be a JSON object");
  }
  return parsed;
}

function isEmptyHooksConfig(config) {
  const hooks = config && config.hooks;
  if (!hooks || typeof hooks !== "object") return true;
  return Object.keys(hooks).length === 0;
}

module.exports = {
  AIOPS_HOOK_MARKERS,
  isAiopsHook,
  isAiopsHookGroup,
  mergeHooksConfig,
  stripAiopsHooks,
  parseHooksConfig,
  isEmptyHooksConfig,
};
