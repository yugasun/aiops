---
name: handoff
description: Compact the current conversation into a handoff document for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff to the OS temp directory (not the workspace) so a fresh agent can continue.

Include:
- **Goal** — what the next session should accomplish
- **Decisions** — what is settled
- **Open questions** — what is not
- **Artifacts** — paths to PRDs, issues, ADRs, plans (reference, don't duplicate)
- **Suggested skills** — which bundle skills to invoke next (`/aiops`, `/aiops-implement`, etc.)

Redact secrets. If the user passed arguments, treat them as the next-session focus.
