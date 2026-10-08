import { OrganizationModel, type OrganizationActivity, type OrganizationDocument } from "../integrations/organization.model.js";
import type { OrganizationRole } from "../types.js";
import type { Principal } from "../../../types/index.js";
import type {
  OrganizationLifecycle,
  OrganizationLifecycleAction
} from "../domain/organization-lifecycle.js";

type OrganizationQuery<T> = Readonly<{ lean: () => Readonly<{ exec: () => Promise<T> }> }>;
type MembersModelDependency = Readonly<{
  findOne: (filter: Readonly<Record<string, unknown>>) => OrganizationQuery<OrganizationDocument | null>;
  findOneAndUpdate: (
    filter: Readonly<Record<string, unknown>>,
    update: Readonly<Record<string, unknown>>,
    options?: Readonly<Record<string, unknown>>
  ) => OrganizationQuery<OrganizationDocument | null>;
  updateOne: (
    filter: Readonly<Record<string, unknown>>,
    update: Readonly<Record<string, unknown>>
  ) => Readonly<{ exec: () => Promise<Readonly<{ modifiedCount: number }>> }>;
}>;

export type DashboardMember = Readonly<{
  userId: string;
  email: string | null;
  role: "owner" | OrganizationRole;
  joinedAt: Date | null;
}>;

export type OrganizationDashboard = Readonly<{
  organization: Readonly<{ id: string; name: string }>;
  lifecycle: OrganizationLifecycle;
  metrics: Readonly<{ activeTeamMembers: number; linkedWorkspaces: number }>;
  viewerRole: "owner" | OrganizationRole;
  members: readonly DashboardMember[];
  activity: readonly OrganizationActivity[];
}>;

export type InvitationRecord = Readonly<{
  email: string;
  role: OrganizationRole;
  tokenHash: string;
  expiresAt: Date;
  invitedBy: string;
  createdAt: Date;
  acceptedAt: null;
}>;

export type MembersGateway = Readonly<{
  getDashboard: (organizationId: string, principal: Principal) => Promise<OrganizationDashboard | null>;
  getOrganizationLifecycle: (organizationId: string, principal: Principal) => Promise<Readonly<{ ownerId: string; lifecycle: OrganizationLifecycle }> | null>;
  transitionOrganizationLifecycle: (
    organizationId: string,
    ownerId: string,
    expectedVersion: number,
    action: OrganizationLifecycleAction,
    actorId: string,
    now: Date
  ) => Promise<OrganizationLifecycle | null>;
  createInvitation: (organizationId: string, principal: Principal, invitation: InvitationRecord) => Promise<boolean>;
  acceptInvitation: (principal: Principal, tokenHash: string, now: Date) => Promise<Readonly<{ id: string; name: string }> | null>;
  updateMemberRole: (organizationId: string, actorId: string, actorEmail: string | null, memberId: string, role: OrganizationRole, now: Date, targetLabel: string) => Promise<boolean>;
  removeMember: (organizationId: string, actorId: string, actorEmail: string | null, memberId: string, now: Date, targetLabel: string) => Promise<boolean>;
}>;

const managerCondition = (userId: string) => [
  { ownerId: userId },
  { members: { $elemMatch: { userId, role: "admin" } } }
];

const hasOrganizationAccess = (organization: OrganizationDocument, principal: Principal): boolean =>
  organization.ownerId === principal.userId
  || (organization.members ?? []).some(({ userId }) => userId === principal.userId)
  || organization.workspaceIds.some((workspaceId) => principal.workspaceIds.includes(workspaceId));

