import { Router } from "express";
import { createWorkspaceController } from "../controllers/index.js";
import { createWorkspaceService } from "../services/index.js";
import type { WorkspaceRepository } from "../workspace.repository.js";
import type { Request } from "express";
import type { OrganizationProfilePrincipal } from "../domain/organization-profile.js";
import type { Logger } from "@workspace/logging";

export type WorkspaceRouteDependencies = Readonly<{
  repository: WorkspaceRepository;
  resolveWorkspacePrincipal: (request: Request) => OrganizationProfilePrincipal | null | Promise<OrganizationProfilePrincipal | null>;
  logger: Logger;
}>;

export const createWorkspaceRoutes = (dependencies: WorkspaceRouteDependencies): Router => {
  const router = Router();
  const service = createWorkspaceService({ repository: dependencies.repository });
  const controller = createWorkspaceController({
    service,
    resolveWorkspacePrincipal: dependencies.resolveWorkspacePrincipal,
    logger: dependencies.logger
  });

  router.get("/workspace/organization-profile/:organizationId", controller);
  return router;
};
