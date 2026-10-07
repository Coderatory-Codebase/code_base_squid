import type { Connection } from "mongoose";
import { createScopedHandle, type ScopedDocument } from "../../../kernel/index.js";
import type { WorkspaceLanding, WorkspacePort, WorkspaceSummary } from "../../../features/workspace/index.js";
import { createMongoScopedCollection, type DriverCollection } from "../scoped-collection.js";

type OrganizationDocument = Readonly<{
  _id: string;
  ownerId: string;
  name: string;
  version: number;
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
}>;
type WorkspaceDocument = Readonly<{
  _id: string;
  orgId: string;
  version: number;
  status: "ACTIVE";
  name: string;
  settings: Readonly<Record<string, never>>;
  configuration: Readonly<{ defaultRole: "Member" }>;
}>;
type MembershipDocument = Readonly<{
  readonly _id: string;
  readonly workspaceId: string;
  readonly version: number;
  readonly deletedAt: Date | null;
  readonly deletedCause: string | null;
  userId: string;
  role: "Owner";
  status: "ACTIVE";
  guest: false;
}> & ScopedDocument;

const workspaceSummary = (workspace: WorkspaceDocument): WorkspaceSummary => ({
  workspaceId: workspace._id,
  organizationId: workspace.orgId,
  name: workspace.name
});

export const createMongoWorkspaceAdapter = (connection: Connection): WorkspacePort => Object.freeze({
  landingForOwner: async (userId): Promise<WorkspaceLanding | null> => {
    const database = connection.db;
    if (!database) throw new Error("MongoDB connection is not ready.");
    const memberships = database.collection<MembershipDocument>("memberships");
    const active = await memberships.find({ userId, status: "ACTIVE" }).toArray();
    if (active.length === 1) {
      const membership = active[0];
      if (!membership) return null;
      const databaseWorkspace = await database.collection<WorkspaceDocument>("workspaces").findOne({
        _id: membership.workspaceId,
        status: "ACTIVE"
      });
      return databaseWorkspace ? { kind: "ready", workspace: workspaceSummary(databaseWorkspace) } : null;
    }
    if (active.length > 1) return null;
    const organization = await database.collection<OrganizationDocument>("organizations").findOne({
      ownerId: userId,
      status: "ACTIVE"
    });
    if (!organization) return null;
    return { kind: "create-workspace", organizationName: organization.name };
  },

  createForOwner: async ({ userId, workspaceId, name }): Promise<WorkspaceSummary | null> => {
    const session = await connection.startSession();
    let created: WorkspaceSummary | null = null;
    try {
      await session.withTransaction(async () => {
        created = null;
        const database = connection.db;
        if (!database) throw new Error("MongoDB connection is not ready.");
        const organizations = database.collection<OrganizationDocument>("organizations");
        const memberships = database.collection<Record<string, unknown>>("memberships");
        const activeMembership = await memberships.findOne({ userId, status: "ACTIVE" }, { session });
        if (activeMembership) return;
        const organization = await organizations.findOne({ ownerId: userId, status: "ACTIVE" }, { session });
        if (!organization) return;

        // The organization version is the transaction's serialization point for concurrent create attempts.
        const claim = await organizations.updateOne(
          { _id: organization._id, ownerId: userId, status: "ACTIVE", version: organization.version },
          { $inc: { version: 1 } },
          { session }
        );
        if (claim.modifiedCount !== 1) return;

        const workspace: WorkspaceDocument = {
          _id: workspaceId,
          orgId: organization._id,
          version: 0,
          status: "ACTIVE",
          name,
          settings: {},
          configuration: { defaultRole: "Member" }
        };
        const membership: MembershipDocument = {
          _id: `${workspaceId}:${userId}`,
          workspaceId,
          userId,
          role: "Owner",
          status: "ACTIVE",
          guest: false,
          version: 1,
          deletedAt: null,
          deletedCause: null
        };
        await database.collection<WorkspaceDocument>("workspaces").insertOne(workspace, { session });
        const membershipDriver: DriverCollection = {
          find: (filter) => memberships.find(filter, { session }),
          insertOne: async (document) => { await memberships.insertOne(document, { session }); },
          updateOne: (filter, update) => memberships.updateOne(filter, update, { session })
        };
        const membershipHandle = createScopedHandle<MembershipDocument>({
          collection: createMongoScopedCollection<MembershipDocument>(membershipDriver)
        })({ workspaceId });
        await membershipHandle.insert({
          _id: membership._id,
          userId,
          role: membership.role,
          status: membership.status,
          guest: membership.guest
        });
        created = workspaceSummary(workspace);
      });
      return created;
    } finally {
      await session.endSession();
    }
  }
});
