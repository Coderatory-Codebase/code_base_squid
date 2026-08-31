---
id: SPEC-010
type: spec
title: Agent backlog & feature-driven development model
status: active
created: 2026-08-30
related: [SPEC-004, SPEC-006, SPEC-007, SPEC-008, SPEC-009, ADR-010, ARTIFACT-TYPES.md]
---

# SPEC-010: Agent Backlog & Feature-Driven Development Model

Operational entry point: `.agent/instructions/backlog-and-feature-development.md`.
This spec is the comprehensive, durable definition; that file is the
shorter agent-facing pointer into it.

## Purpose

M06/M08 define **how** a change moves through its stages
(`development-lifecycle.md`, `development-loop.md`). Neither says how an
agent should decide **what belongs in the current change** versus what
should be captured for later. This spec is that layer: a work-management
model for receiving a request, bounding it into a coherent feature,
distinguishing what's needed now from what was merely discovered, and
recording the difference durably — so an agent given real implementation
work (once this repository has some) doesn't either under-deliver an
under-analyzed feature or over-deliver an unbounded one.

## Central principle

> **Discovery does not automatically become implementation scope.**

```text
                 Feature A
                     │
                 ANALYSIS
                     │
          ┌──────────┴──────────┐
          │                     │
       Needed now          Discovered work
          │                     │
          ▼                     ▼
     Current scope           Backlog
          │
          ▼
     Implementation
```

Analyzing a feature will surface more possibilities than the feature
needs. Finding fifteen adjacent things does not authorize building
fifteen adjacent things. Every section below serves this one rule.

## Scope

Work-management model and repository conventions only. Does **not**
implement an agent runtime, planner, orchestrator, backlog engine,
project-management application, database, API, or CLI (see "Non-goals").
Does not replace `development-lifecycle.md` or `development-loop.md` —
extends their work-management context (see "Lifecycle integration").

## Backlog definition

A **backlog** is a durable representation of work that is known,
proposed, discovered, deferred, or awaiting clarification, but is not
necessarily part of the current implementation scope. A backlog item is
not automatically a task — it may represent a feature, enhancement,
defect, technical improvement, architectural work, investigation,
dependency, risk, discovered requirement, or deferred decision.

Explicitly:

```text
Backlog ≠ Task list
Backlog ≠ RFC repository
Backlog ≠ SPEC repository
Backlog ≠ Project-management application
```

These artifacts relate to each other (see "Traceability") but serve
different purposes — collapsing them loses the distinction between "work
that might happen" (backlog), "an unresolved design question" (RFC), and
"authoritative durable knowledge" (SPEC).

## Work states

```text
captured → clarifying → ready → selected → in-progress → review → completed
```

with `deferred`, `blocked`, `rejected`, and `superseded` reachable from
any non-terminal state.

