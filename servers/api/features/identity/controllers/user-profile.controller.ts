import type { RequestHandler } from "express";
import { performance } from "node:perf_hooks";
import type { UserProfileGateway } from "../shared/repositories/user-profile.gateway.js";
import type { Principal } from "../shared/models/principal.js";
import type { IdentitySignal } from "../shared/models/identity-signal.js";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import { createApplicationError } from "../../../errors/index.js";

export type UserProfileControllerDependencies = Readonly<{
  principalResolver: Readonly<{
    resolve: (cookieHeader: string | undefined) => Promise<
      | Readonly<{ kind: "unauthenticated" }>
      | Readonly<{ kind: "no-active-workspace" }>
      | Readonly<{ kind: "workspace-selection-required" }>
      | Readonly<{ kind: "resolved"; principal: Principal }>
    >;
  }>;
  gateway: Pick<UserProfileGateway, "getUserProfile">;
  recordProfileSignal?: (signal: UserProfileSignal) => void;
}>;

export type UserProfileSignal = Extract<IdentitySignal, { event: "identity.user_profile.gateway_query" }>;

export const createUserProfileController = ({
  principalResolver,
  gateway,
  recordProfileSignal = () => undefined
}: UserProfileControllerDependencies): RequestHandler =>
  async (request, response, next) => {
    try {
      const resolution = await principalResolver.resolve(request.headers.cookie);

      if (resolution.kind === "unauthenticated") {
        next(createApplicationError({
          code: ERROR_CODES.unauthenticated,
          message: ERROR_MESSAGES.unauthenticated,
          status: HTTP_STATUS.unauthorized
        }));
        return;
      }

      if (resolution.kind === "no-active-workspace") {
        next(createApplicationError({
          code: ERROR_CODES.noActiveWorkspace,
          message: ERROR_MESSAGES.noActiveWorkspace,
          status: HTTP_STATUS.forbidden
        }));
        return;
      }

      if (resolution.kind === "workspace-selection-required") {
        next(createApplicationError({
          code: ERROR_CODES.workspaceSelectionRequired,
          message: ERROR_MESSAGES.workspaceSelectionRequired,
          status: HTTP_STATUS.conflict
        }));
        return;
      }

      const queryStartedAt = performance.now();
      let profile: Awaited<ReturnType<typeof gateway.getUserProfile>>;
      try {
        profile = await gateway.getUserProfile(resolution.principal.userId, resolution.principal);
      } catch (error: unknown) {
        recordProfileSignal({
          event: "identity.user_profile.gateway_query",
          module: "identity",
          operation: "user_profile.gateway_query",
          workspaceId: resolution.principal.workspaceId,
          outcome: "error",
          durationMs: performance.now() - queryStartedAt
        });
        throw error;
      }
      recordProfileSignal({
        event: "identity.user_profile.gateway_query",
        module: "identity",
        operation: "user_profile.gateway_query",
        workspaceId: resolution.principal.workspaceId,
        outcome: profile ? "success" : "not_found",
        durationMs: performance.now() - queryStartedAt
      });
      if (!profile) {
        next(createApplicationError({
          code: ERROR_CODES.userProfileNotFound,
          message: ERROR_MESSAGES.userProfileNotFound,
          status: HTTP_STATUS.notFound
        }));
        return;
      }

      response.status(HTTP_STATUS.ok).json(profile);
    } catch (error: unknown) {
      next(error);
    }
  };
