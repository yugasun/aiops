#!/usr/bin/env node
"use strict";

const { strict: assert } = require("assert");
const { classifyBump, nextVersion, isReleaseCommit } = require("../bump-from-commits");

assert.equal(classifyBump(["docs: typo"]), null);
assert.equal(classifyBump(["chore: deps"]), null);
assert.equal(classifyBump(["chore(release): v1.2.3 [skip ci]"]), null);
assert.equal(classifyBump(["fix: hooks merge"]), "patch");
assert.equal(classifyBump(["feat: interactive install"]), "minor");
assert.equal(classifyBump(["feat(install): shared skills", "fix: typo"]), "minor");
assert.equal(classifyBump(["fix: a", "fix: b"]), "patch");
assert.equal(classifyBump(["feat!: break api"]), "major");
assert.equal(classifyBump(["fix: x", "feat!: y"]), "major");
assert.equal(classifyBump(["chore(release): v1.0.0", "fix: z"]), "patch");

assert.equal(nextVersion("1.4.1", "patch"), "1.4.2");
assert.equal(nextVersion("1.4.1", "minor"), "1.5.0");
assert.equal(nextVersion("1.4.1", "major"), "2.0.0");
assert.equal(nextVersion("0.9.9", "minor"), "0.10.0");

assert.equal(isReleaseCommit("chore(release): v1.4.2 [skip ci]"), true);
assert.equal(isReleaseCommit("feat: something"), false);

console.log("bump-from-commits.test.js: ok");
