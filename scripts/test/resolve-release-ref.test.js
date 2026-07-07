#!/usr/bin/env node
"use strict";

const { strict: assert } = require("assert");
const { resolveReleaseRef } = require("../resolve-release-ref");

async function testEnvOverride() {
  process.env.AIOPS_REF = "v9.9.9";
  assert.equal(await resolveReleaseRef(), "v9.9.9");
  delete process.env.AIOPS_REF;
}

async function testLiveOrFallback() {
  const ref = await resolveReleaseRef();
  assert.ok(typeof ref === "string" && ref.length > 0);
  assert.ok(ref === "main" || ref.startsWith("v"));
}

Promise.all([testEnvOverride(), testLiveOrFallback()])
  .then(() => console.log("resolve-release-ref.test.js: ok"))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
