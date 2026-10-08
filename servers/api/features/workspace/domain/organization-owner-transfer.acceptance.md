# Organization ownership transfer: Squid acceptance coverage

Story: **01.1.05-S1 — An organization owner hands the organization to a colleague.**

This is a code-to-Squid traceability note. A domain planner is not evidence that the HTTP,
database, authorization, event, or operational acceptance criteria pass.

| Squid criterion | Coverage in this codebase | Status |
| --- | --- | --- |
| AC-1: owner selects an active, non-guest workspace admin; exactly one owner remains; former owner remains a Studio admin; one `OwnershipTransferred` outbox record commits in the same transaction | `organization-owner-transfer.test.ts` checks only the deterministic eligibility/plan. Owner uniqueness, former-owner membership, event contract, and same-transaction outbox need the transfer command, gateway, and transactional outbox. | Partial; integration blocked |
| AC-2: guest, suspended, or non-member recipient is refused with `Invalid`; current owner is unchanged | Unit cases cover guest, suspended, removed, other-organization-only, no membership, active non-admin, and malformed input. Persisted owner preservation needs a mutation boundary. | Partial; persistence check blocked |
| AC-3: non-owner admin receives `Forbidden`; owner is unchanged | No transfer command or shared principal/policy interface is wired. This remains with the policy boundary; the domain planner deliberately does not duplicate authorization. | Blocked by principal/policy dependency |
| AC-4: stale transfer returns `Conflict` and current owner; of two requests from one read version, the second conflicts | Unit case covers an already-stale owner snapshot. Atomic compare-and-set/version check and concurrent integration are not present. | Partial; concurrency check blocked |
| AC-5: outbox failure after owner update rolls back owner and emits no event | No transfer persistence or transactional outbox path exists to exercise. | Blocked by transaction/outbox dependencies |
| AC-6: at 20 transfers/s, 100 workspaces, 10 minutes, p95 is at most 300 ms against quality-003 | No transfer endpoint/transaction exists to load-test. | Blocked by implementation dependency |

## Squid task coverage

| Task | Required evidence | Current state |
| --- | --- | --- |
| T1 — Workspace-scoped gateway | scoped owner query, safe update/CAS, cross-workspace tests, explain/index evidence | Not implemented; requires the shared workspace gateway and transactional write capability. |
| T2 — Ownership view | server-rendered view, gateway read, empty/error/retry states, no client domain import | Not implemented; depends on T1 and a usable principal/policy boundary. |
| T3 — Acceptance checks | checks for each AC, refusal case, red before implementation then green | Planner unit cases exist for recipient eligibility and stale snapshots; AC-3 requires policy-boundary coverage, while AC-1/AC-5/AC-6 require write/outbox/load-test boundaries. The full acceptance suite is absent. Historical red-before-green was not recorded and cannot be claimed retroactively. |
| T4 — Operate signal | boundary signal, dashboard, agreed on-call threshold, failed-run verification | Not implemented; dashboard and on-call agreement are operational dependencies, so no threshold was invented. |
| T5 — Performance budget | target-volume run, p95 result, named index, dated evidence | Not implemented; requires a real transfer flow. Existing S1 profile measurements are a different budget and are not reused. |

The normal `tsx --test` command could not start in this environment because it fails with
`spawn EPERM`. The same focused TypeScript test file was compiled with the project TypeScript
compiler into a temporary directory and executed with Node's test harness: all 11 tests passed.
Typecheck, targeted lint, and `git diff --check` are also recorded separately; unit tests do not
replace the blocked database/concurrency integration checks above.
