"use strict";

/**
 * Shared manifest module — single source of truth for skill and agent loading.
 *
 * Eliminates duplicated manifest scanning and description extraction across
 * bin/install.js and scripts/build/*.js. Every consumer reads from here.
 */

const fs = require("fs");
const path = require("path");
const { extractField } = require("../adapters/utils");

// ─── Manifest loading ──────────────────────────────────────────────────────

/**
 * Load and parse skills/manifest.json.
 *
 * @param {string} aiopsRoot - Root directory of the aiops package
 * @returns {Object} parsed manifest
 */
function loadManifest(aiopsRoot) {
  const manifestPath = path.join(aiopsRoot, "skills", "manifest.json");
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

// ─── Skill loading ─────────────────────────────────────────────────────────

/**
 * Load a single skill's SKILL.md with extracted description.
 *
 * @param {string} aiopsRoot - Root directory
 * @param {string} name - Skill name
 * @returns {{ name: string, content: string, description: string } | null}
 */
function loadSkill(aiopsRoot, name) {
  const skillPath = path.join(aiopsRoot, "skills", name, "SKILL.md");
  if (!fs.existsSync(skillPath)) return null;

  const content = fs.readFileSync(skillPath, "utf8");
  const description =
    extractField(content, "description") ||
    _extractDescriptionLegacy(content) ||
    name;

  return { name, content, description };
}

/**
 * Load all always-on tier1 skills from the manifest.
 *
 * @param {string} aiopsRoot - Root directory
 * @returns {{ name: string, content: string, description: string }[]}
 */
function loadAlwaysOnSkills(aiopsRoot) {
  const manifest = loadManifest(aiopsRoot);
  const alwaysOnEntries = (manifest.tier1 || []).filter((s) => s.alwaysOn);
  const skills = [];

  for (const entry of alwaysOnEntries) {
    const skill = loadSkill(aiopsRoot, entry.name);
    if (skill) skills.push(skill);
  }

  return skills;
}

/**
 * Load all tier1 skills from the manifest.
 *
 * @param {string} aiopsRoot - Root directory
 * @returns {{ name: string, content: string, description: string, alwaysOn: boolean }[]}
 */
function loadAllSkills(aiopsRoot) {
  const manifest = loadManifest(aiopsRoot);
  const skills = [];

  for (const entry of manifest.tier1 || []) {
    const skill = loadSkill(aiopsRoot, entry.name);
    if (skill) {
      skills.push({ ...skill, alwaysOn: !!entry.alwaysOn });
    }
  }

  return skills;
}

// ─── Agent loading ─────────────────────────────────────────────────────────

/**
 * Load all agent definitions from agents/*.md.
 *
 * Extracts the first sentence from the ## Identity section as the
 * description — canonical location for agent description derivation.
 *
 * @param {string} aiopsRoot - Root directory
 * @returns {{ name: string, content: string, description: string }[]}
 */
function loadAgents(aiopsRoot) {
  const agentsDir = path.join(aiopsRoot, "agents");
  if (!fs.existsSync(agentsDir)) return [];

  return fs
    .readdirSync(agentsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const name = path.basename(f, ".md");
      const content = fs.readFileSync(path.join(agentsDir, f), "utf8");
      const description = _extractAgentDescription(content);
      return { name, content, description };
    });
}

// ─── Private helpers ───────────────────────────────────────────────────────

/**
 * Legacy description extraction — the regex used across build scripts.
 * Kept as fallback when extractField doesn't match (multi-line > values).
 */
function _extractDescriptionLegacy(content) {
  const descMatch = content.match(
    /^description:\s*>?\s*([\s\S]*?)(?:\n---|\n[a-z])/m
  );
  return descMatch ? descMatch[1].replace(/\n\s+/g, " ").trim() : null;
}

/**
 * Extract agent description from ## Identity section.
 * Takes first sentence (split on . or 。), capped at 120 chars.
 */
function _extractAgentDescription(content) {
  const identityMatch = content.match(/## Identity\n\n(.+?)(?:\n\n|\n## )/s);
  if (!identityMatch) return "";
  const identity = identityMatch[1].trim();
  return identity.split(/[。.]/)[0].slice(0, 120);
}

module.exports = {
  loadManifest,
  loadSkill,
  loadAlwaysOnSkills,
  loadAllSkills,
  loadAgents,
};
