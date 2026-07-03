#!/usr/bin/env node
"use strict";

const { strict: assert } = require("assert");
const pkg = require("../../package.json");

assert.ok(pkg.files.includes("scripts/"), 'package.json "files" must include "scripts/"');

console.log("package-files.test.js: ok");
