#!/usr/bin/env node
// build-copilot-instructions.js — Generate .github/copilot-instructions.md
//
// Usage: node scripts/build/build-copilot-instructions.js
// Output: .github/copilot-instructions.md at repo root

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const OUTPUT_DIR = path.join(ROOT, ".github");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "copilot-instructions.md");

const { getAdapter } = require("../adapters");
const { loadAlwaysOnSkills } = require("../lib/manifest");
const copilot = getAdapter("copilot");

// ─── Generate copilot-instructions.md ──────────────────────────────────────

const skills = loadAlwaysOnSkills(ROOT);

if (skills.length === 0) {
  console.log("No alwaysOn skills found in manifest. Nothing to generate.");
  process.exit(0);
}

const compiled = copilot.compileAllAlwaysOn(skills);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(OUTPUT_FILE, compiled.content, "utf8");

console.log(
  `✓ ${OUTPUT_FILE} generated (${skills.length} always-on skill(s))`
);
