---
id: SPEC-008
type: spec
title: Engineering standards, design & practice model
status: active
created: 2026-08-30
related: [SPEC-003, SPEC-004, SPEC-005, SPEC-006, SPEC-007, ADR-002, ADR-003, ADR-008]
---

# SPEC-008: Engineering Standards, Design & Practice Model

Operational entry point: `.agent/instructions/engineering-standards.md`. This
spec is the comprehensive, durable definition; that file is the shorter
agent-facing pointer into it.

## Purpose

`architecture.yaml` defines this repository's structural boundaries. It does
not say how to design and implement good software _inside_ those boundaries.
This spec establishes that layer: a technology-neutral model of engineering
principles, design judgment, and a mechanism (technology skills) for
applying them to a specific language/framework/library — so a future agent
building an actual app/server/agent/package has a consistent way to produce
clean, maintainable, appropriately reusable, decoupled software without
either inventing conventions ad hoc or following rules mechanically.

## Scope

Universal engineering principles, design guidance, a precedence model for
resolving conflicting guidance, and the technology-skill mechanism. Does
**not** implement any technology, does not build a best-practices handbook,
does not add validation tooling, and does not change `architecture.yaml`,
the package model (`SPEC-003`), the lifecycle (`SPEC-004`), the capability
model (`SPEC-005`), the development loop (`SPEC-006`), or the graph model
(`SPEC-007`). This spec sits alongside them, at the "how to engineer well"
layer rather than the "how the repository is structured" or "how agents
operate" layers.

## Vocabulary

| Term                      | Meaning                                                                                                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Architecture**          | Structural boundaries, ownership, relationships, durable decisions (`architecture.yaml`, ADRs).                        |
| **Engineering principle** | A general, technology-neutral idea guiding design (cohesion, coupling, simplicity, ...).                               |
| **Standard**              | A rule this project expects implementations to follow, absent a stated exception.                                      |
| **Recommendation**        | A preferred approach that may be overridden when context justifies it.                                                 |
| **Pattern**               | A known reusable solution to a recurring problem.                                                                      |
| **Anti-pattern**          | A known approach that commonly creates unnecessary complexity/coupling/fragility — contextual, not forbidden outright. |
| **Constraint**            | A hard requirement that must not be violated (e.g. dependency direction, security boundary).                           |
| **Exception**             | An explicit, justified deviation from a standard/recommendation.                                                       |
| **Validation**            | A mechanism that checks whether an implementation actually satisfies applicable expectations.                          |

Not all guidance is equally rigid: constraints must hold; standards hold
absent a stated exception; recommendations and patterns are defaults, not
mandates; anti-patterns are signals to reconsider, not forbidden words.

## Core engineering principles

Technology-independent. Apply regardless of language/framework.

| Principle              | Means                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| Simplicity             | Prefer the least complex design that correctly satisfies the actual requirement.                  |
| Cohesion               | Group what changes together and belongs together; keep unrelated concerns apart.                  |
| Coupling               | Minimize what one part must know about another's internals to work correctly.                     |
| Separation of concerns | Distinct responsibilities (input, logic, persistence, presentation) don't entangle.               |
| Single responsibility  | A unit has one reason to change — not one method, not one file, one _reason_.                     |
| Explicit dependencies  | What a unit needs is visible (parameters, imports), not hidden (globals, ambient state).          |
| Composition            | Build behavior by combining small, focused units rather than one unit doing everything.           |
| Encapsulation          | Expose what's needed; keep implementation detail private and changeable.                          |
| Locality               | Code affecting a decision lives near that decision, not scattered across the codebase.            |
| Testability            | A design that's hard to test in isolation is usually too coupled or too large.                    |
| Observability          | A system's behavior can be understood from outside it when something goes wrong.                  |
| Security               | Secure-by-default; trust boundaries and privilege are explicit, not assumed.                      |
| Maintainability        | A future reader (agent or human) can change this safely without full-system context.              |
| Readability            | Code communicates intent; naming and structure reduce the need for explanation.                   |
| Evolvability           | The design tolerates requirements changing without a rewrite, without over-predicting the future. |
| Failure isolation      | One component's failure doesn't cascade beyond its actual blast radius.                           |

