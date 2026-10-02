import type { Request, Response } from "express";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import { createApplicationError } from "../../../errors/index.js";
import type { OrganizationService } from "../services/organization.service.js";
import type { Principal } from "../types.js";

export type PrincipalResolver = (request: Request) => Principal | null | Promise<Principal | null>;

type OrganizationResponse = Pick<Response, "json" | "status">;

export const createOrganizationController = ({
  service,
  resolvePrincipal
}: Readonly<{ service: OrganizationService; resolvePrincipal: PrincipalResolver }>) =>
  async (request: Request, response: OrganizationResponse): Promise<void> => {
    const principal = await resolvePrincipal(request);
    if (!principal) {
      throw createApplicationError({
        code: ERROR_CODES.unauthorized,
        message: ERROR_MESSAGES.unauthorized,
        status: HTTP_STATUS.unauthorized
      }) as Error;
    }
    if (request.method === "POST") {
      const { name } = request.body as { name: string };
      response.status(HTTP_STATUS.created).json(await service.createOrganization(principal, name));
      return;
    }
    response.status(HTTP_STATUS.ok).json(await service.listOrganizations(principal));
  };
