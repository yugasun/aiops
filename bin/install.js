#!/usr/bin/env node

/**
 * aiops installer — detects AI IDEs and installs skills + agents
 *
 * Default: interactive (pick IDEs, scope, hooks) — like vercel-labs/skills.
 * Non-interactive: --yes / --all / --ide + flags.
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
  uninstallLegacyLocalSkills,
  installAgentsMd,
  uninstallAgentsMd,
  skillsDestPath,
  agentsMdDestPath,
} = require("../scripts/install/skills");
const { installHooks, uninstallHooks } = require("../scripts/install/hooks");
const { hasDir } = require("../scripts/providers");
const {
  canPrompt,
  isCancelled,
  promptIdes,
  promptScope,
  promptHooks,
} = require("../scripts/install/prompts");

function parseArgs(argv) {
  const args = {
    all: false,
    ide: null,
    global: false,
    scopeExplicit: false,
    yes: false,
    list: false,
    uninstall: false,
    skillsOnly: false,
    agentsOnly: false,
    noSkills: false,
    noHooks: false,
    hooksExplicit: false,
    commandsOnly: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (i === 0 && a === "uninstall") {
      args.uninstall = true;
      continue;
    }
    switch (a) {
      case "--all":
        args.all = true;
        args.yes = true;
        break;
      case "--ide":
        args.ide = argv[++i];
        break;
      case "-g":
      case "--global":
        args.global = true;
        args.scopeExplicit = true;
        break;
      case "--local":
        args.global = false;
        args.scopeExplicit = true;
        break;
      case "-y":
      case "--yes":
        args.yes = true;
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
      case "--commands-only":
        args.commandsOnly = true;
        break;
      case "--agents-only":
        args.agentsOnly = true;
        break;
      case "--no-skills":
        args.noSkills = true;
        break;
      case "--no-hooks":
        args.noHooks = true;
        args.hooksExplicit = true;
        break;
      case "-h":
      case "--help":
        args.help = true;
        break;
    }
  }

  if (args.commandsOnly) {
    args.skillsOnly = true;
    args.noHooks = true;
    args.hooksExplicit = true;
  }

  return args;
}

function showHelp() {
  console.log(`
${c.bold("aiops")} v${VERSION} — AI-assisted dev workflow installer

${c.bold("Usage:")}
  npx -y github:${REPO} [flags]
  npx -y github:${REPO} uninstall [flags]

${c.bold("Commands:")}
  uninstall          Remove installed aiops files (skills, hooks, agents, AGENTS.md)

${c.bold("Flags:")}
  (default)          Interactive: ↑↓/space/ctrl+a IDEs, then scope + hooks
  -y, --yes          Skip prompts; install to all detected IDEs (project-local)
  --all              Same as --yes; install to every detected IDE
  --ide <name>       Install to specific IDE: claude, cursor, copilot, codex, opencode
  -g, --global       Global install to ~/<ide>/
  --local            Project-local install to ./<ide>/ (default)
  --list             List detected IDEs, don't install
  --uninstall        Alias for the uninstall command
  --skills-only      Install slash-command skills only (no hooks, agents, or always-on lean)
  --commands-only    Alias for --skills-only
  --agents-only      Only install agents + AGENTS.md (Codex global)
  --no-skills        Skip skills installation
  --no-hooks         Install skills/agents but skip SessionStart hooks
  -h, --help         Show this help

${c.bold("Install modes:")}
  interactive        ↑↓ move, space toggle, ctrl+a all, enter confirm
  --yes / --all      skills + hooks + agents + always-on lean, no prompts
  --skills-only      explicit /aiops, /tdd, /review commands without session injection
  --no-hooks         full workflow except Codex/Claude SessionStart hooks

${c.bold("Non-interactive tip:")}
  npx -y github:${REPO} --yes
  npx -y github:${REPO} --ide cursor -g --no-hooks

${c.bold("Uninstall:")}
  uninstall          remove skills, hooks (aiops entries only), agents, AGENTS.md
  uninstall --skills-only   remove skills + hooks only
  uninstall --agents-only   remove agents + AGENTS.md only
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

function shouldInstallHooks(args) {
  return !args.noHooks && !args.skillsOnly && !args.commandsOnly;
}

function shouldSkipAlwaysOn(args) {
  return args.skillsOnly || args.commandsOnly;
}

function targetsSupportHooks(targets) {
  return targets.some((p) => p.hooksDir && p.hooksConfigTemplate);
}

function showNonInteractiveTip() {
  log.msg(c.dim("Tip: use --yes (-y) or --all to install without prompts."));
  log.msg(c.dim(`  npx -y github:${REPO} --yes`));
  log.msg(c.dim(`  npx -y github:${REPO} --ide cursor -g`));
}

/**
 * Resolve targets / scope / hooks — interactive when possible.
 * Mutates args.global and args.noHooks when prompts answer.
 */
