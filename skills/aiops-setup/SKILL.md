---
name: aiops-setup
description: Configure a target project for the aiops bundle — issue tracker, triage labels, domain doc layout. Run once per project before other engineering skills.
disable-model-invocation: true
---

# aiops-setup

Scaffold per-repo config the bundle assumes: **issue tracker**, **triage labels**, **domain docs**. Prompt-driven — explore, confirm one decision at a time, then write.

## Process

### 1. Explore

Check: `git remote`, `AGENTS.md` / `CLAUDE.md`, `CONTEXT.md`, `CONTEXT-MAP.md`, `docs/adr/`, `docs/agents/`, `.scratch/`.

### 2. Ask (one section at a time)

**A — Issue tracker:** GitHub (`gh`), GitLab (`glab`), local markdown (`.scratch/<feature>/`), or other (user describes). For GitHub/GitLab only: PRs as triage surface? (default no)

**B — Triage labels:** Map five roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`) to tracker strings. Default 1:1.

**C — Domain docs:** Single-context (`CONTEXT.md` + `docs/adr/`) or multi-context (`CONTEXT-MAP.md`).

### 3. Confirm draft

Show `## Agent skills` block + `docs/agents/issue-tracker.md`, `triage-labels.md`, `domain.md` for user edit.

### 4. Write

Edit `CLAUDE.md` if present, else `AGENTS.md` (ask if neither exists). Update existing `## Agent skills` in-place.

Seed templates in this folder: `issue-tracker-*.md`, `triage-labels.md`, `domain.md`.

### 5. Done

Point user to `docs/agents/*.md` for later edits. Re-run only to switch trackers or restart.
