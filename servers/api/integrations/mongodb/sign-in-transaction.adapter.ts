import type { Connection, ClientSession } from "mongoose";
import type { UserCreatedV1 } from "@workspace/types";
import { createHash } from "node:crypto";
import type {
  WorkspaceBootstrapTransaction,
  WorkspaceBootstrapTransactionRunner
} from "../../features/workspace/index.js";
import { createIdentityUserModel } from "./identity/user.model.js";
import { createSessionModel } from "./identity/session.model.js";

type UserCreatedOutboxDocument = UserCreatedV1 & Readonly<{ publishedAt: null }>;
type OrganizationInsert = Readonly<{
  _id: string;
  ownerId: string;
  name: string;
  version: number;
  status: "ACTIVE";
  settings: Readonly<Record<string, never>>;
}>;
type WorkspaceInsert = Readonly<{
  _id: string;
  orgId: string;
  version: number;
  status: "ACTIVE";
  name: string;
  settings: Readonly<Record<string, never>>;
  configuration: Readonly<{ defaultRole: "Member" }>;
}>;
type MembershipInsert = Readonly<{
  workspaceId: string;
  userId: string;
  role: "Owner";
  status: "ACTIVE";
  guest: false;
  version: number;
}>;
type InvitationRecord = Readonly<{
  workspaceId: string;
  email: string;
  tokenHash: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  role: string;
  expiresAt: Date;
  deletedAt?: Date;
}>;

const hashInvitationToken = (token: string): string => createHash("sha256").update(token).digest("hex");

export const createMongoSignInTransactionRunner = (
  connection: Connection
): WorkspaceBootstrapTransactionRunner => {
  const users = createIdentityUserModel(connection);
  const sessions = createSessionModel(connection);

  return Object.freeze({
    run: async <T>(operation: (transaction: WorkspaceBootstrapTransaction) => Promise<T>): Promise<T> => {
      const session: ClientSession = await connection.startSession();
      let result: T | undefined;

      try {
        await session.withTransaction(async () => {
          const database = connection.db;
          if (!database) throw new Error("MongoDB connection is not ready.");

          const transaction: WorkspaceBootstrapTransaction = {
            findUserByProviderSubject: async (provider, subject) => {
              const user = await users.findOne({ provider, subject }).session(session).lean().exec();
              if (!user) return null;
              return {
                userId: user.userId,
                email: user.email,
                name: user.name,
                provider: user.provider,
                subject: user.subject,
                status: user.status,
                closedAt: user.closedAt
              };
            },
            insertUser: async (user) => {
              await users.create([user], { session });
            },
            insertSession: async (identitySession) => {
              await sessions.create([identitySession], { session });
            },
            appendUserCreated: async (event: UserCreatedV1) => {
              await database.collection<UserCreatedOutboxDocument>("outbox").insertOne({
                ...event,
                publishedAt: null
              }, { session });
            },
            activeWorkspaceIdsFor: async (userId) => {
              const memberships = await database.collection<MembershipInsert>("memberships")
                .find({ userId, status: "ACTIVE" }, { session, projection: { workspaceId: 1, _id: 0 } })
                .toArray();
              return memberships.map(({ workspaceId }) => workspaceId);
            },
            createOrganization: async ({ organizationId, ownerId, name }) => {
              await database.collection<OrganizationInsert>("organizations").insertOne({
                _id: organizationId,
                ownerId,
                name,
                version: 0,
                status: "ACTIVE",
                settings: {}
              }, { session });
            },
            createWorkspace: async ({ workspaceId, organizationId, name }) => {
              await database.collection<WorkspaceInsert>("workspaces").insertOne({
                _id: workspaceId,
                orgId: organizationId,
                version: 0,
                status: "ACTIVE",
                name,
                settings: {},
                configuration: { defaultRole: "Member" }
              }, { session });
            },
            createOwnerMembership: async ({ workspaceId, userId }) => {
              await database.collection<MembershipInsert>("memberships").insertOne({
                workspaceId,
                userId,
                role: "Owner",
                status: "ACTIVE",
                guest: false,
                version: 0
              }, { session });
            },
            resolveInvitation: async (token, email) => {
              const invitation = await database.collection<InvitationRecord>("user_invitations").findOne({
                tokenHash: hashInvitationToken(token),
                email: email.toLowerCase(),
                status: "pending",
                expiresAt: { $gt: new Date() },
                deletedAt: null
              }, { session });
              return invitation ? { workspaceId: invitation.workspaceId, role: invitation.role } : null;
            },
            acceptInvitation: async ({ token, email, userId, workspaceId, role }) => {
              const invitation = await database.collection<InvitationRecord>("user_invitations").findOneAndUpdate({
                tokenHash: hashInvitationToken(token),
                email: email.toLowerCase(),
                workspaceId,
                role,
                status: "pending",
                expiresAt: { $gt: new Date() },
                deletedAt: null
              }, { $set: { status: "accepted", acceptedAt: new Date() } }, { session, returnDocument: "after" });
              if (!invitation) throw new Error("Invitation acceptance failed.");
              await database.collection<MembershipInsert>("memberships").updateOne(
                { workspaceId, userId },
                { $setOnInsert: { workspaceId, userId, role, status: "ACTIVE", guest: false, version: 0 } },
                { session, upsert: true }
              );
            }
          };

          result = await operation(transaction);
        });

        if (result === undefined) throw new Error("MongoDB sign-in transaction did not produce a result.");
        return result;
      } finally {
        await session.endSession();
      }
    }
  });
};
