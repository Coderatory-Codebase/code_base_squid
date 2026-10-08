import { createHash, randomUUID } from "node:crypto";
import mongoose, { Schema, model, type ClientSession, type Model, type Types } from "mongoose";
import type { IdentityBootstrapDependencies } from "../identity.bootstrap.js";
import { systemClock } from "@workspace/kernel";
import type { Clock } from "@workspace/kernel";

type UserRecord = Readonly<{
  _id: Types.ObjectId;
  userId: string;
  email: string;
  name: string;
  provider: string;
  subject: string;
  status: string;
}>;
type InvitationRecord = Readonly<{
  _id: string;
  tokenHash: string;
  email: string;
  workspaceId: string;
  role: string;
  senderName: string;
  senderUserId: string;
  status: string;
  expiresAt: Date;
  acceptedBy?: string;
  acceptedAt?: Date;
}>;

const schemaOptions = { autoIndex: false, versionKey: false } as const;
const userSchema = new Schema<UserRecord>({
  userId: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  name: { type: String, required: true },
  provider: { type: String, required: true },
  subject: { type: String, required: true },
  status: { type: String, required: true }
}, { ...schemaOptions, collection: "users", timestamps: true });

const invitationSchema = new Schema<InvitationRecord>({
  _id: { type: String, default: () => randomUUID() },
  tokenHash: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  workspaceId: { type: String, required: true },
  role: { type: String, required: true },
  senderName: { type: String, required: true },
  senderUserId: { type: String, required: true },
  status: { type: String, required: true, default: "PENDING" },
  expiresAt: { type: Date, required: true },
  acceptedBy: { type: String },
  acceptedAt: { type: Date }
}, { ...schemaOptions, collection: "invitations" });
invitationSchema.index({ tokenHash: 1 }, { unique: true, name: "invitations_by_token_hash" });

const users = (mongoose.models.IdentityUser as Model<UserRecord> | undefined)
  ?? model<UserRecord>("IdentityUser", userSchema, "users");
const invitations = (mongoose.models.IdentityInvitation as Model<InvitationRecord> | undefined)
  ?? model<InvitationRecord>("IdentityInvitation", invitationSchema, "invitations");

const normalizeEmail = (email: string): string => email.trim().toLocaleLowerCase();

export const hashInvitationToken = (token: string): string => createHash("sha256").update(token).digest("hex");

export const initializeIdentityMongoCollections = async (): Promise<void> => {
  await invitations.createIndexes();
};

export type IdentityMongoDependencies = IdentityBootstrapDependencies<ClientSession>;

export const createIdentityMongoDependencies = (clock: Clock = systemClock): IdentityMongoDependencies => ({
  createUser: async ({ identity }, session) => {
    const email = normalizeEmail(identity.email);
    const provider = identity.provider;
    const subject = identity.subject;
    const existing = await users.findOne({ $or: [{ provider, subject }, { email }] }).session(session).lean().exec();
    if (existing) {
      if (existing.provider !== provider || existing.subject !== subject) {
        throw new Error("This email is already associated with another sign-in provider.");
      }
      if (existing.status !== "ACTIVE") throw new Error("This account is not active.");
      return { id: existing.userId };
    }
    const userId = randomUUID();
    const [created] = await users.create([{
      userId, email, name: identity.displayName.trim() || email,
      provider, subject, status: "ACTIVE"
    }], { session });
    if (!created) throw new Error("User persistence did not return the created user.");
    return { id: created.userId };
  },
  resolveInvitation: async (token, email, session) => {
    const invitation = await invitations.findOne({ tokenHash: hashInvitationToken(token) })
      .session(session).lean().exec();
    if (!invitation || invitation.email !== normalizeEmail(email)) return { status: "missing" };
    if (invitation.status === "ACCEPTED" && invitation.acceptedBy) {
      const acceptedUser = await users.findOne({ email: normalizeEmail(email), userId: invitation.acceptedBy })
        .session(session).lean().exec();
      if (!acceptedUser) return { status: "missing" };
    } else if (invitation.status !== "PENDING") {
      return { status: "missing" };
    }
    if (invitation.status !== "ACCEPTED" && invitation.expiresAt.getTime() <= clock.now()) {
      return { status: "expired", senderName: invitation.senderName };
    }
    return { status: "valid", workspaceId: invitation.workspaceId, role: invitation.role };
  },
  acceptInvitation: async ({ userId, workspaceId, role, idempotencyKey }, session) => {
    const invitation = await invitations.findOne({ tokenHash: hashInvitationToken(idempotencyKey) })
      .session(session).lean().exec();
    if (!invitation || invitation.workspaceId !== workspaceId || invitation.role !== role) {
      throw new Error("Invitation changed before acceptance.");
    }
    if (invitation.acceptedBy && invitation.acceptedBy !== userId) {
      throw new Error("Invitation has already been accepted by another user.");
    }
    if (!invitation.acceptedAt) {
      const accepted = await invitations.updateOne({
        _id: invitation._id, status: "PENDING", acceptedAt: { $exists: false }, expiresAt: { $gt: new Date(clock.now()) }
      }, { $set: { acceptedBy: userId, acceptedAt: new Date(clock.now()), status: "ACCEPTED" } }, { session }).exec();
      if (accepted.modifiedCount !== 1) throw new Error("Invitation expired or was accepted concurrently.");
    }
  }
});