### KISS / YAGNI / DRY / SOLID — interpretation, not slogans

These are starting heuristics, applied with judgment, never mechanically:

- **DRY** does not mean eliminate every repeated line — see "Reuse and
  generalization" below. Two or three similar lines are often clearer than
  a premature shared abstraction.
- **YAGNI** does not mean ignore obvious architectural requirements a task
  clearly implies — it means don't build for a _hypothetical_ future
  requirement nobody has stated.
- **SOLID** does not mean every class needs an interface, or every
  dependency needs injection — it means responsibilities stay separated and
  dependencies stay explicit; apply the specific letter that addresses an
  actual problem in the design at hand.
- **KISS** does not mean simplistic architecture regardless of actual
  complexity — see "Proportional architecture" below. Simplicity is
  relative to the problem's real shape, not a ceiling imposed on it.

## Proportional architecture

> Architecture should be proportional to actual complexity and boundaries.

Do not require every feature to have a controller/service/repository/
factory/adapter/interface/DTO/mapper/manager layer unless that boundary is
actually justified. Decide structure by asking:

```text
What is the responsibility?
Who owns it?
Who depends on it?
What changes together?
What should remain private vs exposed?
Is the boundary stable?
Does extraction reduce complexity, or just relocate it?
```

A simple feature may stay a single file. A genuinely complex subsystem may
need explicit layers. Ceremonial architecture — structure added because it
"looks proper," not because a boundary demands it — is rejected. No
universal directory template (`controllers/`, `services/`, `repositories/`,
`models/`, `utils/`, or equivalent) is imposed on any deployable;
`architecture.yaml`'s `composable-architecture` principle (`ADR-003`)
already establishes this at the repo-wide level — this section is the same
judgment applied one level down, inside a deployable.

## Reuse and generalization

> Reuse should be earned. Generalization should be justified.

This generalizes the "ownership before reuse" rule already established for
packages (`packages.md`, `ADR-008`) and contracts (`contracts.md`) to _any_
code-level reuse decision, not only `packages/` extraction:

```text
Need
 ↓
Observe (is this actually duplicated, or just similar-looking?)
 ↓
Identify a stable boundary (would ≥2 real, independent call sites share it,
 not a hypothetical future one?)
 ↓
Extract when justified — keep local otherwise
```

