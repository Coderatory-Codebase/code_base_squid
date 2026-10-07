import type { RequestHandler } from "express";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import { createApplicationError } from "../../../errors/index.js";
import type { ApplicationError } from "../../../errors/index.js";
import type { WorkspaceService } from "../workspace.js";

export type WorkspaceControllerDependencies = Readonly<{
  resolveSession: (cookieHeader: string | undefined) => Promise<Readonly<{ userId: string }> | null>;
  service: WorkspaceService;
}>;

const reject = (code: ApplicationError["code"], message: string, status: ApplicationError["status"]) => createApplicationError({ code, message, status });

export const createWorkspaceController = ({ resolveSession, service }: WorkspaceControllerDependencies) => {
  const landing: RequestHandler = async (request, response, next) => {
    try {
      const session = await resolveSession(request.headers.cookie);
      if (!session) {
        next(reject(ERROR_CODES.unauthenticated, ERROR_MESSAGES.unauthenticated, HTTP_STATUS.unauthorized));
        return;
      }
      const result = await service.landing(session.userId);
      if (!result) {
        next(reject(ERROR_CODES.forbidden, ERROR_MESSAGES.forbidden, HTTP_STATUS.forbidden));
        return;
      }
      response.status(HTTP_STATUS.ok).json(result);
    } catch (error: unknown) {
      next(error);
    }
  };

  const create: RequestHandler = async (request, response, next) => {
    try {
      const session = await resolveSession(request.headers.cookie);
      if (!session) {
        next(reject(ERROR_CODES.unauthenticated, ERROR_MESSAGES.unauthenticated, HTTP_STATUS.unauthorized));
        return;
      }
      const body: unknown = request.body;
      const name = typeof body === "object" && body !== null && "name" in body
        ? body.name
        : undefined;
      if (typeof name !== "string") {
        next(reject(ERROR_CODES.validation, ERROR_MESSAGES.validation, HTTP_STATUS.badRequest));
        return;
      }
      const result = await service.create(session.userId, name);
      if (!result.ok) {
        const invalidName = result.kind === "invalid-name";
        next(reject(
          invalidName ? ERROR_CODES.validation : ERROR_CODES.forbidden,
          invalidName ? "Workspace name must contain between 1 and 80 characters." : ERROR_MESSAGES.forbidden,
          invalidName ? HTTP_STATUS.badRequest : HTTP_STATUS.forbidden
        ));
        return;
      }
      response.status(HTTP_STATUS.created).json({ kind: "ready", workspace: result.workspace });
    } catch (error: unknown) {
      next(error);
    }
  };

  return Object.freeze({ landing, create });
};
