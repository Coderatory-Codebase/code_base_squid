---
id: PLAN-011
type: plan
title: Discovery correction
status: complete
created: 2026-09-05
related: [SPEC-016, DISC-001, TRACE-022]
---

# PLAN-011: Discovery Correction

## Objective

Correct the already-implemented Discovery phase so it is broader than
unknown/open-question capture.

## Scope

- Inspect the existing Discovery implementation before changing it.
- Preserve useful Phase 2 work.
- Add explicit lens selection and lens findings to Discovery.
- Add desired-outcome/current-state/gap/needed-capability analysis.
- Strengthen `DISC-001` using real repository evidence.
- Expand behavioral tests for multi-lens Discovery, security-sensitive
  requests, UI requests, gap analysis, and phase boundaries.
- Update state, architecture, roadmap, and traceability.

## Out of Scope

- Specification / Phase 3.
- Decomposition, Architecture, Implementation, Verification, Review,
  Delivery, Operate, or Feedback.
- Discovery CLI/framework/engine/registry.
- Application source changes.

## Outcome

Completed in `TRACE-022`.