const toDashboard = (organization: OrganizationDocument, principal: Principal): OrganizationDashboard => {
  const organizationMembers = organization.members ?? [];
  const viewerRole = organization.ownerId === principal.userId
    ? "owner"
    : organizationMembers.find(({ userId }) => userId === principal.userId)?.role ?? "member";
  const members: DashboardMember[] = [
    {
      userId: organization.ownerId,
      email: organization.ownerEmail ?? null,
      role: "owner",
      joinedAt: null
    },
    ...organizationMembers.map(({ userId, email, role, joinedAt }) => ({ userId, email, role, joinedAt }))
  ];
  return {
    organization: { id: String(organization._id), name: organization.name },
    lifecycle: {
      status: organization.deletedAt ? "deleted" : organization.archivedAt ? "archived" : "active",
      version: organization.lifecycleVersion ?? 0,
      archivedAt: organization.archivedAt ?? null,
      archivedBy: organization.archivedBy ?? null,
      deletedAt: organization.deletedAt ?? null
    },
    metrics: {
      activeTeamMembers: members.length,
      linkedWorkspaces: organization.workspaceIds.length
    },
    viewerRole,
    members,
    activity: [...(organization.activity ?? [])].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()).slice(0, 10)
  };
};

const appendActivity = (event: OrganizationActivity) => ({
  $each: [event],
  $slice: -50
});

const model = OrganizationModel as unknown as MembersModelDependency;

