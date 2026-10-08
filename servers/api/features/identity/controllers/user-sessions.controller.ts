import type { RequestHandler } from "express";
import type { Principal } from "../public.js";
import type { IdentitySessionManager, SessionAudit } from "../sessions.js";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import { createApplicationError } from "../../../errors/index.js";

export type UserSessionsControllerDependencies = Readonly<{
  principalResolver: Readonly<{
    resolve: (cookieHeader: string | undefined) => Promise<
      | Readonly<{ kind: "unauthenticated" }>
      | Readonly<{ kind: "no-active-workspace" }>
      | Readonly<{ kind: "workspace-selection-required" }>
      | Readonly<{ kind: "resolved"; principal: Principal }>
    >;
    invalidateSession: (sessionId: string) => void;
  }>;
  manager: IdentitySessionManager;
  recordSessionAudit?: (event: SessionAudit) => void;
}>;

const rejectPrincipal = (kind: "unauthenticated" | "no-active-workspace" | "workspace-selection-required") => createApplicationError({
  code: kind === "unauthenticated" ? ERROR_CODES.unauthenticated : kind === "no-active-workspace" ? ERROR_CODES.noActiveWorkspace : ERROR_CODES.workspaceSelectionRequired,
  message: kind === "unauthenticated" ? ERROR_MESSAGES.unauthenticated : kind === "no-active-workspace" ? ERROR_MESSAGES.noActiveWorkspace : ERROR_MESSAGES.workspaceSelectionRequired,
  status: kind === "unauthenticated" ? HTTP_STATUS.unauthorized : kind === "no-active-workspace" ? HTTP_STATUS.forbidden : HTTP_STATUS.conflict
});

export const createUserSessionsController = ({
  principalResolver,
  manager,
  recordSessionAudit = () => undefined
}: UserSessionsControllerDependencies): Readonly<{
  list: RequestHandler;
  revoke: RequestHandler;
}> => {
  const list: RequestHandler = async (request, response, next) => {
    try {
      const resolution = await principalResolver.resolve(request.headers.cookie);
      if (resolution.kind !== "resolved") {
        next(rejectPrincipal(resolution.kind));
        return;
      }
      response.status(HTTP_STATUS.ok).json(await manager.list(resolution.principal));
    } catch (error: unknown) {
      next(error);
    }
  };

  const revoke: RequestHandler = async (request, response, next) => {
    try {
      const resolution = await principalResolver.resolve(request.headers.cookie);
      if (resolution.kind !== "resolved") {
        next(rejectPrincipal(resolution.kind));
        return;
      }
      const sessionIdParam = request.params.sessionId;
      const sessionId = typeof sessionIdParam === "string" ? sessionIdParam : "";
      if (!sessionId || !/^[A-Za-z0-9_-]{1,128}$/.test(sessionId)) {
        next(createApplicationError({ code: ERROR_CODES.validation, message: ERROR_MESSAGES.validation, status: HTTP_STATUS.badRequest }));
        return;
      }

      const revoked = await manager.revoke(resolution.principal, sessionId);
      recordSessionAudit({
        event: "identity.session.revoke",
        actorUserId: resolution.principal.userId,
        sessionId,
        outcome: revoked ? "revoked" : "not_found"
      });
      if (!revoked) {
        next(createApplicationError({ code: ERROR_CODES.sessionNotFound, message: ERROR_MESSAGES.sessionNotFound, status: HTTP_STATUS.notFound }));
        return;
      }
      principalResolver.invalidateSession(sessionId);
      response.status(HTTP_STATUS.noContent).end();
    } catch (error: unknown) {
      next(error);
    }
  };

  return Object.freeze({ list, revoke });
};
