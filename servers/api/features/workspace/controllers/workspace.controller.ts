import type { Request, Response, NextFunction } from "express";
import { HTTP_STATUS, ERROR_CODES, ERROR_MESSAGES } from "../../../constants/index.js";
import { createApplicationError } from "../../../errors/index.js";
import type { WorkspaceService } from "../services/index.js";
import type { Principal } from "../types.js";
import type { ApiOrganizationProfileResponse } from "@workspace/types";

export type WorkspaceControllerDependencies = Readonly<{
  service: Pick<WorkspaceService, "getOrganizationProfile">;
  resolveWorkspacePrincipal: (request: Request) => Principal | null;
}>;

export const createWorkspaceController = ({ service, resolveWorkspacePrincipal }: WorkspaceControllerDependencies) =>
  async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const principal = resolveWorkspacePrincipal(request);
      if (!principal) {
        response.status(HTTP_STATUS.unauthorized).json({
          error: { code: ERROR_CODES.unauthorized, message: ERROR_MESSAGES.unauthorized }
        });
        return;
      }

      const organizationId = request.params.organizationId;
      if (typeof organizationId !== "string" || !organizationId) {
        response.status(HTTP_STATUS.notFound).json({
          error: { code: ERROR_CODES.notFound, message: ERROR_MESSAGES.notFound }
        });
        return;
      }

      const profile = await service.getOrganizationProfile(principal, organizationId);
      if (!profile) {
        // Must return IDENTICAL 404 response for all not-found conditions
        response.status(HTTP_STATUS.notFound).json({
          error: { code: ERROR_CODES.notFound, message: ERROR_MESSAGES.notFound }
        });
        return;
      }

      const apiResponse: ApiOrganizationProfileResponse = {
        id: profile.id,
        name: profile.name,
        ownerId: profile.ownerId,
        createdAt: profile.createdAt.toISOString(),
        state: profile.state.kind === "DELETION_SCHEDULED"
          ? { kind: "DELETION_SCHEDULED", effectiveOn: profile.state.effectiveOn.toISOString() }
          : profile.state
      };

      response.status(HTTP_STATUS.ok).json(apiResponse);
    } catch (error) {
      if (error instanceof Error && error.message === "Database not connected") {
         next(createApplicationError({
           code: ERROR_CODES.serviceUnavailable,
           message: ERROR_MESSAGES.serviceUnavailable,
           status: HTTP_STATUS.serviceUnavailable
         }));
         return;
      }
      next(error);
    }
  };
