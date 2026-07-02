#!/usr/bin/env node

/**
 * aiops installer — detects AI IDEs and installs skills + agents
 *
 * Usage:
 *   npx -y github:yugasun/aiops [flags]
 *   node bin/install.js [flags]
 *
 * Flags:
 *   --all              Install to all detected IDEs (default)
 *   --ide <name>       Install to specific IDE only
 *   -g, --global       Global install (default)
 *   --local            Project-local install
 *   --list             List detected IDEs, don't install
 *   --uninstall        Remove installed agents
 *   --skills-only      Only install skills
 *   --agents-only      Only install agents
 *   --no-skills        Skip skills installation
 *   -h, --help         Show help
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

// ─── Constants ───────────────────────────────────────────────────────────────

const REPO = "yugasun/aiops";
const HOME = os.homedir();
const VERSION = require("../package.json").version;

// Resolve the aiops root directory (where agents/ and skills/ live)
const AIOps_ROOT = path.resolve(__dirname, "..");

// Adapter registry — converts skills to IDE-native formats
const { getAdapter } = require("../scripts/adapters");

// Shared manifest module — single source of truth for skill and agent loading
const {
  loadAgents: loadAgentsFromManifest,
  loadAllSkills,
} = require("../scripts/lib/manifest");

// ─── Color helpers ───────────────────────────────────────────────────────────

const c = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

function log(msg) { console.log(msg); }
function ok(msg) { console.log(`  ${c.green("✓")} ${msg}`); }
function skip(msg) { console.log(`  ${c.yellow("–")} ${msg}`); }
function fail(msg) { console.log(`  ${c.red("✗")} ${msg}`); }

// ─── IDE Provider Definitions ────────────────────────────────────────────────

const { PROVIDERS, hasCommand, hasDir } = require("../scripts/providers");

// ─── CLI Parser ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    all: true,
    ide: null,
    global: false,
    list: false,
    uninstall: false,
    skillsOnly: false,
    agentsOnly: false,
    noSkills: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case "--all":
        args.all = true;
        break;
      case "--ide":
        args.ide = argv[++i];
        args.all = false;
        break;
      case "-g":
      case "--global":
        args.global = true;
        break;
      case "--local":
        args.global = false;
        break;
      case "--list":
        args.list = true;
        break;
      case "--uninstall":
        args.uninstall = true;
        break;
      case "--skills-only":
        args.skillsOnly = true;
        break;
      case "--agents-only":
        args.agentsOnly = true;
        break;
      case "--no-skills":
        args.noSkills = true;
        break;
      case "-h":
      case "--help":
        args.help = true;
        break;
    }
  }
  return args;
}

function showHelp() {
  console.log(`
${c.bold("aiops")} v${VERSION} — AI-assisted dev workflow installer

${c.bold("Usage:")}
  npx -y github:${REPO} [flags]

${c.bold("Flags:")}
  --all              Install to all detected IDEs (default)
  --ide <name>       Install to specific IDE: claude, cursor, copilot, codex
  -g, --global       Global install to ~/<ide>/
  --local            Project-local install to ./<ide>/ (default)
  --list             List detected IDEs, don't install
  --uninstall        Remove installed agents from all/specified IDEs
  --skills-only      Only install skills
  --agents-only      Only install agents
  --no-skills        Skip skills installation
  -h, --help         Show this help

${c.bold("Examples:")}
  npx -y github:${REPO}                        # install to current project
  npx -y github:${REPO} --ide claude            # install to Claude Code only
  npx -y github:${REPO} -g                      # global install to ~/<ide>/
  npx -y github:${REPO} --list                  # show what was detected
  npx -y github:${REPO} --uninstall             # remove installed files
`);
}

function compileMdYaml(agent) {
  return `---
name: ${agent.name}
description: "${agent.description}"
---

${agent.content}`;
}

function compileToml(agent) {
  const escaped = agent.content.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `name = "${agent.name}"
description = "${agent.description}"
developer_instructions = """
${agent.content}
"""
`;
}

// ─── Install Actions ─────────────────────────────────────────────────────────

function installAgents(provider, agents, isGlobal) {
  const destDir = isGlobal
    ? provider.globalAgentsDir
    : path.resolve(provider.localAgentsDir);

  fs.mkdirSync(destDir, { recursive: true });

  for (const agent of agents) {
    let filename, content;

    if (provider.agentFormat === "toml") {
      filename = `${agent.name}.toml`;
      content = compileToml(agent);
    } else {
      filename = `${agent.name}.md`;
      content = compileMdYaml(agent);
    }

    fs.writeFileSync(path.join(destDir, filename), content, "utf8");
    ok(`${agent.name}${path.extname(filename)} → ${c.dim(destDir)}`);
  }
}

function uninstallAgents(provider, agents, isGlobal) {
  const destDir = isGlobal
    ? provider.globalAgentsDir
    : path.resolve(provider.localAgentsDir);

  if (!hasDir(destDir)) {
    skip(`${destDir} not found`);
    return;
  }

  for (const agent of agents) {
    const ext = provider.agentFormat === "toml" ? ".toml" : ".md";
    const filePath = path.join(destDir, `${agent.name}${ext}`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      ok(`removed ${agent.name}${ext}`);
    }
  }
}

/**
 * Install AGENTS.md for providers that use it instead of standalone agent files
 * (e.g. Codex CLI reads AGENTS.md from project root or ~/.codex/AGENTS.md).
 */
