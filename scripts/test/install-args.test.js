#!/usr/bin/env node
"use strict";

const { strict: assert } = require("assert");
const {
  parseArgs,
  shouldInstallHooks,
  shouldSkipAlwaysOn,
  targetsSupportHooks,
} = require("../../bin/install");

assert.deepEqual(parseArgs(["--commands-only"]), {
  all: false,
  ide: null,
  global: false,
  scopeExplicit: false,
  yes: false,
  list: false,
  uninstall: false,
  skillsOnly: true,
  agentsOnly: false,
  noSkills: false,
  noHooks: true,
  hooksExplicit: true,
  agentsMd: false,
  agentsMdExplicit: false,
  commandsOnly: true,
  help: false,
});

assert.equal(parseArgs([]).agentsMd, false);
assert.equal(parseArgs(["--agents-md"]).agentsMd, true);
assert.equal(parseArgs(["--agents-md"]).agentsMdExplicit, true);
assert.equal(parseArgs(["--no-agents-md"]).agentsMd, false);
assert.equal(parseArgs(["--no-agents-md"]).agentsMdExplicit, true);

assert.equal(parseArgs([]).all, false);
assert.equal(parseArgs([]).yes, false);
assert.equal(parseArgs(["--yes"]).yes, true);
assert.equal(parseArgs(["-y"]).yes, true);
assert.equal(parseArgs(["--all"]).all, true);
assert.equal(parseArgs(["--all"]).yes, true);

assert.equal(parseArgs(["-g"]).global, true);
assert.equal(parseArgs(["-g"]).scopeExplicit, true);
assert.equal(parseArgs(["--local"]).global, false);
assert.equal(parseArgs(["--local"]).scopeExplicit, true);
assert.equal(parseArgs([]).scopeExplicit, false);

assert.equal(parseArgs(["--no-hooks"]).hooksExplicit, true);
assert.equal(parseArgs(["--no-hooks"]).noHooks, true);

assert.equal(shouldInstallHooks(parseArgs(["--skills-only"])), false);
assert.equal(shouldInstallHooks(parseArgs(["--no-hooks"])), false);
assert.equal(shouldInstallHooks(parseArgs([])), true);
assert.equal(shouldSkipAlwaysOn(parseArgs(["--skills-only"])), true);
assert.equal(shouldSkipAlwaysOn(parseArgs([])), false);

assert.equal(parseArgs(["uninstall", "--ide", "codex"]).uninstall, true);
assert.equal(parseArgs(["uninstall", "--ide", "codex"]).ide, "codex");
assert.equal(parseArgs(["--uninstall"]).uninstall, true);

assert.equal(
  targetsSupportHooks([{ hooksDir: "/x", hooksConfigTemplate: "claude-codex" }]),
  true
);
assert.equal(targetsSupportHooks([{ hooksDir: "/x", hooksConfigTemplate: null }]), false);
assert.equal(targetsSupportHooks([{ hooksDir: null }]), false);

console.log("install-args.test.js: ok");
