#!/usr/bin/env node
"use strict";

/**
 * Sync release version from skills/manifest.json to all bundle artifacts.
 *
 * Usage:
 *   node scripts/sync-version.js           # propagate manifest.version
 *   node scripts/sync-version.js 1.4.2     # set version everywhere, then verify
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const TARGETS = {
  manifest: path.join(ROOT, "skills", "manifest.json"),
  package: path.join(ROOT, "package.json"),
  plugin: path.join(ROOT, ".claude-plugin", "plugin.json"),
  marketplace: path.join(ROOT, ".claude-plugin", "marketplace.json"),
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function isSemver(version) {
  return /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version);
}

function setVersion(version) {
  if (!isSemver(version)) {
    console.error(`Invalid semver: ${version}`);
    process.exit(1);
  }

  const manifest = readJson(TARGETS.manifest);
  manifest.version = version;
  writeJson(TARGETS.manifest, manifest);

  const pkg = readJson(TARGETS.package);
  pkg.version = version;
  writeJson(TARGETS.package, pkg);

  const plugin = readJson(TARGETS.plugin);
  plugin.version = version;
  writeJson(TARGETS.plugin, plugin);

  const marketplace = readJson(TARGETS.marketplace);
  marketplace.metadata.version = version;
  if (marketplace.plugins?.[0]) {
    marketplace.plugins[0].version = version;
  }
  writeJson(TARGETS.marketplace, marketplace);

  return version;
}

function main() {
  const arg = process.argv[2];
  const version = arg ? setVersion(arg) : readJson(TARGETS.manifest).version;

  if (!version) {
    console.error("ERROR: skills/manifest.json missing version");
    process.exit(1);
  }

  if (!arg) {
    setVersion(version);
  }

  console.log(`✓ version synced to v${version}`);
  console.log("  skills/manifest.json");
  console.log("  package.json");
  console.log("  .claude-plugin/plugin.json");
  console.log("  .claude-plugin/marketplace.json");
}

main();
