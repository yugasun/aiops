#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { strict: assert } = require("assert");
const { execSync } = require("child_process");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aiops-sync-version-"));
const script = path.join(__dirname, "..", "sync-version.js");

function write(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

write(path.join(tmp, "skills", "manifest.json"), { version: "1.0.0", tier1: [] });
write(path.join(tmp, "package.json"), { version: "9.9.9" });
write(path.join(tmp, ".claude-plugin", "plugin.json"), { version: "9.9.9" });
write(
  path.join(tmp, ".claude-plugin", "marketplace.json"),
  { metadata: { version: "9.9.9" }, plugins: [{ version: "9.9.9" }] }
);

const patchedScript = fs.readFileSync(script, "utf8").replace(
  'const ROOT = path.resolve(__dirname, "..");',
  `const ROOT = ${JSON.stringify(tmp)};`
);
const tmpScript = path.join(tmp, "sync-version.js");
fs.writeFileSync(tmpScript, patchedScript);

execSync(`node "${tmpScript}" 2.1.0`, { stdio: "pipe" });

assert.equal(readJson(path.join(tmp, "skills", "manifest.json")).version, "2.1.0");
assert.equal(readJson(path.join(tmp, "package.json")).version, "2.1.0");
assert.equal(readJson(path.join(tmp, ".claude-plugin", "plugin.json")).version, "2.1.0");
const marketplace = readJson(path.join(tmp, ".claude-plugin", "marketplace.json"));
assert.equal(marketplace.metadata.version, "2.1.0");
assert.equal(marketplace.plugins[0].version, "2.1.0");

fs.rmSync(tmp, { recursive: true, force: true });
console.log("sync-version.test.js: ok");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
