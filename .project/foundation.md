# Foundation Lifecycle

The foundation is implemented incrementally.

Current baseline:

- Root ownership boundaries are present.
- Project manifests are defined with `project.json`.
- The control plane can discover projects, build an internal dependency graph, list tasks, and validate core structure.
- Checks and scans are separate command concepts.

The control plane now includes dependency-ordered task execution, conservative local
input fingerprints, architecture boundary validation, machine-readable CLI results,
and focused tests. Future capabilities remain deferred until a concrete project requires
them; likely candidates are affected-project selection, remote artifact storage, and CI
workflow integration through the same CLI.
