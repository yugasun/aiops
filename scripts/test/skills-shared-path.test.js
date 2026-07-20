#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { strict: assert } = require("assert");
const {
  skillsDestPath,
  uniqueBySkillsDest,
  uninstallLegacyLocalSkills,
  installSkills,
} = require("../install/skills");
const { PROVIDERS } = require("../providers");
const { loadAllSkills } = require("../lib/manifest");
const { hasDir } = require("../providers");

const cursor = PROVIDERS.find((p) => p.id === "cursor");
const copilot = PROVIDERS.find((p) => p.id === "copilot");
const opencode = PROVIDERS.find((p) => p.id === "opencode");
const codex = PROVIDERS.find((p) => p.id === "codex");
const claude = PROVIDERS.find((p) => p.id === "claude-code");

// Skills destination is always user-global (never project-local path)
assert.equal(skillsDestPath(cursor), cursor.globalSkillsDir);
assert.equal(skillsDestPath(copilot), copilot.globalSkillsDir);
assert.equal(skillsDestPath(codex), codex.globalSkillsDir);
assert.equal(skillsDestPath(claude), claude.globalSkillsDir);
assert.notEqual(skillsDestPath(cursor), path.resolve(".agents/skills"));

const unique = uniqueBySkillsDest([cursor, copilot, opencode, codex, claude]);
// cursor/copilot/opencode each have distinct global dirs; codex shares ~/.agents/skills
assert.ok(unique.length >= 3);
assert.ok(unique.some((p) => p.id === "claude-code"));
assert.ok(unique.some((p) => p.id === "cursor"));

const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "aiops-global-skills-"));
const tmpProject = fs.mkdtempSync(path.join(__dirname, "aiops-project-skills-"));
const prevCwd = process.cwd();

const cursorGlobal = {
  ...cursor,
  globalSkillsDir: path.join(tmpHome, "cursor-skills"),
  localSkillsDir: ".agents/skills",
};
const copilotGlobal = {
  ...copilot,
  globalSkillsDir: path.join(tmpHome, "copilot-skills"),
  localSkillsDir: ".agents/skills",
};

process.chdir(tmpProject);
const aiopsRoot = path.resolve(__dirname, "../..");
const log = {
  msg: () => {},
  ok: () => {},
  skip: () => {},
  warn: () => {},
  dim: (s) => s,
};

const seen = new Set();
for (const provider of [cursorGlobal, copilotGlobal]) {
  const key = skillsDestPath(provider);
  const skipSkillFiles = seen.has(key);
  if (!skipSkillFiles) seen.add(key);
  // project-local scope (isGlobal=false) must still write skills to globalSkillsDir
  installSkills(fs, aiopsRoot, provider, false, loadAllSkills, hasDir, log, {
    skipAlwaysOn: true,
    skipSkillFiles,
  });
}

assert.ok(fs.existsSync(path.join(cursorGlobal.globalSkillsDir, "aiops")));
assert.ok(fs.existsSync(path.join(copilotGlobal.globalSkillsDir, "aiops")));
assert.equal(fs.existsSync(path.resolve(".agents/skills")), false);
assert.equal(fs.existsSync(path.resolve(".cursor/skills")), false);
assert.equal(fs.existsSync(path.resolve(".github/skills")), false);

uninstallLegacyLocalSkills(fs, aiopsRoot, loadAllSkills, hasDir, log);

process.chdir(prevCwd);
fs.rmSync(tmpProject, { recursive: true, force: true });
fs.rmSync(tmpHome, { recursive: true, force: true });
console.log("skills-shared-path.test.js: ok");
