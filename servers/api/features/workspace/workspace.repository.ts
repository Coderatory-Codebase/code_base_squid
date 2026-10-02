import { isValidObjectId, type ReadableCollection } from "../../integrations/mongodb/index.js";
import type { Principal, OrganizationProfile, OrganizationState } from "./types.js";

// This repository currently owns the scoped query and is intentionally structured
// so the future shared Workspace gateway (01.4.01) can replace it later.

type OrganizationDocument = {
  _id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  status: "ACTIVE" | "ARCHIVED" | "DELETION_SCHEDULED" | "DELETED";
  deletionScheduledFor?: Date;
};

type WorkspaceDocument = {
  _id: string;
  orgId: string;
  status: string;
};

type MembershipDocument = {
  _id: string;
  workspaceId: string;
  userId: string;
  status: "ACTIVE" | "SUSPENDED" | "REMOVED";
};

export type WorkspaceRepositoryDependencies = Readonly<{
  organizations: ReadableCollection<OrganizationDocument>;
  workspaces: ReadableCollection<WorkspaceDocument>;
  memberships: ReadableCollection<MembershipDocument>;
}>;

export type WorkspaceRepository = Readonly<{
  findOrganizationProfile: (principal: Principal, orgId: string) => Promise<OrganizationProfile | null>;
}>;

export const createWorkspaceRepository = ({
  organizations,
  workspaces,
  memberships
}: WorkspaceRepositoryDependencies): WorkspaceRepository => {
  return Object.freeze({
    findOrganizationProfile: async (principal: Principal, orgId: string): Promise<OrganizationProfile | null> => {
      if (!isValidObjectId(orgId)) return null;
      if (!isValidObjectId(principal.userId)) return null;

      const eligibleWorkspaces = await workspaces.find({
        orgId: orgId,
        status: { $ne: "DELETED" }
      });

      if (eligibleWorkspaces.length === 0) return null;

      const workspaceIds = eligibleWorkspaces.map(w => w._id);

      const activeMembership = await memberships.findOne({
        userId: principal.userId,
        workspaceId: { $in: workspaceIds },
        status: "ACTIVE"
      });

      if (!activeMembership) return null;

      const organization = await organizations.findOne({
        _id: orgId,
        status: { $ne: "DELETED" }
      });

      if (!organization) return null;

      let state: OrganizationState;
      if (organization.status === "ACTIVE") {
        state = { kind: "ACTIVE" };
      } else if (organization.status === "ARCHIVED") {
        state = { kind: "ARCHIVED" };
      } else if (organization.status === "DELETION_SCHEDULED" && organization.deletionScheduledFor) {
        state = { kind: "DELETION_SCHEDULED", effectiveOn: organization.deletionScheduledFor };
      } else {
        return null;
      }

      return {
        id: organization._id,
        name: organization.name,
        ownerId: organization.ownerId,
        createdAt: organization.createdAt,
        state
      };
    }
  });
};
