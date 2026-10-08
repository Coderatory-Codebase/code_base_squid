import { Schema, type Types } from "mongoose";

export const ORGANIZATION_PROFILE_COLLECTION = "organizationProfiles";
export const ORGANIZATION_PROFILE_WORKSPACE_INDEX = "organizationProfileId_1_workspaceId_1";
export const organizationProfileWorkspaceIndex = Object.freeze({
  organizationProfileId: 1 as const,
  workspaceId: 1 as const
});
export const organizationProfileWorkspaceIndexOptions = Object.freeze({ name: ORGANIZATION_PROFILE_WORKSPACE_INDEX });

export const ORGANIZATION_WORKSPACE_STATES = Object.freeze(["ACTIVE", "ARCHIVED"] as const);
export type OrganizationWorkspaceState = (typeof ORGANIZATION_WORKSPACE_STATES)[number];

export type OrganizationProfileDocument = Readonly<{
  workspaceId: Types.ObjectId;
  organizationProfileId: Types.ObjectId;
  workspaceState: OrganizationWorkspaceState;
  activeMemberCount: number;
  updatedAt: Date;
  version: number;
  deletedAt?: Date;
}>;

export const organizationProfileSchema = new Schema<OrganizationProfileDocument>(
  {
    workspaceId: { type: Schema.Types.ObjectId, required: true },
    organizationProfileId: { type: Schema.Types.ObjectId, required: true },
    workspaceState: { type: String, required: true, trim: true, enum: ORGANIZATION_WORKSPACE_STATES },
    activeMemberCount: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isSafeInteger, message: "activeMemberCount must be a non-negative integer." }
    },
    updatedAt: { type: Date, required: true },
    version: { type: Number, required: true, min: 0, default: 0 },
    deletedAt: { type: Date, default: undefined }
  },
  {
    collection: ORGANIZATION_PROFILE_COLLECTION,
    timestamps: { createdAt: false, updatedAt: true },
    versionKey: "version",
    optimisticConcurrency: true,
    strict: "throw"
  }
);

organizationProfileSchema.index(organizationProfileWorkspaceIndex, organizationProfileWorkspaceIndexOptions);