| State         | Means                                                                                 |
| ------------- | ------------------------------------------------------------------------------------- |
| `captured`    | Recorded with enough context to be meaningful later. Nothing more.                    |
| `clarifying`  | Known ambiguity is blocking readiness — see "Ambiguity handling".                     |
| `ready`       | Understood well enough to select for implementation when prioritized.                 |
| `selected`    | Chosen for the current/next unit of work (a human/project decision, see "Ownership"). |
| `in-progress` | Actively being implemented (mirrors the lifecycle's IMPLEMENT stage).                 |
| `review`      | Implementation complete, undergoing REVIEW (`development-lifecycle.md`).              |
| `completed`   | Work-complete per `development-lifecycle.md` — not merely "code compiles."            |
| `deferred`    | Deliberately excluded from current scope, with a stated reason.                       |
| `blocked`     | Cannot proceed — a blocker is recorded (see "Blocked work").                          |
| `rejected`    | Deliberately will not be done, with a stated reason.                                  |
| `superseded`  | Replaced by a newer item; points at it via `related:`.                                |

Seven forward states plus four side states — not a generic
project-management taxonomy. No `in-review-2`, no `qa`, no `staged`; add a
state only if a real recurring need can't be expressed with these.

## Backlog, feature, task, RFC, SPEC — the boundary

| Artifact         | Represents                                                                                             | Where it lives                                                                                                                 |
| ---------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| **Backlog item** | Work or potential work — known, proposed, discovered, deferred, or unclear.                            | `.project/backlog/` (`BACKLOG-NNN`, `ARTIFACT-TYPES.md`)                                                                       |
| **Feature**      | A coherent user/system capability implementable and verifiable end-to-end.                             | Not a new artifact type — realized via `.agent/workflows/feature.md`, sized proportionally (see "Feature-driven development"). |
| **Task**         | A bounded implementation unit inside a feature.                                                        | `TASK-NNN` when the criteria in `ARTIFACT-TYPES.md` are met; otherwise informal, inside the feature's own plan/session.        |
| **RFC**          | An unresolved, significant design/decision question needing structured exploration and review.         | `RFC-NNN` (`ARTIFACT-TYPES.md`) — see "RFC escalation".                                                                        |
| **SPEC**         | Sufficiently understood, durable requirement/model that should become authoritative project knowledge. | `SPEC-NNN` — see "SPEC escalation".                                                                                            |

A feature deliberately gets **no new artifact type or ID scheme** — it is
whatever `feature.md` already sizes it as: a self-explanatory change for a
small feature, or `SPEC → PLAN → TASK → implementation → validation →
REVIEW` for a significant one (`development-lifecycle.md` →
"Proportionality"). Inventing `FEATURE-NNN` on top of that would
duplicate a decision M06 already made correctly.

## Feature-driven development

The preferred unit of implementation in this repository is the
**feature**, not "build the entire application" and not "all backend,
then all frontend, then all tests":

```text
Feature
    ↓
Understand → Analyze → Design → Implement → Test → Verify → Review → Complete
```

This is `development-lifecycle.md`'s existing stage sequence, read through
a feature-sized lens — see "Lifecycle integration" for the exact mapping.
Nothing here replaces it.

## Feature slicing

Prefer slicing by valuable, coherent behavior over technical layer:

```text
User registration                    (preferred)
    ├── UI
    ├── API
    ├── validation
    ├── persistence
    ├── tests
    └── acceptance

Frontend sprint / Backend sprint /   (avoid as a default)
Database sprint / Testing sprint
```

Not an absolute rule — infrastructure, architecture, migration, and
platform work are legitimately layer- or system-oriented, and this
repository's own M01–M14 history is exactly that kind of work. The
governing principle: **prefer the smallest independently understandable
and verifiable increment that delivers meaningful progress**, whichever
axis that increment happens to run along.

## Analysis lenses

Before planning implementation, analyze the feature through the lenses
that are actually relevant — not a mandatory checklist for every change:

```text
Requirements · User behavior · Domain · Architecture · System design ·
Data · API/integration · Security · Performance · Reliability ·
Observability · Testing · UX/UI · Accessibility · Dependencies ·
Operational impact · Migration · Compatibility · Cost · Risks ·
Constraints · Edge cases
```

A one-line config fix needs none of these explicitly reasoned through; a
new authentication feature needs most of them. Select proportionally to
the problem, the same judgment `SPEC-008` already asks for
(`SPEC-008` → "Agent engineering judgment").

## "Needed now" vs. discovered

Distinguish, explicitly, before implementing anything:

```text
Feature: "Basic email/password authentication"

Required now:              Not required now:
✓ account creation          → SSO
✓ password hashing          → passkeys
✓ login                     → social login
✓ session handling          → advanced authentication analytics
✓ logout
```

The right column does not silently enter the implementation. It becomes
backlog work (see "Discovery capture"), not a design decision the current
feature quietly makes room for.

## Discovery capture

While analyzing or implementing, the agent will find more than the
feature needs. Capture what's worth remembering as a `captured` backlog
item, recording enough that it isn't meaningless later:

```text
What was discovered?
Why does it matter?
Where was it discovered (which feature/file/decision)?
What triggered it?
Is it required now? (almost always: no — that's why it's here, not in scope)
What dependency/context exists?
```

Record the "where" as a `discovered-from` edge when the source has stable
identity (`engineering-graph.md`); otherwise a prose note is enough. Don't
require this ceremony for something genuinely trivial — a one-line
observation with no real future value isn't a backlog item, it's a
comment in the change itself or nothing at all. The failure mode this
guards against either direction: silently losing a real discovery, or
inflating the backlog with unexplained `TODO: improve this` noise.

## Deferred work

**Discovered** ≠ **deferred**. A discovery may be a passing observation.
A deferred item is something deliberately excluded from the current
feature's scope, with a stated reason:

```text
Feature: Checkout
Deferred: "Support multiple currencies"
Reason: Not required for current launch scope.
```

The reason is required content, not optional — a backlog full of
unexplained deferrals is as useless as no backlog at all.

## Ambiguity handling

```text
ambiguity
    ↓
identify impact
    ↓
does existing knowledge (architecture.yaml / ADRs / SPECs / repository
convention) resolve it?
    │
    ├── yes → proceed, note the resolution if non-obvious
    │
    └── no → does it materially affect behavior, architecture, scope,
             security, or another important decision?
              │
              ├── no  → make a bounded, recorded assumption, proceed
              │         (development-loop.md -> "Uncertainty")
              │
              └── yes → ask (see "Human feedback points")
```

Examples of _material_ ambiguity: which users can perform an action, what
happens on payment failure, whether deletion is permanent, whether an API
must stay backward compatible, what authorization model applies. Don't
turn a trivial implementation detail (a variable name, a log message's
exact wording) into an approval gate.

## RFC escalation

Not every question deserves an RFC:

```text
question
   ↓
existing architecture/standards answer it? → yes → proceed
   ↓ no
significant? (architecture, competing approaches, cross-system impact,
irreversible, major technology selection, substantial operational
implications, security-sensitive, meaningful cost/performance trade-off,
future work depends on it)
   │
   ├── no  → decide locally, proceed (record if the decision has durable value)
   └── yes → RFC (`RFC-NNN`, `ARTIFACT-TYPES.md`) → human review → (typically) ADR
```

A small implementation decision ("should this helper take an object or
positional args") is never an RFC.

## SPEC escalation

Use a SPEC when knowledge becomes durable and authoritative enough that
future implementation should rely on it — a domain model, API behavior,
an architecture boundary, a major system capability, a persistent
business rule, an important integration contract. Don't create a SPEC to
document a small coding decision; that's what the change/commit itself
already records (`development-lifecycle.md` → "Recording").

## Human feedback points

```text
Agent investigates first
        ↓
Agent identifies actual uncertainty
        ↓
Agent presents concise decision/context
        ↓
Human resolves ambiguity
        ↓
Agent records the decision
        ↓
Work continues
```

Ask when: requirements are ambiguous in a way that matters, scope is
uncertain, multiple valid product interpretations exist, architectural
trade-offs are significant, security/business implications exist, the
decision is hard to reverse, or the agent genuinely lacks required
context. Human feedback exists to reduce real ambiguity — it is not
ceremonial approval for routine implementation choices already covered by
`SPEC-008`/`architecture.yaml`/existing convention.

## Feature planning

Before implementing a non-trivial feature, produce a plan proportional to
its complexity — derived from the analysis above, not filled in
mechanically. Potential elements: objective, scope, out-of-scope,
requirements, acceptance criteria, relevant constraints, dependencies,
architecture impact, data/API impact, security considerations, testing
strategy, implementation steps, validation, rollout/migration
considerations, known deferred work. A trivial feature needs almost none
of these explicitly written out — this extends, not replaces,
`development-lifecycle.md` → "Proportionality" (which already
distinguishes a tiny bugfix from a significant feature from an
architectural change).

## Acceptance criteria

Describe observable behavior or verifiable outcomes, not implementation
steps:

```text
Prefer:                                    Avoid (these are tasks, not criteria):
User can create an account with a          Implement auth service.
  valid email.                             Create controller.
Duplicate email registration is rejected.  Create database model.
Password is never stored in plaintext.
Successful registration creates an
  active account.
```

## Task breakdown

Break a feature into tasks when doing so helps execution — e.g.:

```text
Feature: User registration
  1. Define registration behavior
  2. Implement domain logic
  3. Implement persistence
  4. Implement API
  5. Implement UI
  6. Add tests
  7. Validate
```

Not into meaningless microtasks ("create file", "write import", "rename
variable", "run formatter") unless the execution context genuinely needs
that granularity. `TASK-NNN` instantiation still follows
`ARTIFACT-TYPES.md`'s existing criteria — most task breakdowns stay
informal, inside the feature's own plan.

## Dependency handling

If Feature A cannot be completed without Feature B:

```text
A --depends-on--> B   (engineering-graph.md, once both have stable identity)
```

Do not automatically implement B because it's a dependency. Determine:
does B already exist; should B become its own feature; does B need an
RFC/SPEC; should B be scheduled before A; or should A be reshaped to
remove the dependency. That determination is itself feature analysis, not
a mechanical rule.

## Blocked work

A feature may become blocked: a missing product decision, an unavailable
external API, an unresolved architecture decision, an unavailable
dependency, an unresolved security requirement. Do not work around a
blocker by silently changing the requirement. Capture the blocker, its
impact, what resolution is required, and the decision source if known;
return the item to `blocked` and move on rather than guessing past it.

## Prioritization

Minimal, not an algorithm. The repository distinguishes **known work**
(anything `captured` or later) from **currently selected work**
(`selected`/`in-progress`). Consider value, urgency, dependency, risk,
effort, and architectural sequencing when recommending priority — but
prioritization is a product/project decision. See "Ownership" below: the
agent may recommend from evidence; it does not invent business priority.

## Ownership

```text
Human/Product   → determines desired outcomes and priority
Agent           → analyzes, decomposes, executes, discovers, records
Repository      → preserves durable state and decisions
```

An agent maintaining discovered work, implementation follow-ups, blocked
items, and technical discoveries is not thereby "product management" —
selecting _what gets built next_ from that backlog remains a human/project
decision unless a human has explicitly delegated it for a specific case.
Don't let backlog maintenance quietly become autonomous prioritization.

## One backlog, not several

**Decision**: a single, repository-native backlog — not separate
product/project/agent/feature/technical backlogs. Full rationale:
`ADR-010`. Summary: this repository has one contributor, no team
structure implying separate audiences, and the existing `.project/`
convention already uses one singleton (`PROJECT-STATE.md`) plus typed,
individually-identified artifacts (`SPEC-*`, `ADR-*`) rather than parallel
type-specific stores. Multiple backlogs would duplicate discoverability
effort and fragment "what's known" across files that inevitably drift.
Different _kinds_ of work (feature, defect, technical, architectural,
discovery, risk) are represented as a `kind:` field on one item type, not
as separate backlogs.

## Persistence

Repository-native, version-controlled, one file per item —
`.project/backlog/BACKLOG-<NNN>-<slug>.md`, same convention as
`SPEC-*`/`ADR-*`/`PLAN-*`/`REVIEW-*` (`ARTIFACT-TYPES.md`). No database,
API, CLI, or web application (see "Non-goals") — a backlog item is
inspected the same way every other artifact in this repository is:
opened and read. The directory does not exist yet; created the first time
a real item does (`ARTIFACT-TYPES.md` → "Why no ... `backlog/` yet").

### Backlog item frontmatter

```yaml
---
id: BACKLOG-001
type: backlog
title: Short human-readable title
kind: feature | enhancement | defect | technical | architectural |
  investigation | dependency | risk | discovered-requirement |
  deferred-decision
status: captured
created: 2026-08-30
updated: 2026-08-30 # once it changes post-creation
related: [SPEC-*, ADR-*, RFC-*] # when a real reference exists
relations: # optional, only when the precision is actually needed
  - type: discovered-from
    target: "the Checkout feature" # or a stable ID once one exists
  - type: depends-on
    target: BACKLOG-004
---
```

`id`/`type`/`title`/`status`/`created` are required, matching every other
artifact type's convention (`ARTIFACT-TYPES.md` → "Metadata convention").
`kind` is new to this type — it's how "feature vs. defect vs. technical
work vs. risk" is expressed without inventing separate backlogs or
artifact types for each. Body content, minimum: what was discovered/
proposed, why it matters, current status detail (e.g. the deferral reason,
the blocker, the clarifying question), and any known dependency.

## Traceability

```text
Backlog item → Feature → SPEC/RFC (if any) → Plan → Implementation →
  Commit/PR → Validation → Record
```

Not every link is required for every item — traceability should be
useful, not bureaucratic. A `related:`/`relations:` reference is enough;
no new tracking mechanism is built (`engineering-graph.md` already
defines how references and typed edges work).

## Discovered-from relationships

Provenance matters: a future agent should be able to tell _why_ a backlog
item exists. Use the `discovered-from` edge
(`engineering-graph.md`, added M15) when the source has stable identity;
otherwise a plain prose note in the item's body is sufficient. No graph
engine — this is the existing M09 documentation-level model, extended by
exactly one relationship type because "an item was found while doing
something else" is a genuinely distinct semantic from `derived-from`
(code extraction) and nothing else in the vocabulary captures it.

## Scope control

**Anti-pattern**: scope expansion by discovery.

```text
Feature A → discover Feature B → implement B "while already here"   ✗

Feature A → discover B → capture B → finish A                        ✓
  (unless B is actually necessary to satisfy A)
```

This restates `development-lifecycle.md` → "Scope control"
(`Current task: required → implement; necessary dependency → implement;
unrelated improvement → record/defer, don't implement`) applied
specifically to _discovered_ work. The agent must be able to state, for
anything that entered the current scope, why it was actually necessary —
not merely convenient to do while already in the area.

## Lifecycle integration

No new lifecycle. The backlog/feature model surrounds the existing one:

```text
BACKLOG
   ↓
SELECT / DEFINE FEATURE
   ↓
OBSERVE                    ┐
UNDERSTAND                 │  = development-lifecycle.md's UNDERSTAND,
ANALYZE                    │    read through this spec's lenses/needed-now
                            ┘    distinction
   ↓
HUMAN FEEDBACK / RFC / SPEC WHEN NEEDED   (this spec's escalation rules)
   ↓
PLAN                       = development-lifecycle.md's PLAN
   ↓
CHANGE                     = development-lifecycle.md's IMPLEMENT,
                              using development-loop.md internally
   ↓
VERIFY                     ┐
EVALUATE                   │ = development-lifecycle.md's VALIDATE
                            ┘
   ↓
REVIEW                     = development-lifecycle.md's REVIEW
   ↓
RECORD                     = development-lifecycle.md's RECORD
   ↓
UPDATE BACKLOG             (this spec's addition — see below)
```

`development-lifecycle.md` and `development-loop.md` remain authoritative
for the stages themselves; this spec adds the work-management context
around them (what to select, what counts as in-scope, what to do with
what falls out).

## Backlog updates after a feature

At the end of a feature, before calling it complete, the agent evaluates:
what was completed, what remains, what was discovered, what was
deferred, what decisions were made, what assumptions changed, what
follow-up work is now known — then updates the relevant backlog items
(new `captured` items for real discoveries, status changes for anything
that was `selected`/`in-progress`). Don't mark a feature "done" and
silently drop what was learned while building it.

## Engineering-standards integration

```text
Backlog → Feature analysis → Engineering standards (SPEC-008) →
  Technology skills → Architecture constraints → Implementation
```

This spec does not restate `SPEC-008`'s principles (simplicity, reuse,
decoupling, proportional architecture, ...) — a feature's design phase
applies them directly. See `engineering-standards.md`.

## Technology-skill integration

```text
Feature → identify technologies involved → load relevant technology
  skill(s), if any exist → analyze constraints/practices → plan → implement
```

Technology skills stay conditional and contextual (`SPEC-008` →
"Technology skill model") — a feature loads only the skills its actual
technologies warrant, never every skill that exists. No technology skill
is created by this milestone; none is warranted (no implementation
technology exists yet).

## Git integration

A feature typically maps to a feature branch, coherent commits,
validation, a PR, review, and merge — governed entirely by
`.agent/instructions/git-governance.md`, `SPEC-009`, `ADR-009`, and
`tooling/`. This spec does not restate those rules or require one branch
per task; it only says a feature is the natural unit those rules apply to.

## Non-goals

No agent runtime, planner engine, orchestrator, backlog engine, task
scheduler, autonomous project manager, agent memory database, or workflow
execution engine. No Kanban UI, dashboard, backlog web app, task API,
database, CLI, or external project-management integration. No
`BacklogManager`/`FeatureManager`/`TaskManager`/`WorkItemEngine`/
`PlanningEngine`/`ScopeEngine`/`DiscoveryEngine` abstraction — a
documented model plus plain markdown files is sufficient at this stage
(`SPEC-008` → "Proportional architecture", applied here). No speculative
technology skills, no MCP, no orchestration, no new lifecycle competing
with M06/M08. No `apps/`/`servers/`/`agents/`/`packages/` implementation —
this milestone establishes the model a future feature will use, it is not
itself a feature.

## Status

`active` — governs how agents receive, analyze, scope, and record
implementation work, and how discovered/deferred work is captured, from
M15 onward.
