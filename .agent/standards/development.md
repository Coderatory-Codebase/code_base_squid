# Development Standards

Use functional modules by default: pure functions where practical, immutable values,
composition, closures or factories, and explicit dependency objects. Do not require
classes, inheritance, service locators, mutable global registries, or dependency-injection
containers.

Grow architecture progressively. Begin with a feature-owned implementation, introduce a
validation, repository, integration, or domain boundary only when behavior requires it,
and extract to `packages/` only after genuine cross-boundary reuse exists. `prebuilt/`
contains composed reusable solutions, not duplicate package implementations.

Do not create empty capability directories. In particular, role folders such as
`routes/`, `controllers/`, `services/`, and `repositories/` are not the default server
feature model. Keep role-named files beside one another and use `domain/` as the sole
routine subdirectory exception when justified.

Complete work through `UNDERSTAND -> PLAN -> IMPLEMENT -> VALIDATE -> REVIEW -> RECORD
-> COMPLETE`. Run repository-owned checks and update durable architecture records when a
material contract changes.
