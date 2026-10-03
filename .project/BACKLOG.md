# Backlog

Items still outstanding:

- [ ] Open or use the branch's pull request to trigger GitHub CI, then record dependency guardrail, policy-binding, and collection allow-list results. Feature-branch pushes alone do not trigger the current workflow.
- [ ] Run the acceptance suites in an environment where the `tsx` runner can start; this workspace currently fails at Node `os.userInfo()` with `ENOMEM` before tests execute.
- [ ] Rotate the verified MongoDB credential present in the ignored local `servers/api/.env` at its provider, then rerun managed TruffleHog and record a clean scan. Do not copy the credential into source control or task comments.
- [ ] Configure production alerting for the new asynchronous organization query path; no alert provider is configured in this workspace.
- [x] Confirm the Next.js 16.3.6 dependency is installed, then run Web typecheck and production build. Both checks pass in this workspace.
- [ ] Get approval from at least one other engineer and record the reviewer in the pull request.
- [ ] Perform and record a real browser keyboard walk through sign-in, the organization list/empty/error states, and organization creation.
- [ ] Reconcile the task tracker implementation steps (5/5), gateway test cases (4/4), and Definition of Done evidence with this acceptance review.
