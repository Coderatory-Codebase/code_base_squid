import type { Request, Response } from "express";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import { createApplicationError } from "../../../errors/index.js";
import type { PrincipalResolver } from "./organization.controller.js";
import type { OrganizationSettingsUpdater } from "../services/organization-settings.service.js";

type UpdateResponse = Pick<Response, "json" | "status">;

export const createOrganizationSettingsUpdateController = ({
  updater,
  resolvePrincipal
}: Readonly<{
  updater: OrganizationSettingsUpdater;
  resolvePrincipal: PrincipalResolver;
}>) => async (request: Request, response: UpdateResponse): Promise<void> => {
  const principal = await resolvePrincipal(request);
  if (!principal) {
    throw createApplicationError({
      code: ERROR_CODES.unauthorized,
      message: ERROR_MESSAGES.unauthorized,
      status: HTTP_STATUS.unauthorized
    }) as Error;
  }

  const parameter = request.params["organizationId"];
  const organizationId = typeof parameter === "string" ? parameter : undefined;
  if (!organizationId || !/^[a-f\d]{24}$/iu.test(organizationId)) {
    throw createApplicationError({
      code: ERROR_CODES.validation,
      message: ERROR_MESSAGES.validation,
      status: HTTP_STATUS.badRequest
    }) as Error;
  }

  const input = request.body as {
    expectedVersion: number;
    settings: Parameters<OrganizationSettingsUpdater["update"]>[1]["settings"];
  };
  const result = await updater.update(principal, { organizationId, ...input });
  if (result.ok) {
    response.status(HTTP_STATUS.ok).json({ status: "updated", current: result.value });
    return;
  }
  if (result.error.code === "conflict") {
    response.status(HTTP_STATUS.conflict).json({ status: "conflict", current: result.error.current });
    return;
  }
  response.status(HTTP_STATUS.badRequest).json({
    status: "invalid_value",
    field: result.error.field,
    allowedValues: result.error.field === "timeZone"
      ? ["A valid IANA time-zone identifier"]
      : result.error.field === "weekStart"
        ? ["Monday", "Sunday"]
        : result.error.field === "dateFormat"
          ? ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]
          : ["owner only", "any member"]
  });
};
