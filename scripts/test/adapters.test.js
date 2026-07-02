#!/usr/bin/env node
"use strict";

const { strict: assert } = require("assert");
const { compileAgent } = require("../adapters/default");
const { getAdapter } = require("../adapters");

const agent = {
  name: "builder",
  description: "Delivery engineer",
  content: "# Builder\n\nImplement code.",
};

const md = compileAgent(agent, "md-yaml");
assert.equal(md.filename, "builder.md");
assert.match(md.content, /^---\nname: builder/);

const toml = compileAgent(agent, "toml");
assert.equal(toml.filename, "builder.toml");
assert.match(toml.content, /^name = "builder"/);

const cursor = getAdapter("cursor");
const cursorMd = cursor.compileAgent(agent);
assert.equal(cursorMd.filename, "builder.md");

const codex = getAdapter("codex");
const codexToml = codex.compileAgent(agent, "toml");
assert.equal(codexToml.filename, "builder.toml");

console.log("adapters.test.js: ok");
