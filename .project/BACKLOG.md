# Backlog

Items still outstanding:

- [x] Run the branch's pull request through GitHub CI and record dependency guardrail, policy-binding, collection allow-list, and acceptance-test results. [PR #5 validate job passed](https://github.com/Coderatory-Codebase/code_base_squid/actions/runs/37146423798/job/111271208564).
- [x] Execute the acceptance suites in CI; `pnpm run validate` passed in the PR job. The local `tsx` runner limitation remains specific to this environment.
- [ ] Rotate the verified MongoDB credential present in the ignored local `servers/api/.env` at its provider, then rerun managed TruffleHog and record a clean scan. Do not copy the credential into source control or task comments.
- [ ] Configure production alerting for the new asynchronous organization query path; no alert provider is configured in this workspace.
- [x] Confirm the Next.js 16.3.6 dependency is installed, then run Web typecheck and production build. Both checks pass in this workspace.
- [ ] Get approval from at least one other engineer and record the reviewer in the pull request.
- [ ] Perform and record a real browser keyboard walk through sign-in, the organization list/empty/error states, and organization creation.
- [ ] Reconcile the task tracker implementation steps (5/5), gateway test cases (4/4), and Definition of Done evidence with this acceptance review.

- [ ] Task 3 follow-up: perform and record the preview keyboard/screen-reader walk for organization setup and obtain engineer approval. Current revision `2711805f` CI `validate` passed ([run 37320647778](https://github.com/Coderatory-Codebase/code_base_squid/actions/runs/37320647778)). Track upstream remediation for high-severity braces@3.0.3 advisory GHSA-vfj7-8cjw-p6xm; local audit reports it, while CI validation passed.
