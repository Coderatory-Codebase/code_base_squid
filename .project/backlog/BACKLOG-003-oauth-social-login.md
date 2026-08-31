---
id: BACKLOG-003
type: backlog
title: OAuth / social login
kind: feature
status: captured
created: 2026-08-31
related: [ADR-012, PLAN-002]
relations:
  - type: discovered-from
    target: PLAN-002
---

# BACKLOG-003: OAuth / Social Login

**What**: allow signing in via a third-party identity provider (e.g.
Google/GitHub) instead of, or alongside, email+password.

**Why it matters**: common expectation for a modern auth system, lowers
signup friction.

**Why deferred**: requires selecting and registering with a specific
OAuth provider — a real vendor decision (`SPEC-012` → "Escalation
triggers") out of this feature's user-confirmed core scope.

**Dependency**: none blocking; requires a provider decision first.
