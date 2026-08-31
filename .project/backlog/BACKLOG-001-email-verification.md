---
id: BACKLOG-001
type: backlog
title: Email verification for registered accounts
kind: feature
status: captured
created: 2026-08-31
related: [ADR-012, PLAN-002]
relations:
  - type: discovered-from
    target: PLAN-002
---

# BACKLOG-001: Email Verification

**What**: verify a new account's email address (send a verification
link/code, mark the account verified only after confirmation) before it
can be treated as fully trusted.

**Why it matters**: reduces fake/typo'd accounts and is standard
practice for a real authentication system.

**Why deferred**: requires choosing and integrating an email-sending
provider — a real vendor/infrastructure decision (`SPEC-012` →
"Escalation triggers") that shouldn't be bundled into the core
Authentication feature's scope (`ADR-012`, user-scoped to "core only").

**Dependency**: none currently blocking; requires a provider decision
first.
