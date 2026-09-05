---
id: SPEC-016
type: spec
title: Discovery lifecycle phase
status: active
created: 2026-09-05
related: [SPEC-010, SPEC-011, SPEC-013, SPEC-014, SPEC-015, ADR-016]
---

# SPEC-016: Discovery Lifecycle Phase

Operational entry point: `.agent/workflows/discovery.md`.
Behavioral proof: `tooling/tests/discovery.test.mjs`.

## Purpose

Discovery is the second governed lifecycle phase:

```text
REQ-* artifact
  -> DISCOVERY
  -> DISC-* artifact
  -> SPECIFICATION
```

Discovery transforms a captured Intake request into evidence-backed
understanding. It does not specify what to build, decompose work, choose
architecture, plan implementation, or write code.

## Artifact Contract

Discovery produces one `DISC-*` markdown artifact under
`.project/discovery/`. Here, "contract" means responsibilities, inputs,
outputs, boundaries, evidence expectations, and completion conditions. It
is not an executable contract framework, CLI, lifecycle engine, or second
job-contract model.

Required content:

```text
id                  DISC-###
type                discovery
title               non-empty title
status              complete, blocked, or needs-clarification
created             YYYY-MM-DD
Source Requirement  REQ-### reference
Original Request    preserved request text from Intake
Route               FOUNDATION / PROJECT / CROSS_CUTTING
Discovery Jobs      only necessary investigation jobs
Problem             what appears to be solved
Desired Outcome     preserved from Intake
Actors              known actors or unknowns
Existing Context    evidence-backed repository/product context
Facts               evidence-backed claims
Inferences          reasoned conclusions from facts, labeled as such
Assumptions         unvalidated assumptions, if any
Unknowns            information not established
Dependencies        discoverable dependencies
Risks               discoverable risks
Contradictions      conflicting request/context, if any
Open Questions      questions needed before Specification
Evidence            source references for significant findings
Conclusion          readiness and next boundary
Lifecycle State     discovery complete, specification next
Boundary Check      downstream work explicitly not performed
```

Facts, inferences, assumptions, and unknowns are distinct. Technical facts
about the repository are context, not automatic design decisions.

## Discovery Jobs

Discovery jobs are bounded investigation responsibilities selected from
the existing analysis/discovery model (`SPEC-010`, `SPEC-014`, and
`.agent/workflows/app-analysis.md`). They are not task decomposition and do
not create implementation work.

Use only jobs needed for the request:

- **Repository/context investigation**: inspect relevant project memory,
  source files, tests, decisions, and existing behavior.
- **Requirements clarification**: compare the Intake request to what is
  known and identify ambiguities/open questions.
- **Dependency investigation**: identify existing systems, decisions,
  packages, services, or external constraints the future spec must account
  for.
- **Risk/constraint investigation**: identify security, privacy,
  accessibility, reliability, data, ownership, or governance risks that
  evidence makes relevant.

## Boundary

Discovery must not create:

- acceptance criteria that were not established
- final functional requirements
- API contracts
- database schemas
- architecture diagrams
- implementation jobs
- coding plans
- source-code changes

If a possible option is useful to mention, label it as `possible option`,
`open question`, `assumption`, or `requires decision`.

## Failure Handling

Discovery may be `complete`, `blocked`, or `needs-clarification`.

- Use `complete` when enough evidence was gathered to proceed to
  Specification with known unknowns.
- Use `needs-clarification` when a human answer is required before
  Specification can responsibly happen.
- Use `blocked` when required repository/context evidence cannot be
  inspected.

Do not mark Discovery complete if critical investigation could not be
performed.

## Validation

`node --test tooling/tests/discovery.test.mjs` checks the actual Discovery
workflow, current `DISC-*` artifact, source requirement, trace/state
records, evidence references, and boundary expectations. It also covers
vague, technical, contradictory, and insufficient-information cases as
negative behavior tests.

## Status

`active` - governs Discovery from M26 onward. Specification and later
phases are not implemented by this spec.
