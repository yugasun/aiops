#!/usr/bin/env node
// build-windsurf-rules.js — Generate .windsurf/rules/*.mdc from always-on skills
//
// Usage: node scripts/build/build-windsurf-rules.js
// Output: .windsurf/rules/lean.mdc at repo root

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const OUTPUT_DIR = path.join(ROOT, ".windsurf", "rules");

const { getAdapter } = require("../adapters");
const { loadAlwaysOnSkills } = require("../lib/manifest");
const windsurf = getAdapter("windsurf");

// ─── Generate .mdc files ───────────────────────────────────────────────────

const skills = loadAlwaysOnSkills(ROOT);

if (skills.length === 0) {
  console.log("No alwaysOn skills found in manifest. Nothing to generate.");
  process.exit(0);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

for (const skill of skills) {
  const compiled = windsurf.compileAlwaysOn(skill);
  fs.writeFileSync(
    path.join(OUTPUT_DIR, compiled.filename),
    compiled.content,
    "utf8"
  );
  console.log(`  ✓ .windsurf/rules/${compiled.filename}`);
}

console.log(`✓ ${skills.length} windsurf rule(s) generated → ${OUTPUT_DIR}`);
