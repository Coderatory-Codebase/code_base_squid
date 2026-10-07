import type { RequestHandler } from "express";
import { z } from "zod";
import type { UserProfileControllerDependencies } from "./user-profile.controller.js";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import { createApplicationError } from "../../../errors/index.js";

const UpdateSchema = z.object({ name: z.string().trim().min(1).max(80), version: z.number().int().nonnegative() }).strict();

export const createUpdateUserProfileController = ({ principalResolver, gateway }: UserProfileControllerDependencies): RequestHandler =>
  async (request, response, next) => {
    try {
      const resolution = await principalResolver.resolve(request.headers.cookie);
      if (resolution.kind !== "resolved") {
        const workspaceConflict = resolution.kind === "workspace-selection-required";
        next(createApplicationError({
          code: workspaceConflict ? ERROR_CODES.workspaceSelectionRequired : resolution.kind === "no-active-workspace" ? ERROR_CODES.noActiveWorkspace : ERROR_CODES.unauthenticated,
          message: workspaceConflict ? ERROR_MESSAGES.workspaceSelectionRequired : resolution.kind === "no-active-workspace" ? ERROR_MESSAGES.noActiveWorkspace : ERROR_MESSAGES.unauthenticated,
          status: workspaceConflict ? HTTP_STATUS.conflict : resolution.kind === "no-active-workspace" ? HTTP_STATUS.forbidden : HTTP_STATUS.unauthorized
        }));
        return;
      }
      const input = UpdateSchema.parse(request.body);
      const result = gateway.updateUserProfile
        ? await gateway.updateUserProfile(resolution.principal.userId, resolution.principal, input.name, input.version)
        : { kind: "not-found" as const };
      if (result.kind === "not-found") {
        next(createApplicationError({ code: ERROR_CODES.profileUpdateForbidden, message: ERROR_MESSAGES.profileUpdateForbidden, status: HTTP_STATUS.forbidden }));
        return;
      }
      if (result.kind === "conflict") {
        next(createApplicationError({
          code: ERROR_CODES.conflict,
          message: ERROR_MESSAGES.conflict,
          status: HTTP_STATUS.conflict,
          ...(result.currentProfile ? { details: { currentProfile: result.currentProfile } } : {})
        }));
        return;
      }
      response.status(HTTP_STATUS.ok).json(result.profile);
    } catch (error: unknown) {
      next(error);
    }
  };
