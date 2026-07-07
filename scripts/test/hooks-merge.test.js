#!/usr/bin/env node
"use strict";

const { strict: assert } = require("assert");
const {
  mergeHooksConfig,
  stripAiopsHooks,
  isAiopsHookGroup,
  isEmptyHooksConfig,
} = require("../install/hooks-merge");

const existing = {
  hooks: {
    PreToolUse: [
      {
        matcher: "Bash",
        hooks: [
          {
            type: "command",
            command: "echo graphify hint",
          },
        ],
      },
    ],
    SessionStart: [
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: 'node "/hooks/aiops-activate.js" 2>/dev/null; exit 0',
          },
        ],
      },
    ],
  },
};

const incoming = {
  hooks: {
    SessionStart: [
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: 'node "/new/hooks/aiops-activate.js" 2>/dev/null; exit 0',
            timeout: 5000,
          },
        ],
      },
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: 'node "/new/hooks/aiops-graph.js" 2>/dev/null; exit 0',
            timeout: 3000,
          },
        ],
      },
    ],
    SubagentStart: [
      {
        matcher: "",
        hooks: [
          {
            type: "command",
            command: 'node "/new/hooks/aiops-subagent.js" 2>/dev/null; exit 0',
          },
        ],
      },
    ],
  },
};

const merged = mergeHooksConfig(existing, incoming);

assert.equal(merged.hooks.PreToolUse.length, 1);
assert.equal(merged.hooks.PreToolUse[0].matcher, "Bash");
assert.equal(merged.hooks.SessionStart.length, 2);
assert.match(
  merged.hooks.SessionStart[0].hooks[0].command,
  /\/new\/hooks\/aiops-activate\.js/
);
assert.equal(merged.hooks.SubagentStart.length, 1);

const remerged = mergeHooksConfig(merged, incoming);
assert.deepEqual(remerged.hooks.SessionStart, merged.hooks.SessionStart);
assert.deepEqual(remerged.hooks.SubagentStart, merged.hooks.SubagentStart);

const stripped = stripAiopsHooks(merged);
assert.equal(stripped.hooks.PreToolUse.length, 1);
assert.equal(stripped.hooks.SessionStart, undefined);
assert.equal(stripped.hooks.SubagentStart, undefined);
assert.equal(isEmptyHooksConfig(stripped), false);

assert.equal(isAiopsHookGroup(merged.hooks.SessionStart[0]), true);
assert.equal(isAiopsHookGroup(merged.hooks.PreToolUse[0]), false);

console.log("hooks-merge.test.js: ok");
