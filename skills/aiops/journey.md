# Journey state — `flow.state.yaml`

Resumable progress for `/aiops` Flow Conductor. Path: `.scratch/<slug>/flow.state.yaml`.

## State operations via CLI

The conductor uses `flow_cli.py` subcommands for all state mutations — never edits the YAML directly. This ensures router.py is the single source of truth.

```bash
# Start a new journey
python3 <aiops-root>/skills/aiops/scripts/flow_cli.py init --slug <slug> --task-kind <kind> --configured --description "..."

# Advance to the next phase (after gate checks pass)
python3 <aiops-root>/skills/aiops/scripts/flow_cli.py advance --slug <slug>

# Verify gate artifacts exist for all satisfied gates
python3 <aiops-root>/skills/aiops/scripts/flow_cli.py validate --slug <slug>

# Print flow plan without writing state
python3 <aiops-root>/skills/aiops/scripts/flow_cli.py plan --task-kind <kind> --configured
```

Maintainers: canonical phase list from `python3 <aiops-root>/skills/aiops/scripts/flow_cli.py plan` (this repo only).

## Schema (version 1)

```yaml
version: 1
slug: login
task_kind: feature_idea  # feature_idea | feature_with_ui | bug_fix | incoming_queue | architecture_health | new_personal_skill | prototype
delivery_mode: single_session  # single_session | multi_session
user_description: "做一个用户登录功能"
current_phase_id: alignment  # phase_id from plan_flow | done (terminal sentinel)
phases_done: []
gates_satisfied: []  # e.g. design_review_approve, review_approve
current_issue: null  # e.g. issues/001-add-auth.md when multi-session
```

### Terminal state

When `advance_journey` moves past the last phase, `current_phase_id` is set to `done`. On resume, if `current_phase_id` is `done`, the conductor tells the user the journey is complete and does not dispatch further phases.

## Gate names (append to `gates_satisfied`)

| Gate | Artifact check |
| --- | --- |
| `bootstrap_done` | `docs/agents/` directory exists |
| `design_review_approve` | `DESIGN_REVIEW.md` contains APPROVE |
| `prototype_verdict` | `VERDICT.md` exists |
| `prune_done` | `PRUNE.md` exists |
| `review_approve` | `REVIEW.md` contains APPROVE |
| `ready_for_commit` | `REVIEW.md` contains APPROVE |

Gate artifacts are verified by `flow_cli.py validate` — the conductor runs this **before** appending to `gates_satisfied`.

## When to read / write

- **Start** `/aiops` (new): run `flow_cli.py init` to write initial state.
- **Resume** `/aiops`: read `flow.state.yaml`; if `current_phase_id` is `done`, inform user; otherwise load agent from current phase.
- **End each phase**: run `flow_cli.py validate` to check gates, then `flow_cli.py advance` to move forward.
- **Handoff** (`/handoff`): update journey **before** writing temp handoff doc.

## Resume

User says「继续」「resume」「上次」→ read `flow.state.yaml`. If `current_phase_id` is `done`, tell user journey is complete. Otherwise show narration for `current_phase_id` without re-asking task type.

## FlowState inference (new journey)

| Signal | Flag |
| --- | --- |
| Empty / no src | `has_codebase: false` → `/grilling` |
| Bug / 报错 / regression | `task_kind: bug_fix` |
| 优化架构 / 技术债 / refactor codebase | `task_kind: architecture_health` |
| 待办 / triage / issue #N | `task_kind: incoming_queue` |
| 界面 / UI / 页面 | `task_kind: feature_with_ui` |
| User confirms multi / 多会话 / AFK per issue | `delivery_mode: multi_session` |
| **Default** | `delivery_mode: single_session` |
| No `docs/agents/` | `issue_tracker_configured: false` → bootstrap phase |
| `aiops.yaml` with `issue_tracker.kind` github or gitlab | bootstrap seeds remote tracker (see `skills/aiops-setup/aiops-yaml.md`) |
| No `aiops.yaml` | bootstrap uses local markdown + 1:1 labels silently |