function installAgentsMd(provider, isGlobal) {
  const agentsMdPath = path.join(AIOps_ROOT, "AGENTS.md");
  if (!fs.existsSync(agentsMdPath)) {
    skip("no AGENTS.md found (run: node scripts/build/build-agents-md.js)");
    return;
  }

  let destPath;
  if (isGlobal) {
    // Global: write to provider's config directory
    if (provider.id === "codex") {
      destPath = path.join(HOME, ".codex", "AGENTS.md");
    } else {
      return; // No global AGENTS.md convention for other providers
    }
  } else {
    // Local: write to project root
    destPath = path.resolve("AGENTS.md");
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(agentsMdPath, destPath);
  ok(`AGENTS.md → ${c.dim(path.dirname(destPath))}`);
}

function installSkills(provider, isGlobal) {
  const skillsDir = path.join(AIOps_ROOT, "skills");
  if (!hasDir(skillsDir)) {
    skip("no skills/ directory found");
    return;
  }

  const destBase = isGlobal
    ? provider.globalSkillsDir
    : path.resolve(provider.localSkillsDir);

  fs.mkdirSync(destBase, { recursive: true });

  // Use shared manifest module for skill loading
  const allSkills = loadAllSkills(AIOps_ROOT);
  const adapter = getAdapter(provider.id);

  const alwaysOnSkills = allSkills.filter((s) => s.alwaysOn);
  const regularSkills = allSkills.filter((s) => !s.alwaysOn);

  // ── Regular skills: copy as-is ──
  for (const skill of regularSkills) {
    const srcDir = path.join(skillsDir, skill.name);
    if (!hasDir(srcDir)) continue;

    const destDir = path.join(destBase, skill.name);
    fs.mkdirSync(destDir, { recursive: true });
    copyDirSync(srcDir, destDir);
    ok(`${skill.name}/ → ${c.dim(destDir)}`);
  }

  // ── Always-on skills: delegate to adapter ──
  if (alwaysOnSkills.length > 0 && adapter && adapter.installAlwaysOn) {
    const dest = adapter.installAlwaysOn(alwaysOnSkills, { isGlobal });
    ok(`${alwaysOnSkills.length} always-on skill(s) → ${c.dim(dest)}`);
  }
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  log(c.bold(`aiops installer v${VERSION}`));
  log("");

  // Detect IDEs
  const detected = PROVIDERS.filter((p) => p.detect());

  if (detected.length === 0) {
    log(c.red("No supported AI IDEs detected."));
    log("Supported: Claude Code, Cursor, GitHub Copilot, Codex CLI, Windsurf");
    log(`Use ${c.cyan("--ide <name>")} to force install to a specific IDE.`);
    process.exit(1);
  }

  // Filter by --ide flag (supports aliases like "claude" → "claude-code")
  const targets = args.ide
    ? detected.filter((p) =>
        p.id === args.ide ||
        p.label.toLowerCase().includes(args.ide.toLowerCase()) ||
        (p.aliases && p.aliases.some((a) => a === args.ide.toLowerCase()))
      )
    : detected;

  if (args.ide && targets.length === 0) {
    log(c.red(`IDE "${args.ide}" not detected or not supported.`));
    log(`Detected: ${detected.map((p) => p.id).join(", ")}`);
    log(`Supported: ${PROVIDERS.map((p) => p.id).join(", ")}`);
    process.exit(1);
  }

  // --list mode
  if (args.list) {
    log(c.bold("Detected AI IDEs:"));
    for (const p of PROVIDERS) {
      const status = p.detect() ? c.green("detected") : c.dim("not found");
      log(`  ${status}  ${p.label} (${p.id})`);
    }
    log("");
    log(c.bold("Install targets:"));
    for (const t of targets) {
      const dest = args.global ? t.globalAgentsDir : t.localAgentsDir;
      log(`  → ${t.label}: ${c.dim(dest)}`);
    }
    process.exit(0);
  }

  // Load agents
  const agents = loadAgentsFromManifest(AIOps_ROOT);
  if (agents.length === 0) {
    log(c.yellow("Warning: no agent definitions found in agents/"));
  }

  const mode = args.global ? "global" : "project-local";
  log(c.bold(`Mode: ${mode}  |  Targets: ${targets.map((t) => t.id).join(", ")}`));
  log("");

  let totalInstalled = 0;
  let totalErrors = 0;

  for (const provider of targets) {
    log(c.bold(`[${provider.label}]`));

    // Install skills
    if (!args.agentsOnly && !args.noSkills) {
      installSkills(provider, args.global);
      totalInstalled++;
    }

    // Install agents
    if (!args.skillsOnly) {
      if (args.uninstall) {
        uninstallAgents(provider, agents, args.global);
      } else {
        installAgents(provider, agents, args.global);
        totalInstalled += agents.length;
      }
      // Also install AGENTS.md as a supplement (protocol file for generic harnesses)
      installAgentsMd(provider, args.global);
    }

    log("");
  }

  if (args.uninstall) {
    log(c.green(`Uninstall complete for ${targets.length} IDE(s).`));
    log(c.dim("Note: skills directories are not removed by --uninstall; delete .cursor/skills/aiops etc. manually if needed."));
  } else {
    log(c.green(`Done: ${totalInstalled} item(s) installed to ${targets.length} IDE(s).`));
    log("");
    log(c.bold("Next:") + " Open your project, restart the IDE, then chat:");
    log(c.cyan("  /aiops <用中文描述你想做什么>"));
    log(c.dim("  Resume: /aiops 继续  ·  Docs: github.com/yugasun/aiops"));
  }

  if (totalErrors > 0) {
    log(c.red(`  ${totalErrors} error(s)`));
    process.exit(1);
  }
}

main();
