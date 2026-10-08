# Product quality attributes

| Surface | Measure | Target | Evidence |
| --- | --- | --- | --- |
| Organization branding first page | p95 response/render time for a workspace with 50 organizations over 200 opens | ≤ 700 ms | Story 01.1.04-S1 AC4; web measurement is in `01.1.04-S1-T3-acceptance-checks.md`; seeded Mongo list-query measurement is recorded in `01.1.04-S1-T5-budget.md`. |

The Mongo query benchmark reports its own p95 separately from the web page measurement. It uses an isolated temporary collection and drops that collection when the run finishes.
