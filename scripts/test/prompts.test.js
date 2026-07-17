#!/usr/bin/env node
"use strict";

const { strict: assert } = require("assert");
const {
  canPrompt,
  cancelSymbol,
  isCancelled,
  multiselect,
  select,
} = require("../install/prompts");

assert.equal(typeof canPrompt, "function");
assert.equal(isCancelled(cancelSymbol), true);
assert.equal(isCancelled([]), false);
assert.equal(isCancelled(false), false);
assert.equal(typeof multiselect, "function");
assert.equal(typeof select, "function");

console.log("prompts.test.js: ok");
