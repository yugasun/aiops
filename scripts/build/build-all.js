#!/usr/bin/env node
// build-all.js — Run all build scripts to generate IDE-native artifacts
//
// Usage: node scripts/build/build-all.js
// Generates: AGENTS.md, .cursor/rules/*.mdc, .github/copilot-instructions.md

"use strict";

const { execSync } = require("child_process");
const path = require("path");

const BUILD_DIR = __dirname;

const scripts = [
  "build-agents-md.js",
  "build-website-registry.js",
  "build-cursor-rules.js",
  "build-copilot-instructions.js",
];

console.log("aiops — building all IDE-native artifacts\n");

let passed = 0;
let failed = 0;

for (const script of scripts) {
  const scriptPath = path.join(BUILD_DIR, script);
  try {
    execSync(`node "${scriptPath}"`, { stdio: "inherit" });
    passed++;
  } catch (e) {
    console.error(`✗ ${script} failed`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
