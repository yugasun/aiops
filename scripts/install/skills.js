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

function uninstallSkills(fs, aiopsRoot, provider, isGlobal, loadAllSkills, hasDir, log) {
  const destBase = isGlobal
    ? provider.globalSkillsDir
    : path.resolve(provider.localSkillsDir);

  if (!hasDir(destBase)) return;

  const allSkills = loadAllSkills(aiopsRoot);
  for (const skill of allSkills) {
    const destDir = path.join(destBase, skill.name);
    if (hasDir(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true });
      log.ok(`removed ${skill.name}/`);
    }
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

module.exports = { installSkills, uninstallSkills, installAgentsMd };
