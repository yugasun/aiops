#!/usr/bin/env node
// build-cursor-rules.js — Generate .cursor/rules/*.mdc from always-on skills
//
// Usage: node scripts/build/build-cursor-rules.js
// Output: .cursor/rules/lean.mdc at repo root

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const OUTPUT_DIR = path.join(ROOT, ".cursor", "rules");

const { getAdapter } = require("../adapters");
const { loadAlwaysOnSkills } = require("../lib/manifest");
const cursor = getAdapter("cursor");

// ─── Generate .mdc files ───────────────────────────────────────────────────

const skills = loadAlwaysOnSkills(ROOT);

if (skills.length === 0) {
  console.log("No alwaysOn skills found in manifest. Nothing to generate.");
  process.exit(0);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const skill of skills) {
  const compiled = cursor.compileAlwaysOn(skill);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, compiled.filename),
    compiled.content,
    "utf8"
  );
  console.log(`  ✓ .cursor/rules/${compiled.filename}`);
}

console.log(`✓ ${skills.length} cursor rule(s) generated → ${OUTPUT_DIR}`);
