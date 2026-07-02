#!/usr/bin/env node
// aiops — SubagentStart hook

"use strict";

const fs = require("fs");
const os = require("os");
const { readLeanSkill } = require("./skill-paths");
const { stripFrontmatter } = require("./strip-frontmatter");

const leanContent = readLeanSkill(fs, os.homedir());

if (!leanContent) {
  process.exit(0);
}

const body = stripFrontmatter(leanContent);

const output = `## aiops subagent context

You are a subagent within an aiops-managed session. Inherit these rules:

${body}`;

try {
  process.stdout.write(output);
} catch {
  // Silent fail
}
