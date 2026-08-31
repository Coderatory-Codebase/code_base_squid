---
id: BACKLOG-004
type: backlog
title: Server-side refresh-token revocation (logout-all-devices)
kind: technical
status: captured
created: 2026-08-31
related: [ADR-012, PLAN-002]
relations:
  - type: discovered-from
    target: ADR-012
---

# BACKLOG-004: Refresh-Token Revocation

**What**: a server-side store (e.g. a revocation list or a persisted,
rotatable refresh-token record per session) so a refresh token can be
invalidated before its natural expiry — enabling real "logout everywhere"
and reducing the blast radius of a leaked refresh token.

**Why it matters**: `ADR-012` accepted a real, intentional limitation for
v1 — logout only clears cookies client-side; a stolen refresh token
remains valid until it expires (~7 days).

**Why deferred**: adds real complexity (a persistence/store decision,
rotation bookkeeping) not needed to satisfy this feature's core
acceptance criteria; the risk is accepted and documented, not ignored.

**Dependency**: none — can be implemented independently once prioritized.
