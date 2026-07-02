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
    hooksDir: path.join(HOME, ".claude", "hooks"),
    localHooksDir: ".claude/hooks",
    hooksConfigFile: path.join(HOME, ".claude", "hooks.json"),
    localHooksConfigFile: ".claude/hooks.json",
    hooksConfigTemplate: "claude-codex",
    agentFormat: "md-yaml",
  },
  {
    id: "cursor",
    label: "Cursor",
    aliases: ["cursor"],
    detect: () =>
      hasMacApp("Cursor") ||
      hasDir(path.join(HOME, ".cursor")),
    globalAgentsDir: path.join(HOME, ".cursor", "agents"),
    localAgentsDir: ".cursor/agents",
    globalSkillsDir: path.join(HOME, ".cursor", "skills"),
    localSkillsDir: ".cursor/skills",
    hooksDir: path.join(HOME, ".cursor", "hooks"),
    localHooksDir: ".cursor/hooks",
    hooksConfigFile: path.join(HOME, ".cursor", "hooks.json"),
    localHooksConfigFile: ".cursor/hooks.json",
    hooksConfigTemplate: null,
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
    hooksDir: path.join(HOME, ".github", "hooks"),
    localHooksDir: ".github/hooks",
    hooksConfigFile: path.join(HOME, ".github", "hooks.json"),
    localHooksConfigFile: ".github/hooks.json",
    hooksConfigTemplate: null,
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
    hooksDir: path.join(HOME, ".codex", "hooks"),
    localHooksDir: ".codex/hooks",
    hooksConfigFile: path.join(HOME, ".codex", "hooks.json"),
    localHooksConfigFile: ".codex/hooks.json",
    hooksConfigTemplate: "claude-codex",
    agentFormat: "toml",
  },
  {
    id: "opencode",
    label: "OpenCode",
    aliases: ["opencode"],
    detect: () =>
      hasCommand("opencode") ||
      hasDir(path.join(HOME, ".config", "opencode")) ||
      hasDir(path.join(HOME, ".opencode")),
    globalAgentsDir: path.join(HOME, ".config", "opencode", "agents"),
    localAgentsDir: ".opencode/agents",
    globalSkillsDir: path.join(HOME, ".config", "opencode", "skills"),
    localSkillsDir: ".opencode/skills",
    hooksDir: null,
    localHooksDir: null,
    hooksConfigFile: null,
    localHooksConfigFile: null,
    agentFormat: "md-yaml",
  },
];

function leanSkillCandidates(home = HOME, cwd = process.cwd()) {
  const { leanSkillCandidates: build } = require("./lib/skill-paths");
  return build(PROVIDERS, home, cwd);
}

module.exports = { PROVIDERS, hasCommand, hasDir, hasMacApp, hasVSCodeExt, leanSkillCandidates };
