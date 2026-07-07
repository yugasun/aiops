#!/usr/bin/env node
"use strict";

const { strict: assert } = require("assert");
const { parseArgs, shouldInstallHooks, shouldSkipAlwaysOn } = require("../../bin/install");

assert.deepEqual(parseArgs(["--commands-only"]), {
  all: true,
  ide: null,
  global: false,
  list: false,
  uninstall: false,
  skillsOnly: true,
  agentsOnly: false,
  noSkills: false,
  noHooks: true,
  commandsOnly: true,
  help: false,
});

assert.equal(shouldInstallHooks(parseArgs(["--skills-only"])), false);
assert.equal(shouldInstallHooks(parseArgs(["--no-hooks"])), false);
assert.equal(shouldInstallHooks(parseArgs([])), true);
assert.equal(shouldSkipAlwaysOn(parseArgs(["--skills-only"])), true);
assert.equal(shouldSkipAlwaysOn(parseArgs([])), false);

assert.equal(parseArgs(["uninstall", "--ide", "codex"]).uninstall, true);
assert.equal(parseArgs(["uninstall", "--ide", "codex"]).ide, "codex");
assert.equal(parseArgs(["--uninstall"]).uninstall, true);

console.log("install-args.test.js: ok");
