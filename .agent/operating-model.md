# Agent Plane

The agent plane records how development agents should understand and operate this repository.

Agents should use progressive disclosure:

1. Read root instructions.
2. Discover projects.
3. Build the dependency graph.
4. Inspect the affected project only.
5. Run targeted validation.
6. Record durable architectural decisions when they matter.

The agent plane does not replace the control plane. It teaches agents to use it.

## Scope and ownership

Before editing, classify the work as application, package, enabler, project knowledge,
foundation, or control plane. Keep feature behavior with its owning feature. Similarity
alone is not a reason to create a shared package.

Prefer functional modules, immutable values, composition, factories, and explicit
dependency objects. Avoid class-first services, hidden singleton state, service locators,
and dependency-injection containers.

## Completion

Validate location, ownership, dependency direction, behavior, security implications,
tests, and traceability. Control-plane work must also verify discovery, graph and task
behavior, CLI output, exit behavior, and CI compatibility.
