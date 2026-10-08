# Story 01.1.01-S1: Task 4 and Task 5 memo

Recorded on 2026-10-07 from the repository history and committed artifacts.

## Task 4 — organization request telemetry and alerting assets

**Implementation: complete.** Commit `7d43d1e2cdba8f64e430c561a4f971a21a7d28ad` adds request telemetry for `/organizations`, including workspace/module, operation, HTTP status, success/error outcome, and duration. The route tests verify an unauthenticated failure emits the signal; a focused signal test verifies its fields. The workspace runbook documents how to use the signal and dashboard.

Evidence:

- `servers/api/features/workspace/observability/organization-signal.ts`
- `servers/api/features/workspace/tests/organization-signal.test.ts`
- `servers/api/features/workspace/tests/organization.route.test.ts`
- `enablers/observability/workspace/organization-dashboard.json`
- `enablers/observability/workspace/organization-alert-policy.json`
- `servers/api/features/workspace/README.md`

**Operational activation: pending.** The dashboard definition is committed but still needs importing into Grafana connected to Loki. The alert policy is explicitly `proposed-awaiting-on-call-ratification`; on-call approval and central log-platform retention configuration are not recorded. Do not describe paging or 30-day retention as active.

## Task 5 — organization list performance budget

**Implementation and recorded measurement: complete.** The committed command `pnpm --filter @workspace/api measure:organization-budget` exercises `GET /organizations` using a disposable in-memory MongoDB, 50 organizations, and 200 loopback HTTP requests. It checks the query plan for `workspaceIds_1`, enforces a p95 budget below 700 ms, and writes a dated result. Its code explicitly avoids connecting to `MONGODB_URI`.

Recorded result in `servers/api/performance-results/organization-list-2026-10-06.json`: p95 **9.31 ms** against a **700 ms** budget; `passed: true`; query plan used `ownerId_1` and `workspaceIds_1`.

Evidence:

- `servers/api/scripts/measure-organization-budget.ts`
- `servers/api/performance-results/organization-list-2026-10-06.json`
- `architecture.yaml` quality attribute and `servers/api/features/workspace/README.md` runbook entry

## Validation scope

The commit adds automated telemetry assertions and includes the measured performance artifact. This memo verifies the committed source and result; it does not claim a fresh local test run or a CI run for commit `7d43d1e`.

## Status summary

| Task | Repository implementation | Acceptance evidence | Remaining |
|---|---|---|---|
| 4 | Complete | Signal implementation/tests and dashboard/alert policy files | Import dashboard; ratify alert thresholds; configure central log retention |
| 5 | Complete | Recorded 50-organization/200-request measurement: 9.31 ms p95, budget passed | No code-side item identified; rerun the documented command when a fresh measurement is needed |
