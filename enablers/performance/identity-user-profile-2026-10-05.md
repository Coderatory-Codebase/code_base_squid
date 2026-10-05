# Identity user-profile query performance

**Measured:** 2026-10-05 (Asia/Karachi; time not captured)

**Task:** 02.1.01-S1-T5

**Result:** PASS

| Measure | Result |
| --- | --- |
| Environment | Isolated local MongoDB database |
| Seeded profiles | 10,000 |
| Measured gateway queries | 200 |
| Concurrency | 10 |
| Warmup queries | 100 |
| Measured p95 | 85.82 ms |
| Profile-query budget | ≤300 ms |
| Margin under budget | 214.18 ms |
| Winning index | `workspace_user_profile_updated_at` |
| Index confirmed by query plan | Yes |

The run was produced with `pnpm --dir servers/api exec tsx scripts/seed.ts`. The script creates a uniquely named disposable database and drops it after measurement. The recorded result was supplied from the completed local run.

This measures the Identity profile gateway query at the seeded volume. It does not measure full browser page-render latency. The Squid Performance lens describes separate budgets for list, search, and realtime views; it does not state a profile-specific budget. The ≤300 ms value above is the target agreed for this profile-query task.
