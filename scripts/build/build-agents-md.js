#!/usr/bin/env node
// build-agents-md.js — Generate AGENTS.md from agents/*.md + manifest.json
//
// Usage: node scripts/build/build-agents-md.js
// Output: AGENTS.md at repo root

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const OUTPUT_PATH = path.join(ROOT, "AGENTS.md");

const {
  loadManifest,
  loadAgentsForBuild,
  formatDispatchTable,
  loadLeanLadder,
} = require("../lib/manifest");

const manifest = loadManifest(ROOT);
const agents = loadAgentsForBuild(ROOT);
const dispatchTable = formatDispatchTable(manifest);

const agentSections = agents
  .map((a) => {
    const role = a.manifestEntry ? a.manifestEntry.role : "unknown";
    const outputs = a.manifestEntry
      ? a.manifestEntry.outputs.join(", ")
      : "—";
    const skillsBlock = a.skills ? `\n**Skills**:\n\n${a.skills}\n` : "";
    const inputsBlock = a.inputs ? `\n**Inputs**:\n\n${a.inputs}\n` : "";
    return `### ${a.name}

**Role**: ${role}
**Outputs**: ${outputs}

${a.identity}
${skillsBlock}${inputsBlock}`;
  })
  .join("\n");

const leanLadder =
  loadLeanLadder(ROOT) ||
  `1. Does this need to exist? (YAGNI)
2. Stdlib does it?
3. Native platform feature?
4. Already-installed dependency?
5. One line?
6. Minimum code that works`;

const agentsMd = `# aiops — Agent Definitions

Lazy means efficient, not careless. The best code is the code never written.

## Lean Discipline

Before writing any code, stop at the first rung that holds:

${leanLadder}

**Rules**: No unrequested abstractions. Deletion over addition; shortest working diff. Mark deliberate shortcuts with \`// lean: <ceiling and upgrade path>\`.

**Never cut**: Trust-boundary validation, data-loss prevention, security, accessibility, explicitly requested behavior.

## Delivery Sequence

Inside \`/aiops-implement\`: lean ladder → \`/tdd\` → \`/prune\` → \`/review\` → commit only on user approval.

## Dispatch by Task Type

${dispatchTable}

## Agents

${agentSections}
`;

fs.writeFileSync(OUTPUT_PATH, agentsMd, "utf8");
console.log(`✓ AGENTS.md generated (${agents.length} agents, ${OUTPUT_PATH})`);
