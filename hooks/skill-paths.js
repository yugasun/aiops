"use strict";

/**
 * Resolve lean/SKILL.md from installed skill directories.
 * In-repo: paths derived from scripts/providers.js. Installed: inline fallback list.
 */

const path = require("path");
const os = require("os");

function fallbackLeanCandidates(home, cwd) {
  return [
    // Shared project path (vercel-labs/skills universal)
    path.resolve(cwd, ".agents/skills/lean/SKILL.md"),
    path.resolve(cwd, ".claude/skills/lean/SKILL.md"),
    // Legacy project-local paths (pre-shared install)
    path.resolve(cwd, ".cursor/skills/lean/SKILL.md"),
    path.resolve(cwd, ".github/skills/lean/SKILL.md"),
    path.resolve(cwd, ".opencode/skills/lean/SKILL.md"),
    path.join(home, ".agents/skills/lean/SKILL.md"),
    path.join(home, ".claude/skills/lean/SKILL.md"),
    path.join(home, ".cursor/skills/lean/SKILL.md"),
    path.join(home, ".github/skills/lean/SKILL.md"),
    path.join(home, ".config", "opencode", "skills", "lean", "SKILL.md"),
  ];
}

function readLeanSkill(fs, home = os.homedir(), cwd = process.cwd()) {
  try {
    const { PROVIDERS } = require(path.join(__dirname, "..", "scripts", "providers"));
    const { readLeanSkill: readFromProviders } = require(
      path.join(__dirname, "..", "scripts", "lib", "skill-paths")
    );
    const content = readFromProviders(fs, home, cwd, PROVIDERS);
    if (content) return content;
  } catch {
    // Installed hook copy — no scripts/ tree
  }

  for (const candidate of fallbackLeanCandidates(home, cwd)) {
    if (fs.existsSync(candidate)) {
      return fs.readFileSync(candidate, "utf8");
    }
  }
  return null;
}

module.exports = { readLeanSkill };
