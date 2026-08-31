---
id: ADR-010
type: adr
title: Single, repository-native backlog
status: accepted
created: 2026-08-30
related: [SPEC-010, ADR-004, ADR-005]
---

# ADR-010: Single, Repository-Native Backlog

## Context

M15 establishes a durable model for work that's known, discovered, or
deferred but not yet in implementation scope. Two open questions needed a
deliberate answer, not an assumed one:

1. **One backlog, or several** (product/project/agent/feature/technical)?
2. **Where does it live** — repository-native artifacts, or an external
   system (database, project-management tool, dedicated app)?

## Decision

**One backlog.** A single artifact type (`BACKLOG-<NNN>`,
`.project/backlog/`) with a `kind:` field (feature, enhancement, defect,
technical, architectural, investigation, dependency, risk,
discovered-requirement, deferred-decision) distinguishes categories of
work — not separate backlog stores per category or per audience.

**Repository-native.** One markdown file per item, same convention as
`SPEC-*`/`ADR-*`/`PLAN-*`/`REVIEW-*` — no database, API, CLI, or web
application.

## Rationale

- **Multiple backlogs were evaluated against**: clarity, duplication,
  discoverability, agent usability, human usability, lifecycle
  integration, maintenance cost, and future tooling implications (as this
  milestone's brief required). Every one of those criteria favored one
  backlog for this repository's actual current shape: a single
  contributor, no team structure implying separate audiences
  (`product` vs. `engineering` vs. `agent` backlogs exist to serve
  _different people/roles_ — none of which currently exist here as
  distinct parties), and zero backlog items today. Splitting a backlog
  that has zero items into five empty categories is pure ceremony.
- Consistent with `ADR-005` (progressive disclosure) and this
  repository's existing pattern: one singleton for current state
  (`PROJECT-STATE.md`), one typed-and-numbered store per artifact kind
  otherwise (`SPEC-*`, `ADR-*`, ...) — never parallel stores for the same
  kind of thing split by who's looking at it.
- **Repository-native was evaluated against an external tool.** An
  external project-management integration was rejected for the same
  reason M13 rejected installing speculative technology tooling: nothing
  concrete requires it yet, it would add an external dependency and an
  auth/sync surface for zero current backlog items, and it would break
  this repository's core property that every piece of durable knowledge
  is inspectable by opening a file (`ADR-004` → agent-agnostic core;
  `AGENTS.md` → progressive disclosure). A future real need (e.g.
  cross-repository backlog visibility once `apps/`/`servers/`/`agents/`
  are real) can revisit this; it is not assumed now.
- **`kind:` over separate stores** keeps the "different categories of
  work" distinction M15's brief explicitly asked for, without the
  duplication cost of maintaining N directories, N sets of conventions,
  and N places an agent must check to answer "what's known."

## Consequences

- `.project/backlog/` joins the list of defined-but-not-yet-created
  `.project/` subdirectories (`ARTIFACT-TYPES.md`) — created the first
  time a real backlog item exists, not pre-scaffolded.
- If this repository ever grows genuinely distinct audiences for backlog
  visibility (e.g. a product owner who should not see internal technical
  debt items), that's a future decision to revisit this one — filterable
  views over one model (`kind:`, `status:`) are the first thing to try
  before splitting the store itself.
- Agents and humans read the same backlog, at the same location, under
  the same conventions — no agent-specific backlog silently diverging
  from what a human would see (same parity principle `ADR-009`/`SPEC-009`
  already apply to Git enforcement, applied here to work visibility).

## Status

Accepted at M15. Governs `.project/backlog/` and the `BACKLOG-<NNN>`
artifact type.
