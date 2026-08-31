# CLAUDE.md — Claude Entry Point

This is a small adapter, not the rulebook. Full operating instructions live
in `AGENTS.md` — read it in full; this file doesn't duplicate it, and the
list that used to live here drifted stale for exactly that reason (fixed
at M16 — see `.project/specs/SPEC-011-agent-repository-operating-contract.md`).

**Read, in order**: `AGENTS.md` (the operating rulebook) →
`.agent/instructions/agent-operating-contract.md` (how everything below
connects into one bootstrap sequence — start there if this is a fresh
session with no prior context) → whatever instruction/workflow/skill/
project artifact the task at hand actually needs.

Claude-specific behavior (this file) is kept separate from the
agent-agnostic core (`AGENTS.md`, `architecture.yaml`, `.agent/`) so other
agents can operate this repository from the same underlying contracts —
nothing here should ever need to say something `AGENTS.md` doesn't already
say for any agent.
