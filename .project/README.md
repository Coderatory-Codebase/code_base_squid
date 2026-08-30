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
└── reviews/                 Point-in-time evaluations of completed work.
```

`tasks/`, `rfc/`, `research/`, `reports/`, `handoffs/`, `context/`,
`sessions/`, and `changes/` are defined as artifact types/concepts in
`ARTIFACT-TYPES.md` but don't exist as directories yet — nothing real
belongs in them yet. Create one the first time it does; don't pre-create
empty structure.

## Where to start

Read `state/PROJECT-STATE.md` first. It's the one file that answers
"what's the current phase, what's done, what's active, what's next" —
without needing to read any other artifact. Only pull in a specific
spec/plan/decision/review once the state file points you at it or the task
at hand clearly needs it.
