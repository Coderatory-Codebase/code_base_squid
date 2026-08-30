---
id: change-management
type: instruction
applies_to: git-and-architectural-decisions
---

# Git / Change Behavior

- **Commit only when asked.** Don't create git commits proactively; the
  user decides when a set of changes becomes a commit.
- **New commits, not amends**, unless explicitly told to amend.
- **Never force-push, hard-reset, or otherwise discard history** without
  explicit instruction — this applies doubly to a foundation repo other
  projects will be scaffolded from.
- **Don't skip hooks or bypass CI-equivalent checks** (`--no-verify` and
  similar) to make a change land faster.
- **Architectural decisions are surfaced, not silent.** A new top-level
  boundary, a new dependency direction, a new piece of tooling, or a
  milestone-phase advance is an architectural decision. Record it as an
  ADR in `.project/decisions/` (see `.project/ARTIFACT-TYPES.md`) — don't
  let a decision's only record be a line changed in `architecture.yaml`
  with no explanation.
- **Milestone status is part of the change.** If a change completes or
  advances a milestone's deliverables, update `architecture.yaml.roadmap`,
  `.project/state/PROJECT-STATE.md`, and `README.md`'s maturity section in
  the same change — don't let those drift from actual repo state.
