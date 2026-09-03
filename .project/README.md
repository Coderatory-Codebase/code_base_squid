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
├── plans/                  How a spec is/was accomplished.
├── reviews/                 Point-in-time evaluations of completed work.
└── traces/                   The record connecting a unit of agent work's
                                execution journey — request, decisions,
                                scope, implementation, validation, outcome.
```

`tasks/`, `rfc/`, `research/`, `reports/`, `handoffs/`, `context/`,
`sessions/`, `changes/`, and `backlog/` are defined as artifact
types/concepts in `ARTIFACT-TYPES.md` but don't exist as directories yet —
nothing real belongs in them yet. Create one the first time it does;
don't pre-create empty structure. `backlog/` (`BACKLOG-<NNN>`, added M15)
holds work that's known, discovered, or deferred but not necessarily in
current scope — see
`specs/SPEC-010-agent-backlog-and-feature-driven-development.md`.
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

For a fuller narrative — how the `.agent/`/`.project/` layers work
together, the autonomous execution model, and what the real application
built so far actually does — see `OPERATING-MODEL-OVERVIEW.md`.
