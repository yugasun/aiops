"use strict";

/**
 * Skill install path helpers — derived from provider localSkillsDir / globalSkillsDir.
 * Copied to hooks/ on install (see bin/install.js installHooks).
 */

const path = require("path");

/**
 * Candidate paths for skills/<name>/SKILL.md across project-local then global installs.
 *
 * @param {object[]} providers - PROVIDERS from scripts/providers.js
 * @param {string} skillName - e.g. "lean"
 * @param {string} home - os.homedir()
 * @param {string} [cwd] - project root for local paths
 * @returns {string[]}
 */
function skillCandidates(providers, skillName, home, cwd = process.cwd()) {
  const candidates = [];
  const seen = new Set();

  for (const provider of providers) {
    if (!provider.localSkillsDir && !provider.globalSkillsDir) continue;

    const bases = [];
    if (provider.localSkillsDir) {
      bases.push(path.resolve(cwd, provider.localSkillsDir));
    }
    if (provider.globalSkillsDir) {
      bases.push(provider.globalSkillsDir);
    }

    for (const base of bases) {
      const candidate = path.join(base, skillName, "SKILL.md");
      if (!seen.has(candidate)) {
        seen.add(candidate);
        candidates.push(candidate);
      }
    }
  }

  return candidates;
}

/** @returns {string[]} paths for lean/SKILL.md */
function leanSkillCandidates(providers, home, cwd = process.cwd()) {
  return skillCandidates(providers, "lean", home, cwd);
}

/**
 * Read first existing lean SKILL.md from candidate paths.
 *
 * @param {typeof import("fs")} fs
 * @returns {string|null} file content
 */
function readLeanSkill(fs, home, cwd, providers) {
  for (const candidate of leanSkillCandidates(providers, home, cwd)) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, "utf8");
    }
  }
  return null;
}

module.exports = { skillCandidates, leanSkillCandidates, readLeanSkill };
