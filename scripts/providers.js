"use strict";

/**
 * IDE provider definitions and detection utilities.
 *
 * Each provider has:
 *   - id, label, aliases: identity
 *   - detect(): returns true if the IDE is installed
 *   - globalAgentsDir, localAgentsDir: agent install paths
 *   - globalSkillsDir, localSkillsDir: skill install paths
 *   - agentFormat: "md-yaml" | "toml"
 */

const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const HOME = os.homedir();

// ─── Detection utilities ─────────────────────────────────────────────────────

function hasCommand(cmd) {
  try {
    execSync(
      process.platform === "win32" ? `where ${cmd}` : `which ${cmd}`,
      { stdio: "ignore" }
    );
    return true;
  } catch {
    return false;
  }
}

function hasDir(p) {
  try {
    return require("fs").statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function hasMacApp(name) {
  if (process.platform !== "darwin") return false;
  return hasDir(`/Applications/${name}.app`) || hasDir(`${HOME}/Applications/${name}.app`);
}

function hasVSCodeExt(needle) {
  try {
    const out = execSync("code --list-extensions 2>/dev/null", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.toLowerCase().includes(needle.toLowerCase());
  } catch {
    return false;
  }
}

// ─── Provider definitions ─────────────────────────────────────────────────────

const PROVIDERS = [
  {
    id: "claude-code",
    label: "Claude Code",
    aliases: ["claude", "claude-code"],
    detect: () => hasCommand("claude") || hasDir(path.join(HOME, ".claude")),
    globalAgentsDir: path.join(HOME, ".claude", "agents"),
    localAgentsDir: ".claude/agents",
    globalSkillsDir: path.join(HOME, ".claude", "skills"),
    localSkillsDir: ".claude/skills",
    agentFormat: "md-yaml",
  },
  {
    id: "cursor",
    label: "Cursor",
    aliases: ["cursor"],
    detect: () =>
      hasMacApp("Cursor") ||
      hasDir(path.join(HOME, ".cursor")) ||
      hasDir(path.join(HOME, ".agents")),
    globalAgentsDir: path.join(HOME, ".cursor", "agents"),
    localAgentsDir: ".cursor/agents",
    globalSkillsDir: path.join(HOME, ".cursor", "skills"),
    localSkillsDir: ".cursor/skills",
    agentFormat: "md-yaml",
  },
  {
    id: "copilot",
    label: "GitHub Copilot",
    aliases: ["copilot", "github-copilot", "github"],
    detect: () => hasDir(path.join(HOME, ".github")) || hasVSCodeExt("github.copilot"),
    globalAgentsDir: path.join(HOME, ".github", "agents"),
    localAgentsDir: ".github/agents",
    globalSkillsDir: path.join(HOME, ".github", "skills"),
    localSkillsDir: ".github/skills",
    agentFormat: "md-yaml",
  },
  {
    id: "codex",
    label: "Codex CLI",
    aliases: ["codex"],
    detect: () =>
      hasCommand("codex") ||
      hasDir(path.join(HOME, ".codex")) ||
      hasDir(path.join(HOME, ".agents")),
    globalAgentsDir: path.join(HOME, ".codex", "agents"),
    localAgentsDir: ".codex/agents",
    globalSkillsDir: path.join(HOME, ".agents", "skills"),
    localSkillsDir: ".agents/skills",
    agentFormat: "toml",
  },
  {
    id: "windsurf",
    label: "Windsurf",
    aliases: ["windsurf"],
    detect: () => hasDir(path.join(HOME, ".windsurf")) || hasMacApp("Windsurf"),
    globalAgentsDir: path.join(HOME, ".windsurf", "agents"),
    localAgentsDir: ".windsurf/agents",
    globalSkillsDir: path.join(HOME, ".windsurf", "skills"),
    localSkillsDir: ".windsurf/skills",
    agentFormat: "md-yaml",
  },
];

module.exports = { PROVIDERS, hasCommand, hasDir, hasMacApp, hasVSCodeExt };
