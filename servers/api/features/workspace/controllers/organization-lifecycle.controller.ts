import type { Request, Response } from "express";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import { createApplicationError } from "../../../errors/index.js";
import type { OrganizationLifecycleAction } from "../domain/organization-lifecycle.js";
import type { OrganizationLifecycleService } from "../services/organization-lifecycle.service.js";
import type { PrincipalResolver } from "./organization.controller.js";

type LifecycleBody = Readonly<{ action: OrganizationLifecycleAction; expectedVersion: number }>;

export const createOrganizationLifecycleController = ({
  service,
  resolvePrincipal
}: Readonly<{ service: OrganizationLifecycleService; resolvePrincipal: PrincipalResolver }>) =>
  async (request: Request, response: Response): Promise<void> => {
    const principal = await resolvePrincipal(request);
    if (!principal) {
      throw createApplicationError({
        code: ERROR_CODES.unauthorized,
        message: ERROR_MESSAGES.unauthorized,
        status: HTTP_STATUS.unauthorized
      }) as Error;
    }
    const organizationId = request.params.organizationId;
    if (typeof organizationId !== "string" || !/^[a-f\d]{24}$/iu.test(organizationId)) {
      throw createApplicationError({
        code: ERROR_CODES.validation,
        message: ERROR_MESSAGES.validation,
        status: HTTP_STATUS.badRequest
      }) as Error;
    }
    const { action, expectedVersion } = request.body as LifecycleBody;
    const result = await service.transition(organizationId, principal, action, expectedVersion);
    if (result.ok) {
      response.status(HTTP_STATUS.ok).json({ lifecycle: result.lifecycle });
      return;
    }
    if (result.code === "conflict") {
      response.status(HTTP_STATUS.conflict).json({
        error: { code: ERROR_CODES.conflict, message: result.message },
        current: result.current
      });
      return;
    }
    const code = result.code === "forbidden"
      ? ERROR_CODES.forbidden
      : result.code === "not_found"
        ? ERROR_CODES.notFound
        : ERROR_CODES.validation;
    const status = result.code === "forbidden"
      ? HTTP_STATUS.forbidden
      : result.code === "not_found"
        ? HTTP_STATUS.notFound
        : HTTP_STATUS.badRequest;
    response.status(status).json({ error: { code, message: result.message } });
  };
