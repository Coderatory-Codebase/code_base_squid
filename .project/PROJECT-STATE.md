# Project State

## Current phase

Foundation baseline implemented.

## Implemented

- Code, control, and agent planes have explicit roots.
- Nested projects are discovered through `project.json` manifests.
- Internal project and task dependency graphs are validated and ordered.
- Project tasks can be planned and executed through the repository CLI.
- Cache-enabled tasks use input and dependency fingerprints and require outputs to exist.
- Correctness checks and risk scans are separate commands.
- Core source dependency boundaries are executable architecture checks.
- CLI checks support machine-readable JSON and meaningful exit codes.
- Control-plane graph, planning, and manifest behavior has automated tests.

## Deferred until justified

- Remote artifact storage and distributed execution.
- A custom external package installer or resolver.
- Framework-specific project templates without a concrete project requirement.
- Empty feature, infrastructure, or project-knowledge folder trees.
