#!/usr/bin/env node
// aiops — SessionStart hook for Claude Code and Codex CLI

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

const output = `## aiops — lean discipline active

${body}

## aiops — delivery sequence

When implementing code, follow this sequence:
1. Climb the lean ladder first (YAGNI → stdlib → native → dependency → one line → minimum code)
2. /tdd — tests before implementation
3. /prune — hunt over-engineering in the diff
4. /review — correctness and security review
5. Commit only on user approval`;

try {
  process.stdout.write(output);
} catch {
  // Silent fail — EPIPE at hook exit must not surface as a hook failure
}
