---
id: BACKLOG-005
type: backlog
title: Frontend component/E2E test coverage for auth flows
kind: technical
status: captured
created: 2026-08-31
related: [ADR-012, PLAN-002]
relations:
  - type: discovered-from
    target: PLAN-002
---

# BACKLOG-005: Frontend Component/E2E Test Coverage

**What**: component-level tests for the login/register forms and an
end-to-end test (e.g. Playwright) exercising the real browser flow
(register → login → dashboard → logout), beyond `servers/api`'s
API-level `supertest` coverage and the one manual browser pass this
feature's validation performs.

**Why it matters**: this is the repository's first real UI; it currently
has no automated frontend test tooling at all (no jsdom/testing-library/
Playwright dependency exists yet).

**Why deferred**: adding a frontend test toolchain is itself a real,
proportionally-sized decision (which tool, jsdom vs. real browser,
Vitest environment config) that shouldn't be folded silently into this
feature's scope; the manual browser pass required by `validation.md`
(M21) covers this feature's actual acceptance criteria for now.

**Dependency**: none — can be picked up independently.
