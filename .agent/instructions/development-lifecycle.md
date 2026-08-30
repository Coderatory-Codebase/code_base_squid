---
id: development-lifecycle
type: instruction
applies_to: all-development-work
---

# Development Lifecycle

The common protocol behind every workflow in `../workflows/`. Those files
no longer restate these stages — they only describe what's specific to
their kind of change. This file is the single source of truth for the
stages themselves; `.project/specs/SPEC-004-development-lifecycle.md`
holds the durable "what must be true" version of the same model.

This formalizes what `architecture.yaml` → `agent_native_lifecycle`
already sketched (`loop`, `implementation_flow`) — it isn't a competing
third taxonomy, it's those two ideas made concrete and operational.

## The stages

```text
UNDERSTAND → PLAN → IMPLEMENT → VALIDATE → REVIEW → RECORD → COMPLETE
```

- **UNDERSTAND** — determine intent, scope, constraints, affected areas,
  and existing architecture/decisions. Clarifying what's actually being
  asked belongs here, not as a separate stage — an unclear request is
  resolved before Plan, not implemented around.
- **PLAN** — determine the implementation approach before making
  substantial changes. State it; don't silently start editing.
- **IMPLEMENT** — make the smallest coherent change that satisfies the
  plan. See "Scope control" below. The iterative reasoning used while
  doing this (observe, hypothesize, change, verify, evaluate) is
  `development-loop.md` — that file zooms into this one stage.
- **VALIDATE** — verify behavior and repository quality gates (see
  "Validation gate" below).
- **REVIEW** — inspect correctness, architecture, scope, quality,
  regressions, and maintainability (see "Review dimensions" below).
- **RECORD** — update durable artifacts when the work produced something
  worth keeping (see "Recording" below). Most changes record nothing new.
- **COMPLETE** — only once the exit criteria below are actually met, not
  when code compiles.

## Proportionality: inputs and artifacts scale with the work

Not every stage needs a dedicated artifact, and not every change needs
every artifact type. Three representative chains:

```text
Tiny bugfix:        request → implementation → tests → review
Significant feature: SPEC → PLAN → TASK → implementation → validation → REVIEW
Architectural change: RFC/discussion → ADR → SPEC → PLAN → implementation → REVIEW
```

Decide proportionality from what's actually true about the change — a
one-line fix doesn't need a SPEC because a template says features have
one; a change to `dependency_direction` needs an ADR regardless of how
small the diff is. See `.project/ARTIFACT-TYPES.md` for what each
artifact type is, and its TASK/HANDOFF sections for when those two
specifically become worth creating.

## Implementation complete vs. work complete

**Implementation complete** — code/config has been written to satisfy
the plan. This is necessary, never sufficient.

**Work complete** requires all of:

- behavior verified (manually, in a UI, or via tests, as appropriate)
- quality gates pass (`validate-repository` skill)
- review performed (self-review at minimum — see "Review dimensions")
- durable information recorded, if any was produced
- scope matches what Understand/Plan identified — nothing unrelated
  folded in, nothing required left out

Do not report a task as done because it compiles or because tests
weren't reached yet.

## Validation gate

VALIDATE means running the
[`validate-repository`](../skills/validate-repository/SKILL.md) skill
(`pnpm run validate` + `pnpm run format:check`). Don't reimplement that
check here or anywhere else — invoke it.

### Failure handling

```text
IMPLEMENT → VALIDATE → FAIL → UNDERSTAND FAILURE → FIX → VALIDATE
```

A failure is data, not an obstacle to route around. Do not: ignore it,
suppress it, weaken a rule/gate to get to green, delete a test to make it
pass, or change unrelated code without explaining why. If a failure turns
out to reveal an architectural problem rather than a local bug, stop and
reassess — loop back to UNDERSTAND/PLAN — rather than patching the
symptom repeatedly (see `validation.md`). The full diagnose/hypothesize
mechanics of this loop are in `development-loop.md`.

## Scope control

```text
Current task
  ├── required             → implement
  ├── necessary dependency → implement
  └── unrelated improvement → record/defer, don't implement
```

Discovering an adjacent problem while implementing doesn't authorize
fixing it in the same change. "Add authentication" does not become
"redesign authentication, the database, logging, authorization, and the
package system." Note the unrelated finding (a follow-up comment, or a
`HANDOFF`/new request if it has real durable value — see
`.project/ARTIFACT-TYPES.md`) and continue the current scope.

## Review dimensions

Review is not "does the code look good." At minimum, check:

- **Correctness** — satisfies the intended behavior.
- **Architecture** — respects repository boundaries (`boundaries.md`,
  `architecture.yaml`).
- **Scope** — changed only what was required or a necessary dependency.
- **Quality** — tests/validation are appropriate to the change, not
  padding or missing.
- **Regression** — could this break existing behavior elsewhere.
- **Maintainability** — no unnecessary abstraction was introduced.
- **Documentation** — durable decisions were actually recorded, not left
  implicit in a diff.

`../workflows/review.md` covers review as its own standalone workflow
(evaluating someone else's completed change); the dimensions above apply
identically when REVIEW is one stage inside a feature/bugfix/refactor
pass on your own work.

## Recording

| What happened                           | Goes to                                    |
| --------------------------------------- | ------------------------------------------ |
| Code/config change                      | source code (git history is its record)    |
| A new architectural decision            | ADR                                        |
| A new required behavior/property        | SPEC                                       |
| A plan for a bounded, multi-step effort | PLAN                                       |
| A bounded unit of work worth tracking   | TASK — see `ARTIFACT-TYPES.md`             |
| An evaluation of a completed change     | REVIEW                                     |
| Work left intentionally unfinished      | HANDOFF — see `ARTIFACT-TYPES.md`          |
| In-progress reasoning, scratch notes    | nowhere — stays in the session (ephemeral) |

When nothing durable resulted, RECORD is a no-op — that's the common
case, not a gap to fill.

## Workflow-state vocabulary (informal, not a system)

When narrating where a piece of work currently stands, use:
`planned → in-progress → validation → review → complete`. This is
descriptive vocabulary for status updates and TASK notes, not a new
artifact field, not a state machine, and not global — project-wide state
stays in `.project/state/PROJECT-STATE.md`. Don't build tooling around
these labels.

## Change management

Committing, staging, and force-operations follow `change-management.md`
unchanged — this file governs the development stages, not git mechanics.
