import { randomUUID } from "node:crypto";
import mongoose, { Schema, model, type ClientSession, type Model, type Types } from "mongoose";
import { createIdentityMongoDependencies } from "../../identity/services/index.js";
import type { WorkspaceBootstrapDependencies } from "../workspace.bootstrap.js";

type OrganizationRecord = Readonly<{
  _id: string;
  ownerId: string;
  name: string;
  version: number;
  status: string;
  workspaceIds: readonly string[];
  settings: Readonly<Record<string, unknown>>;
}>;
type WorkspaceRecord = Readonly<{
  _id: string;
  orgId: string;
  name: string;
  version: number;
  status: string;
  settings: Readonly<Record<string, unknown>>;
  configuration: Readonly<Record<string, unknown>>;
}>;
type MembershipRecord = Readonly<{
  _id: Types.ObjectId;
  workspaceId: string;
  userId: string;
  role: string;
  status: string;
  guest: boolean;
  version: number;
}>;

const schemaOptions = { autoIndex: false, versionKey: false } as const;
const organizationSchema = new Schema<OrganizationRecord>({
  _id: { type: String, default: () => randomUUID() },
  ownerId: { type: String, required: true },
  name: { type: String, required: true },
  version: { type: Number, required: true },
  status: { type: String, required: true },
  workspaceIds: { type: [String], required: true },
  settings: { type: Schema.Types.Mixed, required: true }
}, { ...schemaOptions, collection: "organizations", timestamps: true });

const workspaceSchema = new Schema<WorkspaceRecord>({
  _id: { type: String, default: () => randomUUID() },
  orgId: { type: String, required: true },
  name: { type: String, required: true },
  version: { type: Number, required: true },
  status: { type: String, required: true },
  settings: { type: Schema.Types.Mixed, required: true },
  configuration: { type: Schema.Types.Mixed, required: true }
}, { ...schemaOptions, collection: "workspaces" });

const membershipSchema = new Schema<MembershipRecord>({
  workspaceId: { type: String, required: true },
  userId: { type: String, required: true },
  role: { type: String, required: true },
  status: { type: String, required: true },
  guest: { type: Boolean, required: true },
  version: { type: Number, required: true }
}, { ...schemaOptions, collection: "memberships" });

const organizations = (mongoose.models.WorkspaceBootstrapOrganization as Model<OrganizationRecord> | undefined)
  ?? model<OrganizationRecord>("WorkspaceBootstrapOrganization", organizationSchema, "organizations");
const workspaces = (mongoose.models.WorkspaceBootstrapWorkspace as Model<WorkspaceRecord> | undefined)
  ?? model<WorkspaceRecord>("WorkspaceBootstrapWorkspace", workspaceSchema, "workspaces");
const memberships = (mongoose.models.WorkspaceBootstrapMembership as Model<MembershipRecord> | undefined)
  ?? model<MembershipRecord>("WorkspaceBootstrapMembership", membershipSchema, "memberships");

export type WorkspaceMongoDependencies = WorkspaceBootstrapDependencies<ClientSession>;

export type WorkspaceMongoSession = Readonly<{
  withTransaction: (operation: () => Promise<void>) => Promise<unknown>;
  endSession: () => Promise<unknown>;
}>;

export const createWorkspaceTransaction = <Session extends WorkspaceMongoSession>(
  startSession: () => Promise<Session>
) => async <Result>(operation: (session: Session) => Promise<Result>): Promise<Result> => {
    const session = await startSession();
    let result: Result | undefined;
    try {
      await session.withTransaction(async () => {
        result = await operation(session);
      });
      if (result === undefined) throw new Error("Workspace bootstrap transaction completed without a result.");
      return result;
    } finally {
      await session.endSession();
    }
  };

export const createWorkspaceMongoDependencies = (): WorkspaceMongoDependencies => {
  const identity = createIdentityMongoDependencies();
  return {
    transaction: createWorkspaceTransaction(() => mongoose.startSession()),
    createUser: identity.createUser,
    resolveInvitation: async (token, email, session) => {
      const invitation = await identity.resolveInvitation(token, email, session);
      if (invitation.status !== "valid") return invitation;
      const workspace = await workspaces.findById(invitation.workspaceId).session(session).lean().exec();
      if (!workspace) return { status: "missing" };
      return {
        status: "valid",
        organizationId: workspace.orgId,
        workspaceId: invitation.workspaceId,
        role: invitation.role
      };
    },
    acceptInvitation: async ({ userId, workspaceId, role, idempotencyKey }, session) => {
      await identity.acceptInvitation({ userId, workspaceId, role, idempotencyKey }, session);
      await memberships.updateOne({ workspaceId, userId }, {
        $setOnInsert: { workspaceId, userId, role, status: "ACTIVE", guest: false, version: 1 }
      }, { upsert: true, session }).exec();
    },
    createOrganization: async ({ ownerId, name }, session) => {
      const id = randomUUID();
      const [created] = await organizations.create([{
        _id: id, ownerId, name, version: 1, status: "ACTIVE", workspaceIds: [], settings: {}
      }], { session });
      if (!created) throw new Error("Organization persistence did not return the created organization.");
      return { id: created._id };
    },
    createWorkspace: async ({ organizationId, name }, session) => {
      const workspace = await workspaces.findOneAndUpdate({ orgId: organizationId, name }, {
        $setOnInsert: {
          _id: randomUUID(), orgId: organizationId, name,
          version: 1, status: "ACTIVE", settings: {}, configuration: {}
        }
      }, { upsert: true, new: true, session }).lean().exec();
      await organizations.updateOne({ _id: organizationId }, {
        $addToSet: { workspaceIds: workspace._id }
      }, { session }).exec();
    },
    createOwnerMembership: async ({ userId, organizationId }, session) => {
      const workspace = await workspaces.findOne({ orgId: organizationId, name: "General" }).session(session).lean().exec();
      if (!workspace) throw new Error("General workspace was not created for the organization.");
      await memberships.updateOne({ workspaceId: workspace._id, userId }, {
        $setOnInsert: { workspaceId: workspace._id, userId, role: "Owner", status: "ACTIVE", guest: false, version: 1 }
      }, { upsert: true, session }).exec();
    }
  };
};