async function resolveInstallChoices(args, detected) {
  let targets;

  if (args.ide) {
    targets = filterTargets(detected, args.ide);
  } else if (args.all || args.yes || args.uninstall || detected.length === 1) {
    targets = detected;
    if (detected.length === 1 && !args.yes && !args.all && !args.uninstall) {
      log.msg(`Installing to: ${c.cyan(detected[0].label)}`);
    }
  } else if (canPrompt()) {
    log.msg("");
    targets = await promptIdes(detected);
    if (isCancelled(targets)) {
      log.msg(c.dim("Installation cancelled."));
      process.exit(0);
    }
    log.msg("");
  } else {
    log.msg(c.red("Non-interactive terminal: choose targets explicitly."));
    showNonInteractiveTip();
    process.exit(1);
  }

  if (args.ide && targets.length === 0) {
    log.msg(c.red(`IDE "${args.ide}" not detected or not supported.`));
    process.exit(1);
  }

  if (args.uninstall) {
    return targets;
  }

  const skipPrompts = args.yes || args.all;

  if (!args.scopeExplicit && !skipPrompts && canPrompt()) {
    const scope = await promptScope();
    if (isCancelled(scope)) {
      log.msg(c.dim("Installation cancelled."));
      process.exit(0);
    }
    args.global = scope;
    log.msg("");
  }

  const hooksRelevant =
    !args.hooksExplicit &&
    !args.skillsOnly &&
    !args.agentsOnly &&
    !args.commandsOnly &&
    targetsSupportHooks(targets);

  if (hooksRelevant && !skipPrompts && canPrompt()) {
    const wantHooks = await promptHooks(true);
    if (isCancelled(wantHooks)) {
      log.msg(c.dim("Installation cancelled."));
      process.exit(0);
    }
    args.noHooks = !wantHooks;
    args.hooksExplicit = true;
    log.msg("");
  }

  return targets;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  log.msg(c.bold(`aiops ${args.uninstall ? "uninstaller" : "installer"} v${VERSION}`));
  log.msg("");

  const detected = PROVIDERS.filter((p) => p.detect());
  if (detected.length === 0) {
    log.msg(c.red("No supported AI IDEs detected."));
    log.msg("Supported: Claude Code, Cursor, GitHub Copilot, Codex CLI, OpenCode");
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

  if (!args.uninstall && !args.yes && !args.all && !args.ide && canPrompt()) {
    log.msg(c.dim("Interactive install — pass --yes to skip prompts."));
  }

  const targets = await resolveInstallChoices(args, detected);

  const agents = loadAgentsFromManifest(AIOps_ROOT);
  const mode = args.global ? "global" : "project-local";
  log.msg(c.bold(`Mode: ${mode}  |  Targets: ${targets.map((t) => t.id).join(", ")}`));
  log.msg("");

  let totalInstalled = 0;
  const installHooksFlag = shouldInstallHooks(args);
  const skipAlwaysOn = shouldSkipAlwaysOn(args);
  const seenSkillsDest = new Set();
  const seenAgentsMd = new Set();

  for (const provider of targets) {
    log.msg(c.bold(`[${provider.label}]`));

    if (!args.agentsOnly && !args.noSkills) {
      const skillsKey = skillsDestPath(provider, args.global);
      const skipSkillFiles = seenSkillsDest.has(skillsKey);
      if (!skipSkillFiles) seenSkillsDest.add(skillsKey);

      if (args.uninstall) {
        uninstallSkills(fs, AIOps_ROOT, provider, args.global, loadAllSkills, hasDir, log, {
          skipSkillFiles,
        });
        uninstallHooks(fs, provider, args.global, hasDir, log);
      } else {
        installSkills(fs, AIOps_ROOT, provider, args.global, loadAllSkills, hasDir, log, {
          skipAlwaysOn,
          skipSkillFiles,
        });
        if (installHooksFlag) {
          installHooks(fs, AIOps_ROOT, provider, args.global, hasDir, log);
        } else {
          log.skip("hooks (use default install for SessionStart lean injection)");
        }
        totalInstalled++;
      }
    }

    if (!args.skillsOnly && !args.commandsOnly) {
      if (args.uninstall) {
        uninstallAgents(fs, provider, agents, args.global, hasDir, log);
        const mdKey = agentsMdDestPath(provider, args.global);
        if (mdKey && !seenAgentsMd.has(mdKey)) {
          seenAgentsMd.add(mdKey);
          uninstallAgentsMd(fs, AIOps_ROOT, provider, args.global, log);
        }
      } else {
        installAgents(fs, provider, agents, args.global, log);
        const mdKey = agentsMdDestPath(provider, args.global);
        if (mdKey && !seenAgentsMd.has(mdKey)) {
          seenAgentsMd.add(mdKey);
          installAgentsMd(fs, AIOps_ROOT, provider, args.global, log);
        }
        totalInstalled += agents.length;
      }
    }

    log.msg("");
  }

  if (args.uninstall && !args.global && !args.agentsOnly) {
    uninstallLegacyLocalSkills(fs, AIOps_ROOT, loadAllSkills, hasDir, log);
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

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  shouldInstallHooks,
  shouldSkipAlwaysOn,
  targetsSupportHooks,
  resolveInstallChoices,
  skillsDestPath,
};
