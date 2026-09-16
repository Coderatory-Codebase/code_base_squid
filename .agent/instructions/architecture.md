# Architecture Instructions

Treat the repository as the workspace. Workspace units live directly under configured
roots such as `apps/web`, `servers/api`, `packages/ui`, or a custom name justified by the
system. Never require or invent a shared project-name directory.

Before architecture changes, identify the affected plane and owner, read the narrowest
relevant knowledge chain, and choose the smallest structure that solves the current
problem. Keep application work out of the control plane unless control-plane work is
explicitly authorized.

Organize business behavior by feature. A server feature starts with only the files it
needs. Supported role names are `<feature>.route.ts`, `<feature>.controller.ts`,
`<feature>.service.ts`, `<feature>.repository.ts`, `<feature>.validation.ts`,
`<feature>.model.ts`, and `<feature>.integration.ts`. These files are all optional.
Introduce `domain/` only for meaningful domain behavior, using files such as
`<feature>.entity.ts`, `<feature>.rules.ts`, and `<feature>.policy.ts`.

Preserve dependency direction: delivery and UI call application operations; application
services coordinate domain rules and explicit repository/integration boundaries;
infrastructure implements technical concerns. Domain code must not depend on delivery,
persistence models, infrastructure frameworks, or vendors.
