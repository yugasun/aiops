#!/usr/bin/env node

/**
 * aiops installer — detects AI IDEs and installs skills + agents
 */

"use strict";

const fs = require("fs");
const path = require("path");

const REPO = "yugasun/aiops";
const VERSION = require("../package.json").version;
const AIOps_ROOT = path.resolve(__dirname, "..");

const { PROVIDERS } = require("../scripts/providers");
const {
  loadAgents: loadAgentsFromManifest,
  loadAllSkills,
} = require("../scripts/lib/manifest");
const { log, c } = require("../scripts/install/console");
const { installAgents, uninstallAgents } = require("../scripts/install/agents");
const {
  installSkills,
  uninstallSkills,
  installAgentsMd,
} = require("../scripts/install/skills");
const { installHooks, uninstallHooks } = require("../scripts/install/hooks");
const { hasDir } = require("../scripts/providers");

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
`);
}

function filterTargets(detected, ide) {
  if (!ide) return detected;
  return detected.filter(
    (p) =>
      p.id === ide ||
      p.label.toLowerCase().includes(ide.toLowerCase()) ||
      (p.aliases && p.aliases.some((a) => a === ide.toLowerCase()))
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  log.msg(c.bold(`aiops installer v${VERSION}`));
  log.msg("");

  const detected = PROVIDERS.filter((p) => p.detect());
  if (detected.length === 0) {
    log.msg(c.red("No supported AI IDEs detected."));
    log.msg("Supported: Claude Code, Cursor, GitHub Copilot, Codex CLI, OpenCode");
    process.exit(1);
  }

  const targets = filterTargets(detected, args.ide);
  if (args.ide && targets.length === 0) {
    log.msg(c.red(`IDE "${args.ide}" not detected or not supported.`));
    process.exit(1);
  }

  if (args.list) {
    log.msg(c.bold("Detected AI IDEs:"));
    for (const p of PROVIDERS) {
      const status = p.detect() ? c.green("detected") : c.dim("not found");
      log.msg(`  ${status}  ${p.label} (${p.id})`);
    }
    process.exit(0);
  }

  const agents = loadAgentsFromManifest(AIOps_ROOT);
  const mode = args.global ? "global" : "project-local";
  log.msg(c.bold(`Mode: ${mode}  |  Targets: ${targets.map((t) => t.id).join(", ")}`));
  log.msg("");

  let totalInstalled = 0;

  for (const provider of targets) {
    log.msg(c.bold(`[${provider.label}]`));

    if (!args.agentsOnly && !args.noSkills) {
      if (args.uninstall) {
        uninstallSkills(fs, AIOps_ROOT, provider, args.global, loadAllSkills, hasDir, log);
        uninstallHooks(fs, provider, args.global, hasDir, log);
      } else {
        installSkills(fs, AIOps_ROOT, provider, args.global, loadAllSkills, hasDir, log);
        installHooks(fs, AIOps_ROOT, provider, args.global, hasDir, log);
        totalInstalled++;
      }
    }

    if (!args.skillsOnly) {
      if (args.uninstall) {
        uninstallAgents(fs, provider, agents, args.global, hasDir, log);
      } else {
        installAgents(fs, provider, agents, args.global, log);
        installAgentsMd(fs, AIOps_ROOT, provider, args.global, log);
        totalInstalled += agents.length;
      }
    }

    log.msg("");
  }

  if (args.uninstall) {
    log.msg(c.green(`Uninstall complete for ${targets.length} IDE(s).`));
  } else {
    log.msg(c.green(`Done: ${totalInstalled} item(s) installed to ${targets.length} IDE(s).`));
    log.msg("");
    log.msg(c.bold("Next:") + " Open your project, restart the IDE, then chat:");
    log.msg(c.cyan("  /aiops <用中文描述你想做什么>"));
  }
}

main();
