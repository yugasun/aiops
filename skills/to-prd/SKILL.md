---
name: to-prd
description: Synthesize the current conversation into a PRD and publish to the issue tracker. No interview — use what you already know.
disable-model-invocation: true
---

Synthesize context into a PRD. Do **not** interview — use the conversation and codebase.

Run `/aiops-setup` if `docs/agents/issue-tracker.md` or triage labels are missing.

## Process

1. Explore repo if needed. Use `CONTEXT.md` vocabulary and local ADRs.
2. Sketch test seams — prefer existing, highest seam, fewest seams. Confirm with user.
3. Write PRD (template below) and publish to issue tracker with `ready-for-agent` label.

## PRD template

**Problem Statement** — user-facing problem.

**Solution** — user-facing solution.

**User Stories** — numbered `As a <actor>, I want <feature>, so that <benefit>` (extensive list).

**Implementation Decisions** — modules, interfaces, architecture, schema, API (no file paths; prototype snippets OK if they encode a decision).

**Testing Decisions** — what good tests look like, modules to test, prior art.

**Out of Scope**

**Further Notes**
