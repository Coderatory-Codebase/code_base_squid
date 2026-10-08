import mongoose, { Schema } from "mongoose";
import type { Types as MongooseTypes } from "mongoose";
import type { OrganizationRole } from "../types.js";

export type OrganizationDocument = Readonly<{
  _id: string | MongooseTypes.ObjectId;
  name: string;
  ownerId: string;
  ownerEmail?: string;
  workspaceIds: readonly string[];
  lastUsedAt: Date;
  deletedAt: Date | null;
  deletedBy?: string | null;
  archivedAt?: Date | null;
  archivedBy?: string | null;
  lifecycleVersion?: number;
  members?: readonly OrganizationMember[];
  invitations?: readonly OrganizationInvitation[];
  activity?: readonly OrganizationActivity[];
}>;

export const normalizeOrganizationId = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
  throw new Error("MongoDB returned an invalid organization identifier.");
};

export type OrganizationMember = Readonly<{
  userId: string;
  email: string;
  role: OrganizationRole;
  joinedAt: Date;
}>;
export type OrganizationInvitation = Readonly<{
  email: string;
  role: OrganizationRole;
  tokenHash: string;
  expiresAt: Date;
  invitedBy: string;
  createdAt: Date;
  acceptedAt: Date | null;
}>;
export type OrganizationActivityAction =
  | "invitation_sent"
  | "invitation_accepted"
  | "member_role_changed"
  | "member_removed";
export type OrganizationActivity = Readonly<{
  actorId: string;
  actorEmail?: string | null;
  action: OrganizationActivityAction;
  target: string;
  createdAt: Date;
}>;

const memberSchema = new Schema<OrganizationMember>({
  userId: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: ["admin", "member"], required: true },
  joinedAt: { type: Date, required: true }
}, { _id: false });

const invitationSchema = new Schema<OrganizationInvitation>({
  email: { type: String, required: true, lowercase: true },
  role: { type: String, enum: ["admin", "member"], required: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  invitedBy: { type: String, required: true },
  createdAt: { type: Date, required: true },
  acceptedAt: { type: Date, default: null }
}, { _id: false });

const activitySchema = new Schema<OrganizationActivity>({
  actorId: { type: String, required: true },
  actorEmail: { type: String, lowercase: true, trim: true, default: null },
  action: {
    type: String,
    enum: ["invitation_sent", "invitation_accepted", "member_role_changed", "member_removed"],
    required: true
  },
  target: { type: String, required: true },
  createdAt: { type: Date, required: true }
}, { _id: false });

const organizationSchema = new Schema<OrganizationDocument>(
  {
    name: { type: String, required: true, minlength: 1, maxlength: 80 },
    ownerId: { type: String, required: true, index: true },
    ownerEmail: { type: String, lowercase: true, trim: true },
    workspaceIds: { type: [String], required: true, index: true },
    lastUsedAt: { type: Date, required: true, default: () => new Date() },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: String, default: null },
    archivedAt: { type: Date, default: null },
    archivedBy: { type: String, default: null },
    lifecycleVersion: { type: Number, required: true, default: 0, min: 0 },
    members: { type: [memberSchema], default: [] },
    invitations: { type: [invitationSchema], default: [] },
    activity: { type: [activitySchema], default: [] }
  },
  { timestamps: true }
);

organizationSchema.index({ "members.userId": 1 });
organizationSchema.index({ "invitations.tokenHash": 1, "invitations.email": 1 });
organizationSchema.index(
  { ownerId: 1, deletedAt: 1, lastUsedAt: -1, name: 1, _id: 1 },
  { name: "owner_list_page" }
);
organizationSchema.index(
  { workspaceIds: 1, deletedAt: 1, lastUsedAt: -1, name: 1, _id: 1 },
  { name: "workspace_list_page" }
);
organizationSchema.index(
  { "members.userId": 1, deletedAt: 1, lastUsedAt: -1, name: 1, _id: 1 },
  { name: "member_list_page" }
);
organizationSchema.index(
  { ownerId: 1, deletedAt: 1, archivedAt: 1, lifecycleVersion: 1 },
  { name: "owner_lifecycle_version" }
);
organizationSchema.index(
  { workspaceIds: 1, deletedAt: 1, archivedAt: 1, updatedAt: 1 },
  { name: "workspace_lifecycle_view" }
);

export const OrganizationModel =
  mongoose.models.Organization ??
  mongoose.model<OrganizationDocument>("Organization", organizationSchema, "organizations");