Distinguish **duplication** (two things that happen to look alike today,
may diverge tomorrow, no shared reason to change together) from **stable
commonality** (the same concept, genuinely shared, changes together). Don't
extract the former; don't leave the latter duplicated once it's real.
Distinguish **reuse** (a real second consumer exists) from **premature
abstraction** (an interface/parameter built to anticipate a consumer that
doesn't exist yet) — the latter is not reuse, it's speculative cost paid
now for a benefit that may never arrive.

## Decoupling

Identify and reduce unnecessary coupling: dependency direction, ownership,
interface boundaries, data coupling, control coupling, temporal coupling,
global state, hidden dependencies, implementation leakage, cross-layer
coupling.

Prefer: explicit dependencies, clear ownership, small interfaces, stable
boundaries, composition, dependency inversion where it actually removes a
real dependency problem.

Avoid, without treating as absolute prohibition: global mutable state,
hidden service locators, unnecessary singletons, deep import chains that
cross an owning boundary, infrastructure concerns leaking into domain code.
Context determines whether an "avoid" item is actually the simpler choice
in a specific case.

## Component design

Applies to component-oriented systems (UI components, and analogous
composable units elsewhere): single responsibility, composition, clear
state ownership, controlled vs. uncontrolled behavior, a deliberately
small/explicit public API (props/inputs), encapsulation of internal detail,
separating presentation from behavior, and a clear line between
feature-local components, shared primitives, and (if one exists) a
design-system boundary.

- **Local components** — acceptable to be specific to one feature or
  screen. Not every component needs to anticipate reuse.
- **Reusable components** — extract once multiple _real_ consumers share
  stable behavior, or the boundary is independently meaningful on its own
  terms (same bar as "Reuse and generalization" above).
- **Generalized components** — avoid turning a simple component into an
  overly configurable framework (a `UniversalButton`, `GenericRenderer`,
  `MegaForm`, catch-all table component) when a focused component stays
  clearer. **Optimize for clarity and stable reuse, not maximum
  configurability.**

## System design

Before introducing infrastructure, consider: boundaries, ownership,
interfaces, data flow, dependency direction, failure modes, state
ownership, synchronous vs. asynchronous communication, external
integrations, persistence boundaries, security boundaries, observability,
scalability, testability.

No architectural style is mandated: not microservices, not event-driven,
not DDD, not hexagonal, not CQRS — consistent with `architecture.yaml`'s
`composable-architecture` principle (`ADR-003`). **Use an architectural
pattern because the problem requires it, not because it's fashionable.**

## API and integration principles

Technology-neutral; no protocol (REST/GraphQL/RPC) or framework is
mandated — the boundary's actual requirement decides. Consider: API
boundary shape, input validation, output contracts, error handling,
authentication, authorization, idempotency, timeouts, retries, rate
limits, external-integration failure handling, versioning, observability.
A contract at such a boundary follows `contracts.md` — this section covers
the surrounding design judgment, not the contract mechanism itself.

## Data principles

Technology-neutral; database-specific rules belong in a future technology
skill, not here. Consider: data ownership, schema design, validation,
normalization vs. denormalization, consistency guarantees, transactions,
migrations, indexing, caching, serialization, data transformation.

## Testing principles

Decide what to test by what gives real confidence, not by volume:
unit tests, integration tests, contract tests, component tests,
end-to-end tests, property-based testing where the domain warrants it,
test doubles used deliberately (not by default), fixtures, test isolation,
test maintainability.

Explicitly reject: tests written purely to move a coverage number, tests
that duplicate implementation detail instead of behavior, fragile tests
that break on unrelated changes, excessive mocking that tests the mock
instead of the system, and tests of a testing framework's own internals.
See `.agent/instructions/validation.md` for how this relates to the
repository's actual quality gate.

## Security principles

Treated as a **high-priority constraint** where applicable, not a
recommendation: least privilege, explicit trust boundaries, input
validation, output encoding, authentication, authorization, secrets
handling, sensitive-data handling, dependency security, secure defaults,
safe logging (no sensitive data in logs), controlled error exposure
(don't leak internals to callers), injection-risk awareness. No
technology-specific security instruction exists yet — added via a
technology skill once a real technology needs one.

## Performance principles

Measure before optimizing. Avoid _obvious_ architecturally inefficient
choices (an unnecessary network round-trip in a hot path, an unnecessary
full re-render, an unnecessary per-row database query) — this is a design
concern, not premature optimization. Distinguish that from _speculative_
micro-optimization chasing a performance problem that hasn't been observed
or measured. Understand algorithmic complexity where it matters; consider
caching only when a real, demonstrated cost justifies its complexity.

## Observability principles

Proportional to the system boundary and its operational importance — not
every function needs telemetry. Consider structured logging, metrics,
tracing, health checks, audit events, error reporting, and diagnostics at
boundaries that are operationally significant (a deployable's entry
points, external integrations, failure-prone paths), not uniformly
everywhere.

## Technology skill model

Technology-specific guidance is implemented through the existing skill
mechanism (`capability-model.md`, `skills/README.md`), not through new
instruction files per technology and not through this spec growing a
per-technology section. Mechanics (metadata, structure, discovery,
scoping): `.agent/skills/README.md` → "Technology skills."

The separation that matters:

```text
Universal principle (this spec):
  Keep state ownership explicit.

Technology skill:
  How that principle is best realized in this technology/version.
```

A technology skill adapts a universal principle; it never contradicts or
replaces one. Applicability flow:

```text
Task
 ↓ identify technologies actually involved
 ↓ identify relevant engineering domains (this spec's sections above)
 ↓ load applicable technology skill(s), if any exist
 ↓ apply project-specific constraints (architecture.yaml, ADRs, this spec)
 ↓ implement
 ↓ engineering review + validation
```

A technology skill never applies globally — a PostgreSQL skill has no
bearing on a task with no PostgreSQL involvement; a React skill is not a
standing instruction for backend-only work. The objective is _relevant_
context, not maximum context (same principle as progressive disclosure,
`AGENTS.md`).

## Project technology profile

A record of the technologies a project _actually_ uses (languages,
frameworks, libraries, databases, infrastructure, testing tools, build
tools, deployment platforms), used to determine which technology skills
may apply. Lives in `.project/state/PROJECT-STATE.md` → "Technology
profile," updated as real technology is adopted — not pre-populated.
**As of M12, this repository has none**: no `apps/`, `servers/`, `agents/`,
or `packages/` source exists (`architecture.yaml` → `boundaries`). Record
that absence honestly rather than inventing entries.

## Guidance precedence

When guidance conflicts, resolve in this order:

```text
1. Hard safety/security constraints
2. architecture.yaml — explicit structural boundaries, dependency direction
3. Accepted ADRs / active SPECs — explicit project decisions
4. This spec + engineering-standards.md — project-specific engineering standards
5. Technology-specific skill guidance
6. The library/framework's own documented guidance
7. Current authoritative external documentation (when remembered
   technology knowledge may be stale — see below)
8. This spec's general engineering principles, when nothing more specific applies
9. Agent judgment, given all of the above
```

**Project-specific architectural decisions override generic preferences
when they are intentional and valid.** However, technology-specific
guidance may reveal that an existing project decision is obsolete or
incompatible with a technology's current state. An agent must not
_silently_ override the project decision in that case — it surfaces the
conflict and follows the existing decision process
(`.agent/instructions/change-management.md`), the same as any other
architectural disagreement.

## Current/authoritative guidance

Technology knowledge can go stale. For a rapidly changing technology,
prefer `repository-specific rules + current authoritative documentation`
over stale remembered knowledge — consult the technology's real, current
documentation rather than relying purely on training-time familiarity.
Do not copy large amounts of external documentation into the repository;
a technology skill holds concise, durable guidance and references, not a
mirror of vendor docs.

## Exceptions

A valid exception states: the rule being bypassed, the reason, its scope,
the trade-off accepted, and — if it changes an actual architectural
decision — a decision recorded the normal way (`change-management.md`,
possibly an ADR). "Because I wanted to" is never a valid exception. No new
exception-tracking system is created — use the artifacts that already
exist (an inline note at the deviation, or an ADR when the deviation is
itself an architectural decision).

## Anti-pattern handling

Anti-patterns are guidance for recognizing a smell, not a forbidden-word
list. For each, understand _why_ it's usually a problem, what signals it,
what's usually simpler, and when it can still be the right call:

| Anti-pattern            | Usually a problem because...                                                                                    | May be justified when...                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| God object/component    | One unit accumulates unrelated responsibilities, hard to change safely.                                         | Rarely — usually a signal to split by responsibility.                              |
| Premature abstraction   | Guesses at a shape for consumers that don't exist yet, wrong more often than right.                             | A second real consumer already exists and the shape is genuinely stable.           |
| Configuration explosion | A component grows flags/options until its behavior is hard to reason about.                                     | The variance is real and each option is independently meaningful, not speculative. |
| Deep inheritance        | Behavior becomes hard to trace across many levels.                                                              | A genuinely stable, shallow type hierarchy with real shared behavior.              |
| Global mutable state    | Hidden coupling; hard to test, hard to reason about concurrently.                                               | Rare — a narrowly-scoped, well-understood singleton with no real alternative.      |
| Service locator abuse   | Hides real dependencies, breaks explicit-dependency principle.                                                  | Rare — a framework boundary that requires it, isolated at the edge.                |
| Leaky abstraction       | Callers must know an implementation detail the abstraction was meant to hide.                                   | Never a target — always a signal to fix the abstraction's boundary.                |
| Ceremonial layers       | Structure added because it "looks proper," not because a boundary demands it — see "Proportional architecture." | A boundary is genuinely stable/independent and the layer earns its cost.           |

## Agent engineering judgment

The agent reasons, it does not mechanically apply every principle:

```text
Rule → Context → Trade-off → Decision → Implementation → Validation
```

not:

```text
Rule → blind application
```

Prefer the simplest design that satisfies **current and reasonably
foreseeable** requirements. Do not optimize for hypothetical future
requirements unless the architecture explicitly requires it
(`implementation.md` → "No speculative abstractions").

## Engineering review questions

Applied before considering an implementation complete — part of the
existing lifecycle's REVIEW stage (`development-lifecycle.md`), not a
competing lifecycle:

```text
What does this own?
Why does this boundary exist?
Is this abstraction justified?
Could this be simpler?
Is this coupled to something it should not know about?
Is this reusable because it is actually stable?
Is this generalized only because reuse is hypothetical?
Are dependencies explicit?
Is state owned in the right place?
Are failure modes handled?
Is the code testable?
Are security boundaries respected?
Is observability appropriate?
Did a technology-specific best practice apply?
Did any project rule get violated?
```

## Validation and enforcement

Guidance and enforcement are distinct. Where a principle can be checked
mechanically, prefer automation over relying on judgment every time:

```text
Engineering rule → static analysis / validation → quality gate
```

Examples already in force: formatting, linting, type safety
(`.agent/instructions/validation.md`). Examples that may become justified
later, once a concrete need exists: dependency-direction/circular-dependency
checks, security scanning, expanded test coverage, architecture validation
tooling. **No new validation tooling is built in M12** — this section
states the model; building it is a future milestone triggered by a
concrete need, same principle as `packages.md` and `SPEC-007`.

## Relationship to the existing model

- `.agent/` remains authoritative for **how agents operate**
  (`.agent/README.md`); this spec defines **how agents engineer software**
  — complementary, not competing.
- The lifecycle (`development-lifecycle.md`) and development loop
  (`development-loop.md`) are unchanged; the engineering review questions
  above slot into the existing REVIEW stage, they don't add a stage.
- The package model (`SPEC-003`, `packages.md`) is unchanged and not
  reinforced by adding an engineering-specific package
  (`packages/engineering/`, `packages/standards/`, `packages/common/`, or
  similar) — engineering guidance belongs in `.agent/`/`.project/`
  documentation, not in `packages/`.
- The graph model (`SPEC-007`) is unchanged — no new node types
  (`ENGINEERING_STANDARD`, `PATTERN`, `ANTIPATTERN`, `TECHNOLOGY_SKILL`)
  are added; the graph continues to model only real architectural
  entities that exist.
- Contracts remain concepts (`contracts.md`), not affected by this spec.
  Skills remain skills (`capability-model.md`) — a technology skill is an
  ordinary skill, not a new capability layer.

## Explicit non-goals

- A single giant engineering handbook. The model stays modular: small
  universal principles (this spec) + focused domain guidance (its
  sections) + technology-specific skills (created as needed) + current
  authoritative external references — never one document trying to hold
  all of it.
- Static do/don't checklists as technology skills. A skill explains why,
  when, how, trade-offs, and alternatives — not bare directives.
- Absolute engineering rules ("never duplicate code," "always use
  dependency injection," "always write unit tests for everything," and
  equivalents). Every principle above is applied with judgment and
  context, not as an unconditional law.
- Technology skills for technologies not actually used in this
  repository. None exist as of M12; see "Project technology profile."
- New validation/enforcement tooling. See "Validation and enforcement."
- A new ADR. This spec operationalizes judgment within the existing
  architecture; it changes no boundary, dependency direction, or ownership
  decision — same precedent as M06–M11 (`PROJECT-STATE.md`).
- Runtime, orchestration, graph implementation, MCP infrastructure, or any
  application/server/agent/package implementation. Out of scope for this
  spec regardless of milestone.

## Status

`active` — governs engineering design/implementation judgment, and how
technology-specific guidance is introduced via skills, from M12 onward.
