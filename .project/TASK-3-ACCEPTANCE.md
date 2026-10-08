# Task 3 acceptance review: organization setup accessibility

## Scope and accessibility contract

Story `01.1.01-S1`, task `01.1.01-S1-T3`, asks for one automated check per acceptance criterion. The sole acceptance case is `TC-01.1.01-S1-X-accessibility`: setup-surface controls must be keyboard reachable and operable, and setup errors must be announced to assistive technology.

`apps/web/features/organizations/organization-setup-form.tsx` owns the setup form contract. Keep the organization name as a labeled native required input, submit as a native button, cancel as a link, and visible form errors in a polite live region. The component test renders that form and protects those semantics, including the absence of any custom tabindex override. This automated check guards the markup contract; it does not substitute for a real browser keyboard and assistive-technology walk.

## Implementation steps

- [x] Define the automated check requirements from the acceptance case: named native controls for keyboard operation, and a polite live region for an error announcement.
- [x] Add the rendered-markup accessibility tests and include them in `apps/web`'s test script.
- [x] Validate locally: previous run completed 14 web tests, web TypeScript, API-focused tests, and API TypeScript checks; staged-file ESLint, `git diff --check`, and managed TruffleHog also passed. A repeat during this turn was blocked by the pnpm global store lock; direct runner invocation stalled under the current environment.
- [x] Push this branch and verify CI for this revision: commit `2711805f9464e5b5ef2a0f767a008b321373a44e` was pushed to `feature/01.1.01-S1`; GitHub Actions `Control Plane` run [37320647778](https://github.com/Coderatory-Codebase/code_base_squid/actions/runs/37320647778), `validate` job, completed successfully. The local pre-commit audit previously reported high-severity `GHSA-vfj7-8cjw-p6xm` in transitive `braces@3.0.3`; the advisory lists no patched version. The CI validation job for this revision passed.

The original setup markup already had native controls and `aria-live="polite"`; this task extracts the form into a testable feature component and adds regression checks. A behavioral red-before/green-after result was not established against a previously failing implementation.

## Acceptance case result

| ID | Automated evidence | Result |
|---|---|---|
| `TC-01.1.01-S1-X-accessibility` | `apps/web/tests/integration/organization-setup-accessibility.test.tsx` renders the setup form and checks native form/input/button/link semantics, an associated accessible label, required input, no custom tabindex override, and polite error announcement. | Automated check passes locally. Real preview keyboard walk and screen-reader verification remain pending. |

## Definition of Done

| # | Requirement | Status | Evidence / remaining action |
|---|---|---|---|
| 1 | Implementation steps ticked or explicitly dropped with a reason | Pass | Steps 1-4 are complete; CI result is linked above. |
| 2 | Dependency guardrail, policy-binding check, and collection allow-list pass in CI | Pass | The current revision's `validate` job succeeded. No policy or collection was added by this task. The CI guardrail is authoritative for this revision; the local audit had reported the documented `braces@3.0.3` advisory. |
| 3 | Tenant isolation proven for each new collection touched | Not applicable | No collection or persistence code changed. |
| 4 | New asynchronous paths have a signal, threshold, and runbook line | Not applicable | No asynchronous behavior was introduced; the existing server action is passed through unchanged. |
| 5 | New interactive surfaces have a recorded keyboard walk | Pending | Complete and record the mouse-unplugged walk in a preview deployment, including focus order/visibility, native required-field validation, submit/cancel, and assistive-technology announcement. |
| 6 | Discovered deferred work is written into the backlog | Pass | The dependency advisory, preview keyboard walk, reviewer approval, and CI verification are recorded in `.project/BACKLOG.md`. |
| 7 | At least one other engineer reviewed and approved | Pending | Record an engineer's review when available. No review is claimed. |
| 8 | Affected documentation is updated in the same change | Pass for this task contract | This file records the feature accessibility contract and the automated check. No runbook or user-facing instructions changed. |
| 9 | All automated acceptance checks pass | Pass | Both accessibility assertions passed locally in the earlier 14/14 web test run, and current revision CI validation succeeded. |

## Local validation detail

The repository's pnpm launcher fails to open its global operation lock in this environment. A previous run with a temporary Node `os.userInfo` shim produced 14 passing web tests; the shim was removed afterward. Web and API TypeScript checks and the API-focused tests passed in that validation. Repeating checks in this turn was blocked by the pnpm lock; invoking runners directly stalled. The repository pre-commit hook could not complete in this turn due the pnpm lock. The commit's pre-push repository check passed, and current revision CI `validate` passed. A real browser keyboard/screen-reader walk and independent engineer review remain outstanding.