export const createMembersGateway = (): MembersGateway => ({
  getDashboard: async (organizationId, principal) => {
    const organization = await model.findOne({ _id: organizationId, deletedAt: null }).lean().exec();
    if (!organization || !hasOrganizationAccess(organization, principal)) return null;
    return toDashboard(organization, principal);
  },

  getOrganizationLifecycle: async (organizationId, principal) => {
    const organization = await model.findOne({ _id: organizationId }).lean().exec();
    if (!organization || !hasOrganizationAccess(organization, principal)) return null;
    return {
      ownerId: organization.ownerId,
      lifecycle: {
        status: organization.deletedAt ? "deleted" : organization.archivedAt ? "archived" : "active",
        version: organization.lifecycleVersion ?? 0,
        archivedAt: organization.archivedAt ?? null,
        archivedBy: organization.archivedBy ?? null,
        deletedAt: organization.deletedAt ?? null
      }
    };
  },

  transitionOrganizationLifecycle: async (organizationId, ownerId, expectedVersion, action, actorId, now) => {
    const versionFilter = expectedVersion === 0
      ? { $or: [{ lifecycleVersion: 0 }, { lifecycleVersion: { $exists: false } }] }
      : { lifecycleVersion: expectedVersion };
    const stateFilter = action === "archive"
      ? { archivedAt: null }
      : { archivedAt: { $ne: null } };
    const update = action === "archive"
      ? {
        $set: { archivedAt: now, archivedBy: actorId },
        $inc: { lifecycleVersion: 1 }
      }
      : action === "restore"
        ? {
          $set: { archivedAt: null, archivedBy: null },
          $inc: { lifecycleVersion: 1 }
        }
        : {
          $set: { deletedAt: now, deletedBy: actorId },
          $inc: { lifecycleVersion: 1 }
        };
    const organization = await model.findOneAndUpdate(
      {
        _id: organizationId,
        ownerId,
        deletedAt: null,
        ...versionFilter,
        ...stateFilter
      },
      update,
      { returnDocument: "after" }
    ).lean().exec();
    if (!organization) return null;
    return {
      status: organization.deletedAt ? "deleted" : organization.archivedAt ? "archived" : "active",
      version: organization.lifecycleVersion ?? expectedVersion + 1,
      archivedAt: organization.archivedAt ?? null,
      archivedBy: organization.archivedBy ?? null,
      deletedAt: organization.deletedAt ?? null
    };
  },

  createInvitation: async (organizationId, principal, invitation) => {
    await model.updateOne(
      {
        _id: organizationId,
        deletedAt: null,
        archivedAt: null,
        $or: managerCondition(principal.userId)
      },
      {
        $pull: {
          invitations: {
            $or: [
              { expiresAt: { $lte: invitation.createdAt } },
              { acceptedAt: { $ne: null } }
            ]
          }
        }
      }
    ).exec();
    const event: OrganizationActivity = {
      actorId: principal.userId,
      actorEmail: principal.email ?? null,
      action: "invitation_sent",
      target: invitation.email,
      createdAt: invitation.createdAt
    };
    const result = await model.updateOne(
      {
        _id: organizationId,
        deletedAt: null,
        archivedAt: null,
        $or: managerCondition(principal.userId),
        ownerEmail: { $ne: invitation.email },
        members: { $not: { $elemMatch: { email: invitation.email } } },
        invitations: {
          $not: {
            $elemMatch: {
              email: invitation.email,
              acceptedAt: null,
              expiresAt: { $gt: invitation.createdAt }
            }
          }
        }
      },
      {
        $push: {
          invitations: invitation,
          activity: appendActivity(event)
        }
      }
    ).exec();
    return result.modifiedCount === 1;
  },

  acceptInvitation: async (principal, tokenHash, now) => {
    const email = principal.email?.trim().toLowerCase();
    if (!email) return null;
    const candidate = await model.findOne({
      deletedAt: null,
      archivedAt: null,
      invitations: {
        $elemMatch: {
          tokenHash,
          email,
          acceptedAt: null,
          expiresAt: { $gt: now }
        }
      }
    }).lean().exec();
    const invitation = candidate?.invitations?.find((entry) =>
      entry.tokenHash === tokenHash
      && entry.email === email
      && entry.acceptedAt === null
      && entry.expiresAt > now
    );
    if (!candidate || !invitation) return null;
    const event: OrganizationActivity = {
      actorId: principal.userId,
      actorEmail: principal.email ?? null,
      action: "invitation_accepted",
      target: email,
      createdAt: now
    };
    const organization = await model.findOneAndUpdate(
      {
        _id: candidate._id,
        deletedAt: null,
        archivedAt: null,
        ownerId: { $ne: principal.userId },
        "members.userId": { $ne: principal.userId },
        invitations: {
          $elemMatch: {
            tokenHash,
            email,
            role: invitation.role,
            acceptedAt: null,
            expiresAt: { $gt: now }
          }
        }
      },
      {
        $set: { "invitations.$.acceptedAt": now },
        $push: {
          members: { userId: principal.userId, email, role: invitation.role, joinedAt: now },
          activity: appendActivity(event)
        }
      },
      { returnDocument: "after" }
    ).lean().exec();
    return organization ? { id: String(organization._id), name: organization.name } : null;
  },

  updateMemberRole: async (organizationId, actorId, actorEmail, memberId, role, now, targetLabel) => {
    const event: OrganizationActivity = {
      actorId,
      actorEmail,
      action: "member_role_changed",
      target: targetLabel,
      createdAt: now
    };
    const result = await model.updateOne(
      {
        _id: organizationId,
        deletedAt: null,
        archivedAt: null,
        ownerId: { $ne: memberId },
        $or: managerCondition(actorId),
        members: { $elemMatch: { userId: memberId } }
      },
      {
        $set: { "members.$.role": role },
        $push: { activity: appendActivity(event) }
      }
    ).exec();
    return result.modifiedCount === 1;
  },

  removeMember: async (organizationId, actorId, actorEmail, memberId, now, targetLabel) => {
    const event: OrganizationActivity = {
      actorId,
      actorEmail,
      action: "member_removed",
      target: targetLabel,
      createdAt: now
    };
    const result = await model.updateOne(
      {
        _id: organizationId,
        deletedAt: null,
        archivedAt: null,
        ownerId: { $ne: memberId },
        $or: managerCondition(actorId),
        members: { $elemMatch: { userId: memberId } }
      },
      {
        $pull: { members: { userId: memberId } },
        $push: { activity: appendActivity(event) }
      }
    ).exec();
    return result.modifiedCount === 1;
  }
});
