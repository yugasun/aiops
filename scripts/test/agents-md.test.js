#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { strict: assert } = require("assert");
const {
  mergeAgentsMdContent,
  stripAgentsMdBlock,
  installAgentsMd,
  uninstallAgentsMd,
  AGENTS_MD_START,
  AGENTS_MD_END,
} = require("../install/skills");

const incoming = "# aiops — Agent Definitions\n\nlean ladder\n";

// create
assert.match(mergeAgentsMdContent(null, incoming), new RegExp(AGENTS_MD_START));
assert.match(mergeAgentsMdContent("", incoming), /lean ladder/);

// append — keep user content
const custom = "# My Project\n\nDo not erase.\n";
const appended = mergeAgentsMdContent(custom, incoming);
assert.match(appended, /My Project/);
assert.match(appended, /Do not erase/);
assert.match(appended, new RegExp(AGENTS_MD_START));
assert.ok(appended.indexOf("My Project") < appended.indexOf(AGENTS_MD_START));

// refresh marked block (idempotent)
const again = mergeAgentsMdContent(appended, "# aiops — Agent Definitions\n\nupdated\n");
assert.match(again, /My Project/);
assert.match(again, /updated/);
assert.equal((again.match(new RegExp(AGENTS_MD_START, "g")) || []).length, 1);

// legacy full-file → marked
const legacy = "# aiops — Agent Definitions\n\nold full file\n";
const migrated = mergeAgentsMdContent(legacy, incoming);
assert.match(migrated, new RegExp(AGENTS_MD_START));
assert.doesNotMatch(migrated, /old full file/);

// strip keeps user content
const stripped = stripAgentsMdBlock(appended);
assert.match(stripped, /My Project/);
assert.doesNotMatch(stripped, new RegExp(AGENTS_MD_START));
assert.equal(stripAgentsMdBlock(legacy), null);
assert.equal(stripAgentsMdBlock("# only user\n"), "# only user\n");

// filesystem install/uninstall
const tmp = fs.mkdtempSync(path.join(__dirname, "aiops-agents-md-"));
const prev = process.cwd();
process.chdir(tmp);
const aiopsRoot = path.resolve(__dirname, "../..");
const log = { ok: () => {}, skip: () => {}, dim: (s) => s };
const provider = { id: "cursor" };

fs.writeFileSync("AGENTS.md", "# Keep Me\n\nproject notes\n");
installAgentsMd(fs, aiopsRoot, provider, false, log);
const afterInstall = fs.readFileSync("AGENTS.md", "utf8");
assert.match(afterInstall, /Keep Me/);
assert.match(afterInstall, new RegExp(AGENTS_MD_START));

uninstallAgentsMd(fs, aiopsRoot, provider, false, log);
const afterUninstall = fs.readFileSync("AGENTS.md", "utf8");
assert.match(afterUninstall, /Keep Me/);
assert.doesNotMatch(afterUninstall, new RegExp(AGENTS_MD_START));
assert.doesNotMatch(afterUninstall, new RegExp(AGENTS_MD_END));

process.chdir(prev);
fs.rmSync(tmp, { recursive: true, force: true });
console.log("agents-md.test.js: ok");
