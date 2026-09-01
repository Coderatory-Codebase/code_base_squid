---
type: backlog
updated: 2026-09-01
---

# Backlog

Single, repository-native backlog (`ADR-010` — one backlog, not several;
amended at M23 to a single table file rather than one file per item —
see `SPEC-010` → "Persistence"). This file is a singleton, like
`PROJECT-STATE.md` — updated in place, not versioned per item. `id` is
still `BACKLOG-<NNN>`, monotonically increasing, never reused.

| ID          | Title                                                                                    | Kind      | Status      | Priority | Source (discovered-from) | Dependencies | Notes                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------- | --------- | ----------- | -------- | ------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BACKLOG-001 | Email verification for registered accounts                                               | feature   | `captured`  | —        | PLAN-002                 | none         | Needs an email-provider decision (`SPEC-012` escalation) before it can start.                                                                                                                                                                                                                                                                                                                        |
| BACKLOG-002 | Password reset flow (incl. account recovery)                                             | feature   | `captured`  | —        | PLAN-002                 | BACKLOG-001  | Same email-provider dependency as `BACKLOG-001`; likely implemented together.                                                                                                                                                                                                                                                                                                                        |
| BACKLOG-003 | OAuth / social login                                                                     | feature   | `captured`  | —        | PLAN-002                 | none         | Needs an OAuth-provider decision (`SPEC-012` escalation).                                                                                                                                                                                                                                                                                                                                            |
| BACKLOG-004 | Server-side refresh-token revocation (logout-all-devices, session/device management)     | technical | `captured`  | —        | ADR-012                  | none         | `ADR-012` accepted this as a real, intentional v1 limitation.                                                                                                                                                                                                                                                                                                                                        |
| BACKLOG-005 | Frontend component/E2E test coverage for auth flows                                      | technical | `captured`  | —        | PLAN-002                 | none         | No frontend test toolchain exists yet (jsdom/testing-library/Playwright).                                                                                                                                                                                                                                                                                                                            |
| BACKLOG-006 | Rate limiting / brute-force protection on auth endpoints                                 | risk      | `completed` | —        | TRACE-006 (M23 review)   | none         | Implemented `TRACE-007`: `express-rate-limit` on `/register`, `/login` (10/15min), `/refresh` (30/15min). Surfaced `BACKLOG-009` (proxy IP detection) as a real, separate follow-up. Extended in `TRACE-010` to also cover `PATCH /me` (20/15min) — added after this item was first completed, when the profile feature introduced that route; not a new item, this one's scope genuinely covers it. |
| BACKLOG-007 | Security/audit logging for auth events (login, logout, failed attempts, profile changes) | technical | `captured`  | —        | TRACE-006 (M23 review)   | none         | No structured audit trail exists for authentication events today. Scope note added `TRACE-010`: profile-field changes (e.g. `PATCH /me`) are also account-modification events worth auditing when this is implemented, not only login/logout/failed-attempts.                                                                                                                                        |
| BACKLOG-008 | MFA / 2FA / passkeys                                                                     | feature   | `captured`  | —        | TRACE-006 (M23 review)   | none         | Distinct from `BACKLOG-003` (federated/OAuth login) — an additional local factor.                                                                                                                                                                                                                                                                                                                    |
| BACKLOG-009 | Correct client-IP detection for rate limiting behind the Next.js rewrite proxy           | risk      | `captured`  | —        | TRACE-007                | none         | `servers/test/api` sees the Next.js proxy as the client, not the real browser IP, unless `trust proxy` is configured correctly for the actual deployment topology — not yet decided (`infra/` doesn't exist). Blindly trusting `X-Forwarded-For` without knowing the real topology is itself a spoofing risk, so this was deliberately left unset rather than guessed.                               |

## Kind values

`feature | enhancement | defect | technical | architectural | investigation | dependency | risk | discovered-requirement | deferred-decision`
(`SPEC-010` → "Backlog item frontmatter").

## Status values

`captured → clarifying → ready → selected → in-progress → review → completed`, with `deferred`, `blocked`, `rejected`, `superseded` reachable
from any non-terminal state (`SPEC-010` → "Work states").

## Adding an item

Append a row. Minimum content per `SPEC-010` → "Discovery capture": what
was discovered, why it matters, where it came from, whether it's
required now, and any dependency — the table's columns hold this
directly; use "Notes" for anything that doesn't fit a column. No
per-item file, no separate frontmatter — this table _is_ the record.
