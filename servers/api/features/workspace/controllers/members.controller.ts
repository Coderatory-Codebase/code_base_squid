import type { Request, Response } from "express";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import { createApplicationError } from "../../../errors/index.js";
import type { MembersService } from "../services/members.service.js";
import type { PrincipalResolver } from "./organization.controller.js";
import type { OrganizationRole } from "../types.js";
import type { Principal } from "../../../types/index.js";

const requiredPrincipal = async (
  request: Request,
  resolvePrincipal: PrincipalResolver
): Promise<Principal> => {
  if (request.organizationPrincipal) return request.organizationPrincipal;
  const principal = await resolvePrincipal(request);
  if (!principal) {
    throw createApplicationError({
      code: ERROR_CODES.unauthorized,
      message: ERROR_MESSAGES.unauthorized,
      status: HTTP_STATUS.unauthorized
    }) as Error;
  }
  return principal;
};

const organizationId = (request: Request): string => {
  const value = request.params.organizationId;
  if (typeof value !== "string" || !/^[a-f\d]{24}$/iu.test(value)) {
    throw createApplicationError({
      code: ERROR_CODES.validation,
      message: ERROR_MESSAGES.validation,
      status: HTTP_STATUS.badRequest
    }) as Error;
  }
  return value;
};

const memberId = (request: Request): string => {
  const value = request.params.memberId;
  if (typeof value !== "string" || value.length === 0 || value.length > 128) {
    throw createApplicationError({
      code: ERROR_CODES.validation,
      message: ERROR_MESSAGES.validation,
      status: HTTP_STATUS.badRequest
    }) as Error;
  }
  return value;
};

type InvitationRequestBody = Readonly<{ email: string; role: OrganizationRole }>;
type InvitationAcceptanceRequestBody = Readonly<{ token: string }>;
type RoleRequestBody = Readonly<{ role: OrganizationRole }>;

export const createMembersController = ({
  service,
  resolvePrincipal,
  webOrigin
}: Readonly<{ service: MembersService; resolvePrincipal: PrincipalResolver; webOrigin: string }>) => ({
  getDashboard: async (request: Request, response: Response): Promise<void> => {
    const principal = await requiredPrincipal(request, resolvePrincipal);
    response.status(HTTP_STATUS.ok).json(await service.getDashboard(organizationId(request), principal));
  },

  createInvitation: async (request: Request, response: Response): Promise<void> => {
    const principal = await requiredPrincipal(request, resolvePrincipal);
    const { email, role } = request.body as InvitationRequestBody;
    const invitation = await service.inviteMember(organizationId(request), principal, email, role);
    const invitationUrl = new URL("/workspace/invitations/accept", webOrigin);
    invitationUrl.searchParams.set("token", invitation.token);
    response.status(HTTP_STATUS.created).json({
      token: invitation.token,
      expiresAt: invitation.expiresAt,
      url: invitationUrl.toString()
    });
  },

  acceptInvitation: async (request: Request, response: Response): Promise<void> => {
    const principal = await requiredPrincipal(request, resolvePrincipal);
    const { token } = request.body as InvitationAcceptanceRequestBody;
    response.status(HTTP_STATUS.ok).json(await service.acceptInvitation(principal, token));
  },

  updateMemberRole: async (request: Request, response: Response): Promise<void> => {
    const principal = await requiredPrincipal(request, resolvePrincipal);
    const { role } = request.body as RoleRequestBody;
    await service.updateMemberRole(organizationId(request), principal, memberId(request), role);
    response.status(HTTP_STATUS.noContent).end();
  },

  removeMember: async (request: Request, response: Response): Promise<void> => {
    const principal = await requiredPrincipal(request, resolvePrincipal);
    await service.removeMember(organizationId(request), principal, memberId(request));
    response.status(HTTP_STATUS.noContent).end();
  }
});
