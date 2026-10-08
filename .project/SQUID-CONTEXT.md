# Squid Context Brain

## Purpose and source of truth

This is a compact, durable index for agents working in this repository. It is **not**
a replacement for the exported backlog. It records the stable delivery model and the
current work focus so a new agent starts with the right context and reads only the
narrow source records it needs.

Authoritative export set, last supplied 2026-10-03:

- `D:\OneDrive\Desktop\Squid Backlogs\squid-architecture.md`
- `squid-backlog.md`, `squid-backlog-refined.md`, `squid-plan.md`, `squid-sprint-1.md`
- `squid-features.csv`, `squid-requirements.csv`, `squid-stories.csv`, `squid-tasks.csv`,
  `squid-test-cases.csv`, `squid-sprint-1.csv`
- `squid-lenses.md`, `squid-test-plan.md`

The exports are large. Use their CSV identifiers to retrieve a single story/task/case;
do not copy the whole backlog into the repository or infer delivery state from this
summary alone.

## Delivery model

`Initiative → Epic → Feature → Story → Task → Subtask`.

- Stories own acceptance criteria (AC), Definition of Done (DoD), requirements and
  test cases; tasks describe the engineering work needed to satisfy them.
- Each stated verification approach is binding. A static/unit substitute does not
  complete an Integration, Contract, Load, Playwright, or recorded Accessibility-walk
  test case.
- A change begins with a failing check where the task requires red→green evidence.
- Architecture drivers relevant to every new state/command: workspace isolation at the
  data gateway, policy decision for every command, an outbox in the same transaction
  for observable state changes, module-owned collections, and soft-delete exclusion by
  default. Relevant Squid standards: ARC-003, ARC-005, ARC-009 and ARC-011.
- The test plan mandates real MongoDB/transactions (Testcontainers) for Integration and
  policy/contract cases, k6 for load budgets, deployed-preview Playwright journeys, and
  `axe` plus a recorded keyboard/screen-reader walk for accessibility.

## Current sprint focus

Sprint 1 is active. Muhammad Umair owns these Sprint 1 stories:

- `02.1.02-S1` Invite a teammate by email — current implementation focus.
- `02.1.02-S2` Accept and join a workspace.
- `02.1.02-S3` List, revoke and resend invitations.
- `02.1.02-S4` Invalidate used, expired and revoked invitation links.
- `01.2.02-S1` Read workspace time-zone/week-start settings.

Do not start the later stories merely because they depend on this one; use their own
task records when assigned.

## 02.1.02-S1 — current authoritative snapshot

Story: **A workspace admin invites a teammate by email**. Identity module, R1.0,
3 points, State `In progress` in `squid-sprint-1.csv`.

Tracker snapshot: **5 tasks; 0 marked done; 23 steps; 11 marked done; 9 test cases;
0 cases recorded; DoD 0/9.** The state was set manually, so repository evidence takes
precedence when reporting actual implementation coverage.

### Acceptance and test-case inventory

| Criterion | Required method | Case |
| --- | --- | --- |
| AC-1: one PENDING invitation, kernel-clock seven-day expiry, link shown once | Integration | `TC-02.1.02-S1-1` |
| AC-2: SHA-256 token hash only; raw token absent from document, outbox and logs | Integration | `TC-02.1.02-S1-2` |
| AC-3: re-inviting leaves one PENDING invitation and invalidates the first link | Integration | `TC-02.1.02-S1-3` |
| AC-4: member is forbidden; no write; refusal audited | Contract | `TC-02.1.02-S1-4` |
| AC-5: invalid email writes nothing and field reports invalid address | Integration | `TC-02.1.02-S1-5` |
| AC-6: 20 invitations/s for 10 min, command p95 <300 ms | Load | `TC-02.1.02-S1-6` |
| state owner, covering index, retention | Integration | `TC-02.1.02-S1-X-data` |
| keyboard operation + assistive announcement | recorded accessibility walk | `TC-02.1.02-S1-X-accessibility` |
| measured target-volume budget | Load & budget | `TC-02.1.02-S1-X-performance` |

### Task evidence and next work

| Task | Codebase evidence | Status against exported DoD |
| --- | --- | --- |
| T1 — scoped gateway query | Gateway appends `workspaceId` and `deletedAt: null` last; model has scoped list indexes; pending replacements update the existing invitation. | Partial: no real-Mongo cross-tenant test, explain-plan proof, or confirmed collection allow-list/migration evidence. |
| T2 — Server Component view | Invitation page plus loading/empty/error components exist; server-only fetch boundary has no client fetch/domain import. | Partial: API list route and empty-state action are now composed with a policy-bound scoped query; no multi-workspace selector or real Mongo-backed server render yet. |
| T3 — AC automation | Existing fake-gateway service tests are named AC1–AC6; markup test checks live region/retry link. | Not complete: required test methods and red→green proof are absent. See `02.1.02-S1-T3.md`. |
| T4 — telemetry | Feature-owned structured success/refusal signal and supporting unit tests exist. | Partial: no HTTP composition, dashboard, threshold, or dashboard evidence. |
| T5 — view budget | Official load placeholders record missing Docker/k6/route prerequisites. | Blocked: no seeded 200-request measurement or dated serving-index evidence. |

### Critical implementation mismatch to resolve before verification

`REQ-02.1.02-1` and AC-3 require a repeat invitation to replace the pending invitation
and invalidate the old link while retaining exactly one pending invitation. The current
service instead throws `duplicate-invitation`. This is not AC-3 compliant and must be
resolved through the intended transactional persistence design, not by weakening the
criterion.

## Agent operating protocol

1. Read this file, then retrieve only the matching source rows by Story/Task/Case ID.
2. Create or update a task-specific `.project/<task-id>.md` before changing code.
3. Translate every AC and lens case into its exact required test environment; record
   what is automated versus the required human/preview evidence.
4. Never mark a story/task done merely because a similarly named unit test passes.
5. Update the task record with commands, measurements, and remaining release evidence.
