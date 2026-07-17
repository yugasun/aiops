#!/usr/bin/env node
"use strict";

/**
 * Decide semver bump from conventional commits since the last git tag.
 *
 * Rules (highest wins):
 *   breaking (BREAKING CHANGE / type!:) → major
 *   feat → minor
 *   fix → patch
 *   otherwise → none
 *
 * Usage:
 *   node scripts/bump-from-commits.js --print-bump
 *   node scripts/bump-from-commits.js --print-version
 *   node scripts/bump-from-commits.js --apply   # bump + sync-version.js
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MANIFEST = path.join(ROOT, "skills", "manifest.json");

function isReleaseCommit(subject) {
  return /^chore\(release\):/i.test(subject.trim());
}

/**
 * @param {string[]} subjects commit subjects (newest first or any order)
 * @returns {"major"|"minor"|"patch"|null}
 */
function classifyBump(subjects) {
  let bump = null;
  for (const raw of subjects) {
    const subject = String(raw || "").trim();
    if (!subject || isReleaseCommit(subject)) continue;

    const breaking =
      /BREAKING CHANGE/i.test(subject) ||
      /^[a-z]+(?:\([^)]*\))?!:/i.test(subject);
    if (breaking) return "major";

    if (/^feat(?:\([^)]*\))?:/i.test(subject)) {
      bump = "minor";
      continue;
    }
    if (/^fix(?:\([^)]*\))?:/i.test(subject)) {
      if (bump !== "minor") bump = "patch";
    }
  }
  return bump;
}

/**
 * @param {string} version x.y.z
 * @param {"major"|"minor"|"patch"} bump
 */
function nextVersion(version, bump) {
  const m = String(version).match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) throw new Error(`Invalid semver: ${version}`);
  let major = Number(m[1]);
  let minor = Number(m[2]);
  let patch = Number(m[3]);
  if (bump === "major") {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (bump === "minor") {
    minor += 1;
    patch = 0;
  } else if (bump === "patch") {
    patch += 1;
  } else {
    throw new Error(`Invalid bump: ${bump}`);
  }
  return `${major}.${minor}.${patch}`;
}

function git(cmd) {
  return execSync(cmd, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function lastTag() {
  try {
    return git("git describe --tags --abbrev=0");
  } catch {
    return null;
  }
}

function commitSubjectsSince(tag) {
  const range = tag ? `${tag}..HEAD` : "HEAD";
  try {
    const out = git(`git log ${range} --pretty=%s --no-merges`);
    if (!out) return [];
    return out.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function currentVersion() {
  return JSON.parse(fs.readFileSync(MANIFEST, "utf8")).version;
}

function resolveBump(subjects = commitSubjectsSince(lastTag())) {
  return classifyBump(subjects);
}

function main() {
  const args = process.argv.slice(2);
  const printBump = args.includes("--print-bump");
  const printVersion = args.includes("--print-version");
  const apply = args.includes("--apply");

  const bump = resolveBump();
  if (printBump) {
    process.stdout.write(`${bump || "none"}\n`);
    return;
  }

  if (!bump) {
    if (printVersion || apply) {
      console.error("No feat/fix/breaking commits since last tag — nothing to bump");
      process.exit(2);
    }
    console.log("bump: none");
    return;
  }

  const version = nextVersion(currentVersion(), bump);
  if (printVersion) {
    process.stdout.write(`${version}\n`);
    return;
  }

  if (apply) {
    execSync(`node "${path.join(__dirname, "sync-version.js")}" "${version}"`, {
      cwd: ROOT,
      stdio: "inherit",
    });
    process.stdout.write(`${version}\n`);
    return;
  }

  console.log(`bump: ${bump} → v${version}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  classifyBump,
  nextVersion,
  isReleaseCommit,
  resolveBump,
};
