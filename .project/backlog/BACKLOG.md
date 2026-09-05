---
type: backlog
updated: 2026-09-05
---

# Backlog

Single, repository-native backlog (`ADR-010` — one backlog, not several;
amended at M23 to a single table file rather than one file per item —
see `SPEC-010` → "Persistence"). This file is a singleton, like
`PROJECT-STATE.md` — updated in place, not versioned per item. `id` is
still `BACKLOG-<NNN>`, monotonically increasing, never reused.

M26 adds explicit operating scope (`ADR-016`): every row states whether
it belongs to the repository/foundation brain, a project/product brain,
or both.

| ID          | Scope      | Owner | Level                 | Parent      | Title                                                                                    | Kind          | Status      | Priority | Source (discovered-from) | Dependencies | Notes                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------- | ---------- | ----- | --------------------- | ----------- | ---------------------------------------------------------------------------------------- | ------------- | ----------- | -------- | ------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BACKLOG-001 | PROJECT    | test  | feature               | none        | Email verification for registered accounts                                               | feature       | `captured`  | -        | PLAN-002                 | none         | Needs an email-provider decision (`SPEC-012` escalation) before it can start.                                                                                                                                                                                                                                                                                                                        |
| BACKLOG-002 | PROJECT    | test  | feature               | none        | Password reset flow (incl. account recovery)                                             | feature       | `captured`  | -        | PLAN-002                 | BACKLOG-001  | Same email-provider dependency as `BACKLOG-001`; likely implemented together.                                                                                                                                                                                                                                                                                                                        |
| BACKLOG-003 | PROJECT    | test  | feature               | none        | OAuth / social login                                                                     | feature       | `captured`  | -        | PLAN-002                 | none         | Needs an OAuth-provider decision (`SPEC-012` escalation).                                                                                                                                                                                                                                                                                                                                            |
| BACKLOG-004 | PROJECT    | test  | discovered-issue      | none        | Server-side refresh-token revocation (logout-all-devices, session/device management)     | technical     | `completed` | -        | ADR-012                  | none         | Implemented `TRACE-012`/`ADR-014`: a `Session` collection keyed by a `sid` JWT claim; logout/password-change/manual revocation all reject the session server-side even if the JWT itself is still valid.                                                                                                                                                                                             |
| BACKLOG-005 | PROJECT    | test  | discovered-issue      | none        | Frontend component/E2E test coverage for auth flows                                      | technical     | `captured`  | -        | PLAN-002                 | none         | No frontend test toolchain exists yet (jsdom/testing-library/Playwright). Scope note added `TRACE-014`: the personal-notes feature's `note-list.tsx` (create/edit/delete UI) has the same gap — verified only by a real manual dev-server pass, not an automated frontend test — this item's existing scope already covers it, no new item.                                                          |
| BACKLOG-006 | PROJECT    | test  | discovered-issue      | none        | Rate limiting / brute-force protection on auth endpoints                                 | risk          | `completed` | -        | TRACE-006 (M23 review)   | none         | Implemented `TRACE-007`: `express-rate-limit` on `/register`, `/login` (10/15min), `/refresh` (30/15min). Surfaced `BACKLOG-009` (proxy IP detection) as a real, separate follow-up. Extended in `TRACE-010` to also cover `PATCH /me` (20/15min) — added after this item was first completed, when the profile feature introduced that route; not a new item, this one's scope genuinely covers it. |
| BACKLOG-007 | PROJECT    | test  | discovered-issue      | none        | Security/audit logging for auth events (login, logout, failed attempts, profile changes) | technical     | `captured`  | -        | TRACE-006 (M23 review)   | none         | No structured audit trail exists for authentication events today. Scope note added `TRACE-010`: profile-field changes (e.g. `PATCH /me`) are also account-modification events worth auditing when this is implemented, not only login/logout/failed-attempts.                                                                                                                                        |
| BACKLOG-008 | PROJECT    | test  | feature               | none        | MFA / 2FA / passkeys                                                                     | feature       | `captured`  | -        | TRACE-006 (M23 review)   | none         | Distinct from `BACKLOG-003` (federated/OAuth login) — an additional local factor.                                                                                                                                                                                                                                                                                                                    |
| BACKLOG-009 | PROJECT    | test  | discovered-issue      | none        | Correct client-IP detection for rate limiting behind the Next.js rewrite proxy           | risk          | `captured`  | -        | TRACE-007                | none         | `servers/test/api` sees the Next.js proxy as the client, not the real browser IP, unless `trust proxy` is configured correctly for the actual deployment topology — not yet decided (`infra/` doesn't exist). Blindly trusting `X-Forwarded-For` without knowing the real topology is itself a spoofing risk, so this was deliberately left unset rather than guessed.                               |
| BACKLOG-010 | FOUNDATION | repo  | foundation-capability | none        | Move detailed milestone history out of `architecture.yaml`                               | architectural | `completed` | high     | TRACE-015                | ADR-015      | Completed in `TRACE-016`/`PLAN-006`: detailed milestone history moved to `.project/roadmap/MILESTONES.yaml`; `architecture.yaml` keeps current architecture, active phase, active work, and a history pointer.                                                                                                                                                                                       |
| BACKLOG-011 | FOUNDATION | repo  | foundation-capability | none        | Add operating-layer validators for artifacts, backlog, and architecture drift            | technical     | `captured`  | high     | TRACE-015                | BACKLOG-010  | Add checks for artifact ID/type/location/frontmatter/lifecycle consistency, backlog ID/status/link consistency, project-owned deployable paths, dependency direction, and stale contradictions between `architecture.yaml`, project state, and artifacts.                                                                                                                                            |
| BACKLOG-012 | FOUNDATION | repo  | foundation-capability | none        | Migrate backlog table to explicit multilevel relationships                               | architectural | `completed` | medium   | TRACE-015                | SPEC-014     | Completed in `TRACE-026`: the single backlog table now has explicit `Level` and `Parent` columns, preserving one backlog while separating hierarchy from workflow state.                                                                                                                                                                                                                             |
| BACKLOG-013 | PROJECT    | test  | epic                  | none        | Personal notes management                                                                | feature       | `ready`     | medium   | DECOMP-001               | none         | Product epic created by Phase 4 decomposition of `SPEC-018`; groups the clarified baseline personal-notes feature slices for Architecture without creating a second backlog or a duplicate notes system.                                                                                                                                                                                             |
| BACKLOG-014 | PROJECT    | test  | feature               | BACKLOG-013 | Manage owned personal notes                                                              | feature       | `ready`     | medium   | DECOMP-001               | BACKLOG-015  | Feature produced by `DECOMP-001` from `SPEC-018-R001` and `SPEC-018-R004`: authenticated owners can create, view, edit, and delete durable personal notes. Ready for Architecture; not an implementation task list.                                                                                                                                                                                  |
| BACKLOG-015 | PROJECT    | test  | feature               | BACKLOG-013 | Protect personal note ownership                                                          | feature       | `ready`     | high     | DECOMP-001               | none         | Feature produced by `DECOMP-001` from `SPEC-018-R002` plus the duplicate-system constraint in `SPEC-018-R006`: users must not receive, edit, or delete another user's notes, and downstream work must stay within the existing notes capability. Ready for Architecture.                                                                                                                             |
| BACKLOG-016 | PROJECT    | test  | feature               | BACKLOG-013 | Reach personal notes from the authenticated workspace                                    | feature       | `ready`     | medium   | DECOMP-001               | none         | Feature produced by `DECOMP-001` from `SPEC-018-R003`; `SPEC-018-R005` supplies the quality-baseline constraint. Users can discover and reach notes from the authenticated dashboard/workspace experience. Ready for Architecture.                                                                                                                                                                   |

## Kind values

`feature | enhancement | defect | technical | architectural | investigation | dependency | risk | discovered-requirement | deferred-decision`
(`SPEC-010` → "Backlog item frontmatter").

## Level values

The backlog is still persisted as one table, but M26 begins interpreting
items through a multilevel model:

`outcome | initiative | epic | feature | capability | story | task |
discovered-issue | foundation-capability | standalone`

`Level` is hierarchy/sizing. `Status` is workflow progress. `Parent`
records `none` or another existing `BACKLOG-<NNN>` row. `BACKLOG-012`
completed the table migration without splitting this into multiple
backlogs.

## Scope values

- `FOUNDATION` — repository operating layer, reusable starter/boilerplate,
  agent instructions, workflows, skills, validators, architecture, and
  artifact conventions. Owner is `repo`.
- `PROJECT` — product/project work inside a project boundary such as
  `apps/test/web` or `servers/test/api`. Owner is the project id, such
  as `test`.
- `CROSS_CUTTING` — one item that legitimately changes both. The plan and
  trace must separate the foundation portion from the project portion.

## Status values

`captured → clarifying → ready → selected → in-progress → review → completed`, with `deferred`, `blocked`, `rejected`, `superseded` reachable
from any non-terminal state (`SPEC-010` → "Work states").

## Adding an item

Append a row. Minimum content per `SPEC-010` → "Discovery capture": the
operating scope, owner, what was discovered, why it matters, where it
came from, whether it's required now, and any dependency — the table's
columns hold this directly; use "Notes" for anything that doesn't fit a
column. No per-item file, no separate frontmatter — this table _is_ the
record.
