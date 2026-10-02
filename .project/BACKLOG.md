# Backlog

Items deferred because they require external access or a human reviewer:

- [ ] Run the branch through GitHub CI and confirm dependency guardrail, policy-binding, and collection allow-list checks pass there.
- [ ] Rotate the verified MongoDB credential present in the ignored local `servers/api/.env` at its provider, then rerun managed TruffleHog and record a clean scan. Do not copy the credential into source control or task comments.
- [ ] Complete the Next.js 16.3.6 package install, then rerun web typecheck and production build.
- [ ] Get approval from at least one other engineer and record the reviewer in the pull request.
- [ ] Perform and record a real browser keyboard walk through sign-in, the organization list/empty/error states, and organization creation.
- [ ] Reconcile the task tracker implementation steps (5/5), gateway test cases (4/4), and Definition of Done evidence with this acceptance review.
