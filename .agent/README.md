# .agent/ — Repository Agent Operating System

This directory defines **how agents operate** in this repository. It is not
application code and not project memory.

```text
.agent/
├── instructions/   Standing rules an agent applies while working here.
├── workflows/      Lifecycle specs for common change types and Intake
│                   capture (not an engine).
├── skills/         Discoverable, self-describing capabilities.
└── templates/      Authoring templates for the above.
```

## Relationship to the rest of the repository

- **`AGENTS.md`** (repo root) is the agent-agnostic rulebook. It is short by
  design and stays that way — this directory is where the detail it points
  to actually lives.
- **`CLAUDE.md`** (repo root) is a thin, Claude-specific entry point into
  `AGENTS.md` and this directory. It does not restate their contents.
- **`.project/`** holds project memory — current state, decisions, specs,
  plans, reviews (see `../.project/README.md` and
  `../.project/ARTIFACT-TYPES.md`) — i.e. _what the project knows_, as
  distinct from _how agents operate_, which is this directory's job.
  `.project/projects/<project>/PROJECT.md` is the scoped product/project
  brain for work inside a specific project.
- **`architecture.yaml`** remains the single source of truth for current
  architecture, boundaries, dependency direction, project-owned
  deployables, operating routing, and active phase. Milestone history is
  context, not a replacement for current architecture. Nothing here
  overrides it.

## Discovery flow

```text
CLAUDE.md (or another agent's entry point)
  → AGENTS.md
  → classify the request (foundation, seed-app, or cross-cutting)
  → .agent/instructions/*   (standing rules relevant to the task)
  → .agent/workflows/*      (lifecycle for the kind of change being made)
                            (intake.md captures raw requests and stops)
  → .agent/skills/*         (a concrete capability needed to do the work)
  → .project/state/PROJECT-STATE.md  (current phase, decisions, next up)
  → .project/projects/<project>/PROJECT.md  (owning project/product brain)
  → .project/*              (a specific spec/plan/decision/review, if needed)
  → source code
```

Load only the layers a given task needs. Nothing here is meant to be read
end-to-end before every change.
