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
const { execSync } = require("child_process");
const os = require("os");

// ─── Constants ───────────────────────────────────────────────────────────────

const REPO = "yugasun/aiops";
const HOME = os.homedir();
const VERSION = require("../package.json").version;

// Resolve the aiops root directory (where agents/ and skills/ live)
const AIOps_ROOT = path.resolve(__dirname, "..");

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

const PROVIDERS = [
  {
    id: "claude-code",
    label: "Claude Code",
    detect: () => hasCommand("claude") || hasDir(path.join(HOME, ".claude")),
    skillsProfile: "claude-code",
    globalAgentsDir: path.join(HOME, ".claude", "agents"),
    localAgentsDir: ".claude/agents",
    agentFormat: "md-yaml",
  },
  {
    id: "cursor",
    label: "Cursor",
    detect: () =>
      hasMacApp("Cursor") ||
      hasDir(path.join(HOME, ".cursor")) ||
      hasDir(path.join(HOME, ".agents")),
    skillsProfile: "cursor",
    globalAgentsDir: path.join(HOME, ".cursor", "agents"),
    localAgentsDir: ".cursor/agents",
    agentFormat: "md-yaml",
  },
  {
    id: "copilot",
    label: "GitHub Copilot",
    detect: () => hasDir(path.join(HOME, ".github")) || hasVSCodeExt("github.copilot"),
    skillsProfile: "copilot",
    globalAgentsDir: path.join(HOME, ".github", "agents"),
    localAgentsDir: ".github/agents",
    agentFormat: "md-yaml",
  },
  {
    id: "codex",
    label: "Codex CLI",
    detect: () => hasCommand("codex") || hasDir(path.join(HOME, ".codex")),
    skillsProfile: "codex",
    globalAgentsDir: path.join(HOME, ".codex", "agents"),
    localAgentsDir: ".codex/agents",
    agentFormat: "toml",
  },
];

// ─── Detection Helpers ───────────────────────────────────────────────────────

function hasCommand(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function hasDir(p) {
  return fs.existsSync(p) && fs.statSync(p).isDirectory();
}

function hasMacApp(name) {
  if (process.platform !== "darwin") return false;
  const dirs = ["/Applications", path.join(HOME, "Applications")];
  return dirs.some((d) => fs.existsSync(path.join(d, `${name}.app`)));
}

function hasVSCodeExt(needle) {
  try {
    const out = execSync("code --list-extensions 2>/dev/null || true", {
      encoding: "utf8",
      timeout: 5000,
    });
    return out.toLowerCase().includes(needle.toLowerCase());
  } catch {
    return false;
  }
}

// ─── CLI Parser ──────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {
    all: true,
    ide: null,
    global: true,
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
  --ide <name>       Install to specific IDE: claude-code, cursor, copilot, codex
  -g, --global       Global install to ~/<ide>/ (default)
  --local            Project-local install to ./<ide>/
  --list             List detected IDEs, don't install
  --uninstall        Remove installed agents from all/specified IDEs
  --skills-only      Only install skills (via npx skills)
  --agents-only      Only install agents
  --no-skills        Skip skills installation
  -h, --help         Show this help

${c.bold("Examples:")}
  npx -y github:${REPO}                        # install to all detected IDEs
  npx -y github:${REPO} --ide cursor           # install to Cursor only
  npx -y github:${REPO} --list                 # show what was detected
  npx -y github:${REPO} --uninstall            # remove agents
  curl -fsSL https://raw.githubusercontent.com/${REPO}/main/install.sh | bash
`);
}

// ─── Agent Compiler ──────────────────────────────────────────────────────────

function loadAgents() {
  const agentsDir = path.join(AIOps_ROOT, "agents");
  if (!hasDir(agentsDir)) return [];

  return fs
    .readdirSync(agentsDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const name = path.basename(f, ".md");
      const content = fs.readFileSync(path.join(agentsDir, f), "utf8");

      // Extract description from Identity section (first sentence)
      const identityMatch = content.match(/## Identity\n\n(.+?)(?:\n\n|\n## )/s);
      const identity = identityMatch ? identityMatch[1].trim() : "";
      const desc = identity.split(/[。.]/)[0].slice(0, 120);

      return { name, content, description: desc };
    });
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

function installSkills(provider, isGlobal) {
  const gFlag = isGlobal ? "-g" : "";
  const cmd = `npx -y skills@latest add ${REPO} ${gFlag} -a ${provider.skillsProfile} -y --skill '*' 2>&1`;

  try {
    execSync(cmd, { stdio: "pipe", timeout: 60000 });
    ok(`skills installed via npx skills (${provider.skillsProfile})`);
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString() : err.message;
    fail(`skills install failed: ${stderr.split("\n")[0]}`);
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
    log("Supported: Claude Code, Cursor, GitHub Copilot, Codex CLI");
    log(`Use ${c.cyan("--ide <name>")} to force install to a specific IDE.`);
    process.exit(1);
  }

  // Filter by --ide flag
  const targets = args.ide
    ? detected.filter((p) => p.id === args.ide || p.label.toLowerCase().includes(args.ide.toLowerCase()))
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
  const agents = loadAgents();
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
    }

    log("");
  }

  if (args.uninstall) {
    log(c.green(`Uninstall complete for ${targets.length} IDE(s).`));
  } else {
    log(c.green(`Done: ${totalInstalled} item(s) installed to ${targets.length} IDE(s).`));
  }

  if (totalErrors > 0) {
    log(c.red(`  ${totalErrors} error(s)`));
    process.exit(1);
  }
}

main();
