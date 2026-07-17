"use strict";

const path = require("path");
const os = require("os");
const { getAdapter } = require("../adapters");
const { copyDirSync } = require("./fs-utils");
const { LEGACY_LOCAL_SKILLS_DIRS } = require("../providers");

function skillsDestPath(provider, isGlobal) {
  return isGlobal
    ? provider.globalSkillsDir
    : path.resolve(provider.localSkillsDir);
}

/** First provider per unique skills destination (project-local shared `.agents/skills`). */
function uniqueBySkillsDest(providers, isGlobal) {
  const seen = new Set();
  const unique = [];
  for (const provider of providers) {
    const key = skillsDestPath(provider, isGlobal);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(provider);
  }
  return unique;
}

function agentsMdDestPath(provider, isGlobal) {
  const home = os.homedir();
  if (isGlobal) {
    if (provider.id !== "codex") return null;
    return path.join(home, ".codex", "AGENTS.md");
  }
  return path.resolve("AGENTS.md");
}

function installSkills(
  fs,
  aiopsRoot,
  provider,
  isGlobal,
  loadAllSkills,
  hasDir,
  log,
  { skipAlwaysOn = false, skipSkillFiles = false } = {}
) {
  const skillsDir = path.join(aiopsRoot, "skills");
  if (!hasDir(skillsDir)) {
    log.skip("no skills/ directory found");
    return;
  }

  const allSkills = loadAllSkills(aiopsRoot);
  const adapter = getAdapter(provider.id);
  const alwaysOnSkills = allSkills.filter((s) => s.alwaysOn);
  const regularSkills = allSkills.filter((s) => !s.alwaysOn);

  if (!skipSkillFiles) {
    const destBase = skillsDestPath(provider, isGlobal);
    fs.mkdirSync(destBase, { recursive: true });

    for (const skill of regularSkills) {
      const srcDir = path.join(skillsDir, skill.name);
      if (!hasDir(srcDir)) continue;

      const destDir = path.join(destBase, skill.name);
      fs.mkdirSync(destDir, { recursive: true });
      copyDirSync(fs, srcDir, destDir);
      log.ok(`${skill.name}/ → ${log.dim(destDir)}`);
    }

    // Always-on skills that have no adapter path still land in skills dir
    if (alwaysOnSkills.length > 0 && !skipAlwaysOn && !adapter.installAlwaysOn) {
      for (const skill of alwaysOnSkills) {
        const srcDir = path.join(skillsDir, skill.name);
        if (!hasDir(srcDir)) continue;
        const destDir = path.join(destBase, skill.name);
        fs.mkdirSync(destDir, { recursive: true });
        copyDirSync(fs, srcDir, destDir);
        log.ok(`${skill.name}/ (always-on) → ${log.dim(destDir)}`);
      }
    }
  } else {
    log.skip(`skills files already installed at ${log.dim(skillsDestPath(provider, isGlobal))}`);
  }

  if (alwaysOnSkills.length > 0 && !skipAlwaysOn) {
    if (adapter.installAlwaysOn) {
      const dest = adapter.installAlwaysOn(alwaysOnSkills, { isGlobal });
      log.ok(`${alwaysOnSkills.length} always-on skill(s) → ${log.dim(dest)}`);
    }
  } else if (alwaysOnSkills.length > 0 && skipAlwaysOn && !skipSkillFiles) {
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

function removeSkillsFromDir(fs, destBase, allSkills, hasDir, log) {
  if (!hasDir(destBase)) return;
  for (const skill of allSkills) {
    const destDir = path.join(destBase, skill.name);
    if (hasDir(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true });
      log.ok(`removed ${skill.name}/ → ${log.dim(destDir)}`);
    }
  }
}

/** Clean pre-shared-path project installs (`.cursor/skills`, etc.). */
function uninstallLegacyLocalSkills(fs, aiopsRoot, loadAllSkills, hasDir, log) {
  const allSkills = loadAllSkills(aiopsRoot);
  for (const rel of LEGACY_LOCAL_SKILLS_DIRS) {
    const destBase = path.resolve(rel);
    removeSkillsFromDir(fs, destBase, allSkills, hasDir, log);
  }
}

function uninstallSkills(
  fs,
  aiopsRoot,
  provider,
  isGlobal,
  loadAllSkills,
  hasDir,
  log,
  { skipSkillFiles = false } = {}
) {
  const allSkills = loadAllSkills(aiopsRoot);
  const adapter = getAdapter(provider.id);
  const alwaysOnSkills = allSkills.filter((s) => s.alwaysOn);

  if (!skipSkillFiles) {
    removeSkillsFromDir(fs, skillsDestPath(provider, isGlobal), allSkills, hasDir, log);
  }

  if (alwaysOnSkills.length > 0) {
    uninstallAlwaysOn(fs, adapter, alwaysOnSkills, isGlobal, log);
  }
}

function installAgentsMd(fs, aiopsRoot, provider, isGlobal, log) {
  const agentsMdPath = path.join(aiopsRoot, "AGENTS.md");
  if (!fs.existsSync(agentsMdPath)) {
    log.skip("no AGENTS.md found (run: node scripts/build/build-agents-md.js)");
    return false;
  }

  const destPath = agentsMdDestPath(provider, isGlobal);
  if (!destPath) return false;

  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(agentsMdPath, destPath);
  log.ok(`AGENTS.md → ${log.dim(path.dirname(destPath))}`);
  return true;
}

function uninstallAgentsMd(fs, aiopsRoot, provider, isGlobal, log) {
  const destPath = agentsMdDestPath(provider, isGlobal);
  if (!destPath || !fs.existsSync(destPath)) return false;

  const content = fs.readFileSync(destPath, "utf8");
  if (isAiopsAgentsMd(content)) {
    fs.unlinkSync(destPath);
    log.ok(`removed AGENTS.md → ${log.dim(path.dirname(destPath))}`);
    return true;
  }
  log.skip("AGENTS.md left unchanged (not aiops-generated)");
  return false;
}

module.exports = {
  installSkills,
  uninstallSkills,
  uninstallLegacyLocalSkills,
  installAgentsMd,
  uninstallAgentsMd,
  isAiopsAgentsMd,
  uninstallAlwaysOn,
  skillsDestPath,
  uniqueBySkillsDest,
  agentsMdDestPath,
};
