---
id: repository-orientation
type: instruction
applies_to: all-tasks
---

# Repository Orientation

How to get your bearings before touching anything, without re-reading the
whole repository every time.

1. **What is this repo, and what's the philosophy?** → `README.md`.
2. **What's actually allowed to exist where, and what's the current
   milestone?** → `architecture.yaml` — especially `boundaries`,
   `dependency_direction`, `forbidden_top_level_dirs`, and
   `roadmap.current_phase`. Treat this file as the source of truth if it
   ever seems to disagree with prose in `README.md`/`AGENTS.md`.
3. **What's the standing operating rulebook?** → `AGENTS.md`.
4. **What does the actual filesystem look like right now?** Check — don't
   assume the tree matches `architecture.yaml`'s target boundaries or any
   prior conversation. A `status: not-yet-created` boundary may still be
   empty; a milestone marked `complete` should have its listed deliverables
   present.
5. **What's currently happening, and what's already been decided?** →
   `.project/state/PROJECT-STATE.md` — the live status; don't reconstruct
   it by reading every artifact in `.project/`.

Only after this should you pull in a specific instruction, workflow, or
skill from this directory, or a specific artifact from `.project/`, for
the task at hand.
