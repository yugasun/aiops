#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { strict: assert } = require("assert");
const {
  uninstallSkills,
  uninstallAgentsMd,
  uninstallAlwaysOn,
  isAiopsAgentsMd,
} = require("../install/skills");
const { hasDir } = require("../providers");
const { loadAllSkills } = require("../lib/manifest");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aiops-uninstall-test-"));
const aiopsRoot = path.resolve(__dirname, "../..");
const log = {
  msg: () => {},
  ok: (m) => actions.push(m),
  skip: (m) => actions.push(`skip:${m}`),
  warn: () => {},
  dim: (s) => s,
};
const actions = [];

const provider = {
  id: "opencode",
  globalSkillsDir: path.join(tmp, "skills"),
  localSkillsDir: path.join(tmp, "local-skills"),
};

fs.mkdirSync(path.join(provider.globalSkillsDir, "aiops"), { recursive: true });
fs.mkdirSync(path.join(provider.globalSkillsDir, "lean"), { recursive: true });

uninstallSkills(fs, aiopsRoot, provider, true, loadAllSkills, hasDir, log);
assert.equal(fs.existsSync(path.join(provider.globalSkillsDir, "aiops")), false);
assert.equal(fs.existsSync(path.join(provider.globalSkillsDir, "lean")), false);

const rulesDir = path.join(tmp, "rules");
fs.mkdirSync(rulesDir, { recursive: true });
fs.writeFileSync(path.join(rulesDir, "lean.mdc"), "always on");
const fakeCursorAdapter = { rulesDir: { global: rulesDir, local: "rules" } };
uninstallAlwaysOn(fs, fakeCursorAdapter, [{ name: "lean" }], true, log);
assert.equal(fs.existsSync(path.join(rulesDir, "lean.mdc")), false);

const copilotFile = path.join(tmp, "copilot-instructions.md");
fs.writeFileSync(copilotFile, "# Copilot Instructions\n\n## Lean\n");
const fakeCopilotAdapter = {
  instructionsFile: { global: copilotFile, local: copilotFile },
};
uninstallAlwaysOn(fs, fakeCopilotAdapter, [{ name: "lean" }], true, log);
assert.equal(fs.existsSync(copilotFile), false);

process.chdir(tmp);
const agentsMd = path.join(tmp, "AGENTS.md");
fs.writeFileSync(agentsMd, "# aiops — Agent Definitions\n\nlean");
const codex = { id: "codex" };
uninstallAgentsMd(fs, aiopsRoot, codex, false, log);
assert.equal(fs.existsSync(agentsMd), false);

fs.writeFileSync(
  agentsMd,
  "# Custom AGENTS\n\n<!-- aiops:agents-md:start -->\n# aiops — Agent Definitions\n<!-- aiops:agents-md:end -->\n"
);
actions.length = 0;
uninstallAgentsMd(fs, aiopsRoot, codex, false, log);
assert.equal(fs.existsSync(agentsMd), true);
assert.match(fs.readFileSync(agentsMd, "utf8"), /Custom AGENTS/);
assert.doesNotMatch(fs.readFileSync(agentsMd, "utf8"), /aiops:agents-md/);
assert.match(actions[0], /removed aiops section/);

fs.writeFileSync(agentsMd, "# Custom AGENTS\n");
actions.length = 0;
uninstallAgentsMd(fs, aiopsRoot, codex, false, log);
assert.equal(fs.existsSync(agentsMd), true);
assert.match(actions[0], /left unchanged/);

assert.equal(isAiopsAgentsMd("# aiops — Agent Definitions\n"), true);
assert.equal(isAiopsAgentsMd("# Custom\n"), false);

fs.rmSync(tmp, { recursive: true, force: true });
console.log("uninstall-skills.test.js: ok");
