---
name: architecture
type: workflow
version: 1
when_to_use: >
  Turning Discovery evidence, approved Specification requirements, and a
  ready Decomposition into architectural structure and decisions before
  Implementation Planning or Implementation.
---

# Architecture Workflow

Use this workflow when a `DECOMP-*` artifact is complete, its readiness is
`ready-for-architecture`, and its source Specification remains active and
ready. Architecture answers: "Given discovered technical reality, approved
requirements, and decomposed product Features, what system structure and
architectural decisions should realize the intended outcome?"

Architecture does not start from a blank page. It consumes:

```text
DISCOVERY      what exists / evidence / constraints / technical reality
SPECIFICATION  what must be true
DECOMPOSITION  what product units / Features exist
ARCHITECTURE   how the system should realize those Features
```

The agent performs Architecture directly using existing artifacts, ADRs,
`architecture.yaml`, project memory, backlog rows, and targeted source
inspection where evidence needs confirmation. There is no Architecture
CLI, engine, registry, manager, state machine, role system, job system,
new skill, graph engine, duplicate ADR system, or duplicate backlog.

## Steps

1. Read the source `DECOMP-*` artifact and confirm it is `complete`.
2. Confirm `Decomposition Readiness` is `ready-for-architecture`.
3. Confirm the source `SPEC-*` is `active` and still
   `ready-for-decomposition`.
4. Confirm the decomposition references the required Discovery evidence
   and backlog-managed Feature rows.
5. If any gate fails, stop with Architecture blocked and route the issue
   upstream through the existing clarification/rework path.
6. Read only the relevant Discovery, Specification, Decomposition, backlog
   rows, project memory, ADRs, `architecture.yaml`, and targeted source
   evidence needed to reason about system structure.
7. For each decomposed Feature, decide which architectural boundaries and
   responsibilities realize it. Do not assume one Feature equals one
   component.
8. Distinguish current technical state from target architectural state.
9. Record meaningful architecture decisions with context, evidence,
   options where useful, selected approach, rationale, consequences,
   affected Features, affected boundaries, and unresolved risks.
10. Create one ordinary `ARCH-*` artifact under `.project/architecture/`
    using `.project/ARTIFACT-TYPES.md` and `SPEC-020`.
11. Create ADRs only for decisions that need durable architecture-decision
    status outside the specific Architecture artifact.
12. Update the relevant `TRACE-*`, `.project/state/PROJECT-STATE.md`,
    `architecture.yaml`, and roadmap memory proportionally.
13. Stop before Feature-scoped System Design, Engineering Decomposition,
    Implementation Planning, Implementation, engineering task
    decomposition, Verification, Review, Delivery, or Operate.

## Boundary

Architecture may state:

- "Reuse the existing project-owned web/API architecture."
- "The existing notes domain remains owned by `servers/test/api`."
- "Ownership isolation is an authorization/data-access boundary."
- "No new service, package, or persistence boundary is justified."

Architecture must not state:

- file-by-file change lists;
- coding jobs or developer assignments;
- task IDs for implementation work;
- API implementation checklists;
- database implementation changes;
- UI implementation steps;
- migration tasks;
- test implementation tasks.

Do not modify application source code.

## Validation

Use:

```bash
node --test tooling/tests/architecture.test.mjs
```

The valid exit state is an `ARCH-*` artifact that consumes Discovery,
Specification, Decomposition, and backlog Features; maps every decomposed
Feature to architectural treatment; distinguishes product structure from
technical boundaries; records evidence-backed decisions and open
questions; demonstrates reuse where evidence supports it; and states that
Feature-scoped System Design and later phases have not started.
