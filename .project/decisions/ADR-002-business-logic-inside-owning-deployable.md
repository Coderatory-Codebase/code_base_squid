---
id: ADR-002
type: adr
title: Business/domain logic lives inside the deployable that owns it
status: accepted
created: 2026-08-29
related: [ADR-001, SPEC-001]
---

# ADR-002: Business Logic Lives Inside the Owning Deployable

## Context

Without an explicit rule, business/domain logic tends to migrate into a
generic root-level bucket (`modules/`, `services/`) shared across
unrelated systems, coupling deployables that should be independent. This
was decided at M01 alongside ADR-001, which it complements.

## Decision

Business/domain functionality belongs inside the specific deployable that
owns it — e.g. `servers/api/domains/users/`, `apps/web/features/*` — not
in a root-level bucket. If functionality becomes genuinely reusable across
independent systems, it is extracted into `packages/` (ADR-001) at that
point, not before.

## Consequences

- `modules/`, `services/`, `business-services/`, `domain-services/` are
  forbidden as top-level directories (enforced in `architecture.yaml`).
- Extracting something into `packages/` requires evidence of actual reuse
  across independent deployables, not anticipated reuse.
- No `servers/`/`apps/`/`agents/` deployables exist yet (as of M04) — this
  ADR governs where their internal domain logic goes once they do.

## Status

Accepted at M01. Still in force.
