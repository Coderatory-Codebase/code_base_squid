---
id: validation
type: instruction
applies_to: before-considering-a-change-done
---

# Testing / Validation Behavior

The repository quality gate (established in M02, extended at M13) is:

```text
pnpm install → pnpm run lint → pnpm run typecheck → pnpm run test →
pnpm run build → pnpm run validate:architecture → pnpm run secrets:scan
```

Run with `pnpm run validate` (chains all six); run `pnpm run format:check`
separately. `validate:architecture` and `secrets:scan` are M13 additions —
see `.agent/instructions/git-governance.md` and
`.project/specs/SPEC-009-repository-structure-git-governance-and-quality-enforcement.md`.
This is also enforced by Git hooks (`commit-msg`, `pre-commit`,
`pre-push`) and CI, not only run by hand — same rules apply either way.

- **A change isn't done until the gate passes.** Run `pnpm run validate`
  and `pnpm run format:check` after any change to config, tooling, or
  source — not just at the end of a large task.
- **Zero tests passing is currently expected**, not a gap to fill.
  `pnpm run test` uses `--passWithNoTests`; add tests when there is actual
  source code to test, not preemptively.
- **A gate failure blocks the change**, it doesn't get worked around.
  Don't silence lint rules, weaken `tsconfig.json` strictness, or skip a
  script to get to green — fix the underlying issue, or explain why the
  gate itself needs to change (that's an architectural decision — see
  `change-management.md`).
- **Structural consistency is part of validation.** After editing any of
  `README.md`, `architecture.yaml`, `AGENTS.md`, `CLAUDE.md`, or anything
  under `.agent/`/`.project/`, check the others don't now contradict it —
  including `.project/state/PROJECT-STATE.md`, which drifts easily if a
  milestone completes and the state file isn't updated in the same change
  (see `repository-orientation.md` for what each file is authoritative
  for).
- Use the [`validate-repository`](../skills/validate-repository/SKILL.md)
  skill as the concrete, discoverable form of this instruction.
- **This is repository validation, not the only verification.** Before
  or alongside it, verify the actual problem was solved with the
  smallest focused check that proves it (one test, a manual check) — see
  `development-loop.md` → "Verification."
