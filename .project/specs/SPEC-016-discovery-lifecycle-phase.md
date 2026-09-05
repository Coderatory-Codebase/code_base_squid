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
understanding across the relevant business, product, UX, security, QA,
technical, and other applicable lenses. It establishes current state,
identifies gaps and missing capabilities, exposes uncertainties and risks,
and determines what needs to be true before Specification. It does not
specify what to build, decompose work, choose architecture, plan
implementation, or write code.

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
Lens Selection      applicable and excluded lenses with reasons
Lens Findings       findings/evidence/implications/questions by lens
Existing Context    evidence-backed repository/product context
Current State       existing relevant capabilities and behavior
Gap Analysis        desired outcome -> current state -> gap
Needed Capability   reuse/modify/create/remove/integrate/decide/investigate
Facts               evidence-backed claims
Findings            conclusions drawn from evidence
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

Facts, evidence, findings, inferences, assumptions, and unknowns are
distinct. Technical facts about the repository are context, not automatic
design decisions.

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

## Lens Selection

Discovery is broader than uncertainty detection. It must select relevant
lenses dynamically and justify both inclusion and meaningful exclusion.

Core candidate lenses:

- Business / Product
- UX / User Experience
- Security
- QA / Quality
- Technical / Engineering

Additional lenses may be selected when the request makes them relevant:
accessibility, performance, reliability, operations, data, privacy,
compliance, legal, cost, analytics, observability, infrastructure,
maintainability, migration, and integration.

Do not blindly run every lens. Do not skip security, QA, UX, or product
thinking merely because a request sounds technical. The artifact must
record lens, applicability, reason, findings, evidence, implications, and
unresolved questions.

## Gap and Capability Analysis

Discovery must establish the delta:

```text
Desired Outcome
  -> Current State
  -> Gap
  -> Needed Capability
```

Needed capability is classified at the capability level, not as
implementation tasks:

- `reuse`: capability already exists
- `modify`: existing capability needs changing
- `create`: capability does not exist
- `remove`: existing capability conflicts with the desired outcome
- `integrate`: existing capabilities need to work together
- `decide`: product, technical, or business decision required
- `investigate`: evidence is insufficient and more Discovery is needed

This analysis explains what needs to exist or change and why. It must not
turn into final acceptance criteria, schemas, endpoint lists, component
plans, or task breakdowns.

## Synthesis

Discovery must end with a coherent synthesis:

- requested outcome
- current state
- relevant lenses
- evidence-backed findings
- existing capabilities
- missing capabilities
- gaps
- reuse opportunities
- required modifications, integrations, or creations
- risks
- assumptions
- unknowns
- decisions/questions requiring resolution
- readiness implications for Specification

The synthesis answers whether the problem is understood well enough to
specify responsibly.

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
