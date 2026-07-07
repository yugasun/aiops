"use strict";

const path = require("path");
const os = require("os");
const { getAdapter } = require("../adapters");
const { copyDirSync } = require("./fs-utils");

function installSkills(
  fs,
  aiopsRoot,
  provider,
  isGlobal,
  loadAllSkills,
  hasDir,
  log,
  { skipAlwaysOn = false } = {}
) {
  const skillsDir = path.join(aiopsRoot, "skills");
  if (!hasDir(skillsDir)) {
    log.skip("no skills/ directory found");
    return;
  }

  const destBase = isGlobal
    ? provider.globalSkillsDir
    : path.resolve(provider.localSkillsDir);

  fs.mkdirSync(destBase, { recursive: true });

  const allSkills = loadAllSkills(aiopsRoot);
  const adapter = getAdapter(provider.id);
  const alwaysOnSkills = allSkills.filter((s) => s.alwaysOn);
  const regularSkills = allSkills.filter((s) => !s.alwaysOn);

  for (const skill of regularSkills) {
    const srcDir = path.join(skillsDir, skill.name);
    if (!hasDir(srcDir)) continue;

    const destDir = path.join(destBase, skill.name);
    fs.mkdirSync(destDir, { recursive: true });
    copyDirSync(fs, srcDir, destDir);
    log.ok(`${skill.name}/ → ${log.dim(destDir)}`);
  }

  if (alwaysOnSkills.length > 0 && !skipAlwaysOn) {
    if (adapter.installAlwaysOn) {
      const dest = adapter.installAlwaysOn(alwaysOnSkills, { isGlobal });
      log.ok(`${alwaysOnSkills.length} always-on skill(s) → ${log.dim(dest)}`);
    } else {
      for (const skill of alwaysOnSkills) {
        const srcDir = path.join(skillsDir, skill.name);
        if (!hasDir(srcDir)) continue;
        const destDir = path.join(destBase, skill.name);
        fs.mkdirSync(destDir, { recursive: true });
        copyDirSync(fs, srcDir, destDir);
        log.ok(`${skill.name}/ (always-on) → ${log.dim(destDir)}`);
      }
    }
  } else if (alwaysOnSkills.length > 0 && skipAlwaysOn) {
    log.skip(
      `skipped ${alwaysOnSkills.length} always-on skill(s) (use default install for persistent lean)`
    );
  }
}

function uninstallAlwaysOn(fs, adapter, alwaysOnSkills, isGlobal, log) {
  if (adapter.rulesDir) {
    const rulesDir = isGlobal
      ? adapter.rulesDir.global
      : path.resolve(adapter.rulesDir.local);
    for (const skill of alwaysOnSkills) {
      const filePath = path.join(rulesDir, `${skill.name}.mdc`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        log.ok(`removed ${skill.name}.mdc`);
      }
    }
    return;
  }

  if (adapter.instructionsFile) {
    const filePath = isGlobal
      ? adapter.instructionsFile.global
      : path.resolve(adapter.instructionsFile.local);
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, "utf8");
    if (content.startsWith("# Copilot Instructions\n\n## ")) {
      fs.unlinkSync(filePath);
      log.ok("removed copilot-instructions.md");
    } else {
      log.skip("copilot-instructions.md left unchanged (not aiops-generated)");
    }
  }
}

function isAiopsAgentsMd(content) {
  return content.startsWith("# aiops — Agent Definitions");
}

function uninstallSkills(fs, aiopsRoot, provider, isGlobal, loadAllSkills, hasDir, log) {
  const destBase = isGlobal
    ? provider.globalSkillsDir
    : path.resolve(provider.localSkillsDir);

  const allSkills = loadAllSkills(aiopsRoot);
  const adapter = getAdapter(provider.id);
  const alwaysOnSkills = allSkills.filter((s) => s.alwaysOn);

  if (hasDir(destBase)) {
    for (const skill of allSkills) {
      const destDir = path.join(destBase, skill.name);
      if (hasDir(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
        log.ok(`removed ${skill.name}/`);
      }
    }
  }

  if (alwaysOnSkills.length > 0) {
    uninstallAlwaysOn(fs, adapter, alwaysOnSkills, isGlobal, log);
  }
}

function installAgentsMd(fs, aiopsRoot, provider, isGlobal, log) {
  const agentsMdPath = path.join(aiopsRoot, "AGENTS.md");
  if (!fs.existsSync(agentsMdPath)) {
    log.skip("no AGENTS.md found (run: node scripts/build/build-agents-md.js)");
    return;
  }

  const home = os.homedir();
  let destPath;
  if (isGlobal) {
    if (provider.id === "codex") {
      destPath = path.join(home, ".codex", "AGENTS.md");
    } else {
      return;
    }
  } else {
    destPath = path.resolve("AGENTS.md");
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(agentsMdPath, destPath);
  log.ok(`AGENTS.md → ${log.dim(path.dirname(destPath))}`);
}

function uninstallAgentsMd(fs, aiopsRoot, provider, isGlobal, log) {
  const home = os.homedir();
  let destPath;
  if (isGlobal) {
    if (provider.id !== "codex") return;
    destPath = path.join(home, ".codex", "AGENTS.md");
  } else {
    destPath = path.resolve("AGENTS.md");
  }

  if (!fs.existsSync(destPath)) return;

  const content = fs.readFileSync(destPath, "utf8");
  if (isAiopsAgentsMd(content)) {
    fs.unlinkSync(destPath);
    log.ok(`removed AGENTS.md → ${log.dim(path.dirname(destPath))}`);
  } else {
    log.skip("AGENTS.md left unchanged (not aiops-generated)");
  }
}

module.exports = {
  installSkills,
  uninstallSkills,
  installAgentsMd,
  uninstallAgentsMd,
  isAiopsAgentsMd,
  uninstallAlwaysOn,
};
