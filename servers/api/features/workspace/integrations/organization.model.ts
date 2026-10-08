import mongoose, { Schema } from "mongoose";
import type { Types as MongooseTypes } from "mongoose";
import { systemClock } from "@workspace/kernel";
import type { OrganizationRole } from "../types.js";

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

export type OrganizationSettingsValues = Readonly<Record<string, unknown>> & Readonly<{
  timeZone?: string;
  weekStart?: "Monday" | "Sunday";
  dateFormat?: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  workspaceSetupRule?: "owner only" | "any member";
}>;

export type OrganizationDocument = Readonly<{
  _id: string | MongooseTypes.ObjectId;
  name: string;
  ownerId: string;
  ownerEmail?: string;
  workspaceIds: readonly string[];
  lastUsedAt: Date;
  deletedAt: Date | null;
  version?: number;
  members?: readonly OrganizationMember[];
  invitations?: readonly OrganizationInvitation[];
  activity?: readonly OrganizationActivity[];
  settings: OrganizationSettingsValues;
}>;

export const normalizeOrganizationId = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
  throw new Error("MongoDB returned an invalid organization identifier.");
};

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

const organizationSettingsSchema = new Schema<OrganizationSettingsValues>({
  timeZone: { type: String, trim: true },
  weekStart: { type: String, enum: ["Monday", "Sunday"] },
  dateFormat: { type: String, enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] },
  workspaceSetupRule: { type: String, enum: ["owner only", "any member"] }
}, { _id: false, strict: false });

const organizationSchema = new Schema<OrganizationDocument>(
  {
    name: { type: String, required: true, minlength: 1, maxlength: 80 },
    ownerId: { type: String, required: true, index: true },
    ownerEmail: { type: String, lowercase: true, trim: true },
    workspaceIds: { type: [String], required: true, index: true },
    lastUsedAt: { type: Date, required: true, default: () => new Date(systemClock.now()) },
    // Deletion is soft: retain the organization row and keep it out of live settings reads.
    deletedAt: { type: Date, default: null },
    version: { type: Number, required: true, default: 1, min: 1 },
    members: { type: [memberSchema], default: [] },
    invitations: { type: [invitationSchema], default: [] },
    activity: { type: [activitySchema], default: [] },
    settings: {
      type: organizationSettingsSchema,
      required: true,
      default: () => ({})
    }
  },
  { timestamps: true, versionKey: false }
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
  { workspaceIds: 1, settings: 1, _id: 1, ownerId: 1, version: 1, name: 1 },
  {
    name: "workspace_settings_live_cover",
    partialFilterExpression: { deletedAt: null }
  }
);
organizationSchema.index(
  { ownerId: 1, settings: 1, _id: 1, version: 1, name: 1 },
  {
    name: "owner_settings_live_cover",
    partialFilterExpression: { deletedAt: null }
  }
);

export const OrganizationModel =
  (mongoose.models.Organization as mongoose.Model<OrganizationDocument> | undefined) ??
  mongoose.model<OrganizationDocument>("Organization", organizationSchema, "organizations");
