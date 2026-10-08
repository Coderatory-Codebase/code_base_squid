import { createHash, randomBytes } from "node:crypto";
import { createApplicationError } from "../../../errors/index.js";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../../constants/index.js";
import type { Principal } from "../../../types/index.js";
import type { OrganizationRole } from "../types.js";
import { createMembersGateway, type MembersGateway, type OrganizationDashboard } from "../db/members.gateway.js";

const invitationLifetimeMs = 7 * 24 * 60 * 60 * 1000;
const hashInvitationToken = (token: string): string => createHash("sha256").update(token).digest("hex");

type WorkspaceFailure = Readonly<{
  code: "forbidden" | "not_found" | "conflict";
  message: string;
  status: 403 | 404 | 409;
}>;

const fail = (code: WorkspaceFailure["code"], message: string, status: WorkspaceFailure["status"]): Error =>
  createApplicationError({ code, message, status });

const isManager = (dashboard: OrganizationDashboard, userId: string): boolean =>
  dashboard.viewerRole === "owner"
  || dashboard.viewerRole === "admin"
  || dashboard.members.some((member) =>
    member.userId === userId && (member.role === "owner" || member.role === "admin")
  );

const requireDashboard = async (
  gateway: MembersGateway,
  organizationId: string,
  principal: Principal
): Promise<OrganizationDashboard> => {
  const dashboard = await gateway.getDashboard(organizationId, principal);
  if (!dashboard) {
    throw fail(ERROR_CODES.notFound, "The organization was not found or is not available to this account.", HTTP_STATUS.notFound);
  }
  return dashboard;
};

const requireManager = (dashboard: OrganizationDashboard, userId: string): void => {
  if (!isManager(dashboard, userId)) {
    throw fail(ERROR_CODES.forbidden, ERROR_MESSAGES.forbidden, HTTP_STATUS.forbidden);
  }
};

const requireActiveOrganization = (dashboard: OrganizationDashboard): void => {
  if (dashboard.lifecycle.status !== "active") {
    throw fail(ERROR_CODES.conflict, `${dashboard.organization.name} is archived and read-only.`, HTTP_STATUS.conflict);
  }
};

export type MembersService = Readonly<{
  getDashboard: (organizationId: string, principal: Principal) => Promise<OrganizationDashboard>;
  inviteMember: (organizationId: string, principal: Principal, email: string, role: OrganizationRole) => Promise<Readonly<{ token: string; expiresAt: Date }>>;
  acceptInvitation: (principal: Principal, token: string) => Promise<Readonly<{ id: string; name: string }>>;
  updateMemberRole: (organizationId: string, principal: Principal, memberId: string, role: OrganizationRole) => Promise<void>;
  removeMember: (organizationId: string, principal: Principal, memberId: string) => Promise<void>;
}>;

export const createMembersService = (gateway: MembersGateway = createMembersGateway()): MembersService => ({
  getDashboard: async (organizationId, principal) => await requireDashboard(gateway, organizationId, principal),

  inviteMember: async (organizationId, principal, email, role) => {
    const dashboard = await requireDashboard(gateway, organizationId, principal);
    requireActiveOrganization(dashboard);
    requireManager(dashboard, principal.userId);
    const normalizedEmail = email.trim().toLowerCase();
    if (principal.email?.trim().toLowerCase() === normalizedEmail) {
      throw fail(ERROR_CODES.conflict, "You already have access to this organization.", HTTP_STATUS.conflict);
    }
    const token = randomBytes(32).toString("base64url");
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + invitationLifetimeMs);
    const saved = await gateway.createInvitation(organizationId, principal, {
      email: normalizedEmail,
      role,
      tokenHash: hashInvitationToken(token),
      expiresAt,
      invitedBy: principal.userId,
      createdAt,
      acceptedAt: null
    });
    if (!saved) {
      throw fail(ERROR_CODES.conflict, "This account is already a member or has a pending invitation.", HTTP_STATUS.conflict);
    }
    return { token, expiresAt };
  },

  acceptInvitation: async (principal, token) => {
    if (!/^[A-Za-z0-9_-]{40,60}$/u.test(token)) {
      throw fail(ERROR_CODES.notFound, "This invitation is invalid or has expired.", HTTP_STATUS.notFound);
    }
    const organization = await gateway.acceptInvitation(principal, hashInvitationToken(token), new Date());
    if (!organization) {
      throw fail(ERROR_CODES.notFound, "This invitation is invalid, expired, already used, or belongs to another email address.", HTTP_STATUS.notFound);
    }
    return organization;
  },

  updateMemberRole: async (organizationId, principal, memberId, role) => {
    const dashboard = await requireDashboard(gateway, organizationId, principal);
    requireActiveOrganization(dashboard);
    requireManager(dashboard, principal.userId);
    if (memberId === dashboard.members.find(({ role: memberRole }) => memberRole === "owner")?.userId) {
      throw fail(ERROR_CODES.forbidden, "The organization owner role cannot be changed.", HTTP_STATUS.forbidden);
    }
    if (!dashboard.members.some(({ userId }) => userId === memberId)) {
      throw fail(ERROR_CODES.notFound, "The organization member was not found.", HTTP_STATUS.notFound);
    }
    const targetLabel = dashboard.members.find(({ userId }) => userId === memberId)?.email ?? memberId;
    if (!await gateway.updateMemberRole(organizationId, principal.userId, principal.email ?? null, memberId, role, new Date(), targetLabel)) {
      throw fail(ERROR_CODES.forbidden, ERROR_MESSAGES.forbidden, HTTP_STATUS.forbidden);
    }
  },

  removeMember: async (organizationId, principal, memberId) => {
    const dashboard = await requireDashboard(gateway, organizationId, principal);
    requireActiveOrganization(dashboard);
    requireManager(dashboard, principal.userId);
    if (memberId === dashboard.members.find(({ role }) => role === "owner")?.userId) {
      throw fail(ERROR_CODES.forbidden, "The organization owner cannot be removed.", HTTP_STATUS.forbidden);
    }
    if (!dashboard.members.some(({ userId }) => userId === memberId)) {
      throw fail(ERROR_CODES.notFound, "The organization member was not found.", HTTP_STATUS.notFound);
    }
    const targetLabel = dashboard.members.find(({ userId }) => userId === memberId)?.email ?? memberId;
    if (!await gateway.removeMember(organizationId, principal.userId, principal.email ?? null, memberId, new Date(), targetLabel)) {
      throw fail(ERROR_CODES.forbidden, ERROR_MESSAGES.forbidden, HTTP_STATUS.forbidden);
    }
  }
});
