# .project/ — Project Memory & Engineering Artifacts

This directory records **what the project knows, has decided, is planning,
and has recorded** — as distinct from `.agent/`, which records **how
agents operate**. See `../AGENTS.md` and `../.agent/README.md` for that
side of the boundary.

```text
.project/
├── ARTIFACT-TYPES.md   Single source of truth: types, metadata, lifecycle,
│                        relationships, durable-vs-ephemeral. Read this
│                        before authoring any artifact.
├── state/               Current project state (one singleton file).
├── decisions/            ADRs — accepted architectural decisions.
├── specs/                 What should exist / what behavior is required.
├── requirements/          Intake artifacts (`REQ-*`) from raw requests.
├── plans/                  How a spec is/was accomplished.
├── projects/               Project/product operating memory.
├── reviews/                 Point-in-time evaluations of completed work.
├── reports/                 Point-in-time status/audit summaries.
├── roadmap/                 Milestone history and roadmap memory.
└── traces/                   The record connecting a unit of agent work's
                                execution journey — request, decisions,
                                scope, implementation, validation, outcome.
```

`backlog/` (`BACKLOG-<NNN>`, added M15, instantiated M22) holds work
that's known, discovered, or deferred but not necessarily in current
scope — see
`specs/SPEC-010-agent-backlog-and-feature-driven-development.md`.
`requirements/` holds `REQ-*` Intake artifacts created before Discovery
or downstream engineering work — see
`specs/SPEC-015-intake-lifecycle-phase.md`.
`projects/<project>/PROJECT.md` holds the project/product brain for a
specific project inside the monorepo. The foundation brain stays in
`AGENTS.md`, `.agent/`, `architecture.yaml`, and repository-level
`.project/` artifacts.
`roadmap/` holds milestone history moved out of `architecture.yaml` at
M26 so `architecture.yaml` can stay focused on current architecture.
`reports/` is instantiated by `REPORT-001`, the M26 behavioral audit.
`tasks/`, `rfc/`, `research/`, `handoffs/`, `context/`, `sessions/`, and
`changes/` remain defined artifact types/concepts in
`ARTIFACT-TYPES.md` without directories until real work needs them.
`traces/` (`TRACE-<NNN>`, added M18) is **observational, not
authoritative** — it references decisions/artifacts, it never replaces
the ADR/SPEC/BACKLOG/PLAN/REVIEW that actually holds one; proportional to
work significance, not created for every interaction — see
`specs/SPEC-013-agent-execution-traceability.md`.

## Where to start

Read `state/PROJECT-STATE.md` first. It's the one file that answers
"what's the current phase, what's done, what's active, what's next" —
without needing to read any other artifact. Only pull in a specific
spec/plan/decision/review once the state file points you at it or the task
at hand clearly needs it.

For project/product work, read the owning project memory next (for the
seed app, `projects/test/PROJECT.md`). Backlog rows then use
`Scope = PROJECT` and `Owner = <project>`, while operating-layer work uses
`Scope = FOUNDATION` and `Owner = repo`.

For a fuller narrative — how the `.agent/`/`.project/` layers work
together, the autonomous execution model, and what the real application
built so far actually does — see `OPERATING-MODEL-OVERVIEW.md`.
