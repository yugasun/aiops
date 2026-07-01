#!/usr/bin/env node
// aiops — SessionStart hook for Claude Code and Codex CLI
//
// Runs on every session start/resume/clear/compact:
//   1. Reads lean skill from the installed skills directory
//   2. Emits the YAGNI ladder as hidden context so every turn inherits lean discipline
//   3. Emits the delivery sequence reminder (lean → TDD → prune → review → commit)

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

// ─── Resolve skills directory ──────────────────────────────────────────────

function findLeanSkill() {
  const home = os.homedir();
  // Try project-local first, then global
  const candidates = [
    path.resolve(".claude/skills/lean/SKILL.md"),
    path.resolve(".cursor/skills/lean/SKILL.md"),
    path.join(home, ".claude/skills/lean/SKILL.md"),
    path.join(home, ".cursor/skills/lean/SKILL.md"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, "utf8");
    }
  }
  return null;
}

// ─── Strip YAML frontmatter ────────────────────────────────────────────────
// Shared with scripts/adapters/utils.js. Falls back to inline when installed
// without scripts/ (e.g. via plugin install).

let stripFrontmatter;
try {
  stripFrontmatter = require(path.resolve(
    __dirname, "..", "scripts", "adapters", "utils"
  )).stripFrontmatter;
} catch {
  stripFrontmatter = (content) => {
    if (!content.startsWith("---")) return content;
    const second = content.indexOf("---", 3);
    if (second === -1) return content;
    return content.slice(second + 3).trimStart();
  };
}

// ─── Main ──────────────────────────────────────────────────────────────────

const leanContent = findLeanSkill();

if (!leanContent) {
  // No lean skill installed — emit nothing, don't block session
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

// Write to stdout — Claude Code / Codex captures this as hidden session context
try {
  process.stdout.write(output);
} catch {
  // Silent fail — EPIPE at hook exit must not surface as a hook failure
}
