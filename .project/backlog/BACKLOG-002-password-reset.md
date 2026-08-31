---
id: BACKLOG-002
type: backlog
title: Password reset flow
kind: feature
status: captured
created: 2026-08-31
related: [ADR-012, PLAN-002]
relations:
  - type: discovered-from
    target: PLAN-002
  - type: depends-on
    target: BACKLOG-001
---

# BACKLOG-002: Password Reset

**What**: a "forgot password" flow — request a reset link/code by email,
verify it, allow setting a new password.

**Why it matters**: users will lock themselves out; this is table-stakes
for a real authentication system.

**Why deferred**: same reason as `BACKLOG-001` — needs an email-sending
provider decision, explicitly out of the core-scope user confirmed for
this feature.

**Dependency**: same email-provider decision as `BACKLOG-001` — likely
implemented together once that's resolved.
