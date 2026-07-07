#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { strict: assert } = require("assert");
const { installHooks, uninstallHooks } = require("../install/hooks");
const { hasDir } = require("../providers");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aiops-hooks-test-"));
const aiopsRoot = path.resolve(__dirname, "../..");
const log = {
  msg: () => {},
  ok: () => {},
  skip: () => {},
  warn: (m) => { warnings.push(m); },
  dim: (s) => s,
};

const provider = {
  id: "codex",
  label: "Codex CLI",
  hooksDir: path.join(tmp, "hooks"),
  localHooksDir: path.join(tmp, "local-hooks"),
  hooksConfigFile: path.join(tmp, "hooks.json"),
  localHooksConfigFile: path.join(tmp, "local-hooks.json"),
  hooksConfigTemplate: "claude-codex",
};

const warnings = [];
const existingConfig = {
  hooks: {
    PreToolUse: [
      {
        matcher: "Bash",
        hooks: [{ type: "command", command: "echo keep-me" }],
      },
    ],
  },
};
fs.writeFileSync(provider.hooksConfigFile, JSON.stringify(existingConfig, null, 2));

installHooks(fs, aiopsRoot, provider, true, hasDir, log);
const afterInstall = JSON.parse(fs.readFileSync(provider.hooksConfigFile, "utf8"));
assert.equal(afterInstall.hooks.PreToolUse.length, 1);
assert.equal(afterInstall.hooks.PreToolUse[0].hooks[0].command, "echo keep-me");
assert.ok(afterInstall.hooks.SessionStart);
assert.ok(afterInstall.hooks.SubagentStart);

installHooks(fs, aiopsRoot, provider, true, hasDir, log);
const afterReinstall = JSON.parse(fs.readFileSync(provider.hooksConfigFile, "utf8"));
assert.equal(
  afterReinstall.hooks.SessionStart.length,
  afterInstall.hooks.SessionStart.length
);

uninstallHooks(fs, provider, true, hasDir, log);
const afterUninstall = JSON.parse(fs.readFileSync(provider.hooksConfigFile, "utf8"));
assert.equal(afterUninstall.hooks.PreToolUse.length, 1);
assert.equal(afterUninstall.hooks.SessionStart, undefined);

fs.rmSync(tmp, { recursive: true, force: true });
console.log("hooks-install.test.js: ok");
