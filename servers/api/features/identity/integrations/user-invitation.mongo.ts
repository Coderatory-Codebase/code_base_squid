import { Schema, model } from "../../../integrations/mongodb/index.js";
import type { Types } from "mongoose";
import type { UserInvitation } from "../models/index.js";
import type { InvitationQueryOptions, PendingInvitationInput, Principal } from "../types/index.js";
import type { UserInvitationGateway, UserInvitationScope } from "../gateways/index.js";

interface UserInvitationDocument extends Omit<UserInvitation, "id"> {
  _id: Types.ObjectId;
}

const userInvitationSchema = new Schema<UserInvitationDocument>(
  {
    workspaceId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    invitedBy: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    status: { type: String, required: true, enum: ["pending", "accepted", "expired", "revoked"], default: "pending", index: true },
    role: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    acceptedAt: { type: Date },
    deletedAt: { type: Date, index: true }
  },
  { timestamps: true, collection: "user_invitations" }
);

userInvitationSchema.index({ workspaceId: 1, deletedAt: 1, createdAt: -1 });
userInvitationSchema.index({ workspaceId: 1, status: 1, deletedAt: 1, createdAt: -1 });
userInvitationSchema.index(
  { workspaceId: 1, email: 1 },
  { unique: true, partialFilterExpression: { status: "pending", deletedAt: null } }
);

export const UserInvitationModel = model<UserInvitationDocument>("UserInvitation", userInvitationSchema, "user_invitations");

type MongoObjectIdValue = Readonly<{ toHexString: () => string }>;
const isMongoObjectIdValue = (value: unknown): value is MongoObjectIdValue =>
  typeof value === "object" && value !== null && "toHexString" in value && typeof value.toHexString === "function";

const toUserInvitation = (document: Omit<UserInvitation, "id"> & { readonly _id: Types.ObjectId }): UserInvitation => {
  if (!isMongoObjectIdValue(document._id)) throw new Error("MongoDB returned an invalid invitation identifier.");
  return Object.freeze({
    id: document._id.toHexString(), workspaceId: document.workspaceId, email: document.email,
    invitedBy: document.invitedBy, tokenHash: document.tokenHash, status: document.status, role: document.role,
    expiresAt: document.expiresAt, createdAt: document.createdAt, updatedAt: document.updatedAt,
    ...(document.acceptedAt ? { acceptedAt: document.acceptedAt } : {}),
    ...(document.deletedAt ? { deletedAt: document.deletedAt } : {})
  });
};

export const createUserInvitationGateway = (): UserInvitationGateway => {
  const buildScopedFilter = (principal: UserInvitationScope, extra: Record<string, unknown> = {}) => ({
    ...extra,
    workspaceId: principal.workspaceId,
    deletedAt: null
  });
  return Object.freeze({
    findByPrincipal: async (principal: UserInvitationScope, options: InvitationQueryOptions = {}) => {
      const query = UserInvitationModel.find(buildScopedFilter(principal, { ...(options.status && { status: options.status }) }))
        .sort({ createdAt: -1 }).lean();
      if (options.limit) query.limit(options.limit);
      if (options.skip) query.skip(options.skip);
      return Object.freeze((await query.exec()).map(toUserInvitation));
    },
    findOneByEmail: async (principal: Principal, email: string) => {
      const doc = await UserInvitationModel.findOne(buildScopedFilter(principal, { email: email.toLowerCase().trim() })).lean().exec();
      return doc ? toUserInvitation(doc) : null;
    },
    findPendingByEmail: async (principal: Principal, email: string) => {
      const doc = await UserInvitationModel.findOne(buildScopedFilter(principal, { email: email.toLowerCase().trim(), status: "pending" })).lean().exec();
      return doc ? toUserInvitation(doc) : null;
    },
    createPending: async (principal: Principal, input: PendingInvitationInput) => {
      const doc = await UserInvitationModel.create({
        workspaceId: principal.workspaceId, email: input.email.toLowerCase().trim(), invitedBy: principal.userId,
        tokenHash: input.tokenHash, status: "pending", role: input.role, expiresAt: input.expiresAt
      });
      return toUserInvitation(doc);
    },
    replacePending: async (principal: Principal, email: string, input: PendingInvitationInput) => {
      const doc = await UserInvitationModel.findOneAndUpdate(
        buildScopedFilter(principal, { email: email.toLowerCase().trim(), status: "pending" }),
        { $set: { tokenHash: input.tokenHash, role: input.role, expiresAt: input.expiresAt } },
        { new: true }
      ).lean().exec();
      return doc ? toUserInvitation(doc) : null;
    },
    revokePending: async (principal: UserInvitationScope, invitationId: string) =>
      (await UserInvitationModel.findOneAndUpdate(
        buildScopedFilter(principal, { _id: invitationId, status: "pending" }), { $set: { status: "revoked" } }, { new: true }
      ).lean().exec()) !== null,
    resendPending: async (principal: UserInvitationScope, invitationId: string, input: Pick<PendingInvitationInput, "tokenHash" | "expiresAt">) =>
      (await UserInvitationModel.findOneAndUpdate(
        buildScopedFilter(principal, { _id: invitationId, status: "pending" }),
        { $set: { tokenHash: input.tokenHash, expiresAt: input.expiresAt } }, { new: true }
      ).lean().exec()) !== null
  });
};
