import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../constants/index.js";
import { createApplicationError } from "../errors/index.js";
import type { Principal } from "../types/index.js";
import type { MembersService, OrganizationRole, PrincipalResolver } from "../features/workspace/index.js";

declare module "express" {
  interface Request {
    organizationPrincipal?: Principal;
    organizationRole?: "owner" | OrganizationRole;
  }
}

type OrganizationRbacDependencies = Readonly<{
  membersService: MembersService;
  resolvePrincipal: PrincipalResolver;
  allowedRoles: readonly ("owner" | OrganizationRole)[];
}>;

export const createOrganizationRbacMiddleware = ({
  membersService,
  resolvePrincipal,
  allowedRoles
}: OrganizationRbacDependencies): RequestHandler =>
  async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
    try {
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
      const dashboard = await membersService.getDashboard(organizationId, principal);
      if (!allowedRoles.includes(dashboard.viewerRole)) {
        throw createApplicationError({
          code: ERROR_CODES.forbidden,
          message: ERROR_MESSAGES.forbidden,
          status: HTTP_STATUS.forbidden
        }) as Error;
      }
      request.organizationPrincipal = principal;
      request.organizationRole = dashboard.viewerRole;
      next();
    } catch (error) {
      next(error);
    }
  };
