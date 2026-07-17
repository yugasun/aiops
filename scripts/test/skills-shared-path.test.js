#!/usr/bin/env node
"use strict";

const fs = require("fs");
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

assert.equal(cursor.localSkillsDir, ".agents/skills");
assert.equal(copilot.localSkillsDir, ".agents/skills");
assert.equal(opencode.localSkillsDir, ".agents/skills");
assert.equal(codex.localSkillsDir, ".agents/skills");
assert.equal(claude.localSkillsDir, ".claude/skills");
assert.equal(cursor.sharedSkills, true);
assert.equal(claude.sharedSkills, false);

const sharedKey = skillsDestPath(cursor, false);
assert.equal(skillsDestPath(copilot, false), sharedKey);
assert.equal(skillsDestPath(opencode, false), sharedKey);
assert.equal(skillsDestPath(codex, false), sharedKey);
assert.notEqual(skillsDestPath(claude, false), sharedKey);

const unique = uniqueBySkillsDest([cursor, copilot, opencode, codex, claude], false);
assert.equal(unique.length, 2);
assert.equal(unique[0].id, "cursor");
assert.equal(unique[1].id, "claude-code");

const tmp = fs.mkdtempSync(path.join(__dirname, "aiops-shared-skills-"));
const prevCwd = process.cwd();
process.chdir(tmp);

const aiopsRoot = path.resolve(__dirname, "../..");
const log = {
  msg: () => {},
  ok: () => {},
  skip: () => {},
  warn: () => {},
  dim: (s) => s,
};

const seen = new Set();
for (const provider of [cursor, copilot, opencode]) {
  const key = skillsDestPath(provider, false);
  const skipSkillFiles = seen.has(key);
  if (!skipSkillFiles) seen.add(key);
  installSkills(fs, aiopsRoot, provider, false, loadAllSkills, hasDir, log, {
    skipAlwaysOn: true,
    skipSkillFiles,
  });
}

const agentsSkills = path.resolve(".agents/skills");
assert.ok(fs.existsSync(path.join(agentsSkills, "aiops")));
assert.equal(fs.existsSync(path.resolve(".github/skills")), false);
assert.equal(fs.existsSync(path.resolve(".opencode/skills")), false);

// No-op when legacy dirs absent (avoid writing .cursor/ which some sandboxes block)
uninstallLegacyLocalSkills(fs, aiopsRoot, loadAllSkills, hasDir, log);
assert.ok(fs.existsSync(path.join(agentsSkills, "aiops")));

process.chdir(prevCwd);
fs.rmSync(tmp, { recursive: true, force: true });
console.log("skills-shared-path.test.js: ok");
