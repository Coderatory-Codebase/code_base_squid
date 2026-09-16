# Project State

## Current phase

M03.1 architecture contract reconciled on top of the M03 control plane.

## Implemented

- Code, control, and agent planes have explicit roots.
- Workspace units are discovered directly under the configured physical roots through `project.json` manifests, with no mandatory project namespace.
- `apps/web` and `servers/api` are documented defaults; neither is created without a real runtime requirement, and custom names are supported.
- Internal workspace-unit and task dependency graphs are validated and ordered.
- Workspace-unit tasks can be planned and executed through the repository CLI.
- Changed files map to owning workspace units and propagate through reverse dependencies.
- Affected task plans include only affected work and required task dependencies.
- Local, affected, pull-request, main, and release execution profiles are defined.
- Independent tasks can execute concurrently with dependency failure propagation and structured results.
- Cache-enabled tasks use source, dependency, architecture, and selected environment fingerprints and require outputs to exist.
- Correctness checks and risk scans are separate commands.
- Core source dependency boundaries are executable architecture checks.
- Feature-first server guidance uses optional flat role-named files, with `domain/` introduced only for meaningful domain complexity.
- Domain, service, UI, workspace-unit, and feature boundaries recognize both configured directory segments and flat filename roles.
- Root, agent, project-state, and executable architecture contracts agree on functional composition and progressive growth.
- CLI planning and execution support affected selection, dry runs, JSON, verbose output, and concurrency limits.
- Validation covers architecture configuration, registry, paths, dependencies, task references, cycles, boundaries, and missing workspace-unit manifests where a package definition identifies one.
- GitHub Actions delegates pull-request and main validation to repository-owned execution profiles.
- Control-plane discovery, graph, affected analysis, planning, execution, caching, CLI, configuration, and boundaries have automated tests.

## Deferred until justified

- Remote artifact storage and distributed execution.
- A custom external package installer or resolver.
- Framework-specific project templates without a concrete project requirement.
- Empty feature, infrastructure, or project-knowledge folder trees.
