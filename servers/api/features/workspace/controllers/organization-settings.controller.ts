import type { Request, Response } from "express";
import type { Logger } from "@workspace/logging";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import { createApplicationError } from "../../../errors/index.js";
import { settingsOf, type OrganizationSettings } from "../db/organization-setting.gateway.js";
import type { Principal } from "../types.js";
import type { PrincipalResolver } from "./organization.controller.js";

export type OrganizationSettingsReader = (
  principal: Principal,
  logger: Logger
) => Promise<readonly OrganizationSettings[]>;

export const createOrganizationSettingsController = ({
  resolvePrincipal,
  logger,
  readSettings = settingsOf
}: Readonly<{
  resolvePrincipal: PrincipalResolver;
  logger: Logger;
  readSettings?: OrganizationSettingsReader;
}>) => async (request: Request, response: Response): Promise<void> => {
  const principal = await resolvePrincipal(request);
  if (!principal) {
    throw createApplicationError({
      code: ERROR_CODES.unauthorized,
      message: ERROR_MESSAGES.unauthorized,
      status: HTTP_STATUS.unauthorized
    }) as Error;
  }

  response.status(HTTP_STATUS.ok).json({ settings: await readSettings(principal, logger) });
};
