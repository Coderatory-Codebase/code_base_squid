# CLAUDE.md — Claude Entry Point

This is a small adapter, not the rulebook. Full operating instructions live
in `AGENTS.md` — read them; don't expect a duplicate here.

When working in this repository:

1. **Understand the repository** — read `README.md` and `architecture.yaml`
   before making structural changes. Don't assume prior conversation state
   still matches what's on disk.
2. **Inspect relevant instructions** — read `AGENTS.md` in full; it is
   short by design. Pull in `.agent/instructions/*` for anything more
   specific, `.agent/workflows/*` for the lifecycle of the change you're
   making, and `.agent/skills/*` for a concrete capability the task needs.
3. **Inspect project state** — read `.project/state/PROJECT-STATE.md`
   first; it names the decisions, plans, and work already in flight
   before you propose new ones.
4. **Identify the current task/phase** — `architecture.yaml` →
   `roadmap.current_phase`. Don't implement ahead of the active milestone.
5. **Load only relevant context** — follow the progressive-disclosure chain
   in `AGENTS.md`. Don't read the whole tree for a small change.
6. **Plan before implementation** — for anything non-trivial, state the
   plan before writing files.
7. **Validate changes** — check the change doesn't contradict `README.md`,
   `architecture.yaml`, or `AGENTS.md`; once quality gates exist (M02), run
   them.
8. **Update appropriate artifacts** — record non-trivial architectural
   decisions as ADRs in `.project/decisions/`; keep
   `.project/state/PROJECT-STATE.md` and `architecture.yaml`'s `roadmap`
   current as milestones progress.

Claude-specific behavior (this file) is kept separate from the
agent-agnostic core (`AGENTS.md`, `architecture.yaml`, `.agent/`) so other
agents can operate this repository from the same underlying contracts.
