import mongoose, { Schema } from "mongoose";
import { systemClock } from "@workspace/kernel";

export type OrganizationDocument = Readonly<{
  _id: string;
  name: string;
  ownerId: string;
  workspaceIds: readonly string[];
  lastUsedAt: Date;
  deletedAt: Date | null;
  settings: Readonly<Record<string, unknown>>;
}>;

const organizationSchema = new Schema<OrganizationDocument>(
  {
    name: { type: String, required: true, minlength: 1, maxlength: 80 },
    ownerId: { type: String, required: true, index: true },
    workspaceIds: { type: [String], required: true, index: true },
    lastUsedAt: { type: Date, required: true, default: () => new Date(systemClock.now()) },
    // Deletion is soft: retain the organization row and keep it out of live settings reads.
    deletedAt: { type: Date, default: null },
    settings: {
      type: Schema.Types.Mixed,
      required: true,
      default: () => ({})
    }
  },
  { timestamps: true }
);

organizationSchema.index(
  { workspaceIds: 1, settings: 1 },
  {
    name: "workspace_settings_live_cover",
    partialFilterExpression: { deletedAt: null }
  }
);

export const OrganizationModel =
  (mongoose.models.Organization as mongoose.Model<OrganizationDocument> | undefined) ??
  mongoose.model<OrganizationDocument>("Organization", organizationSchema);
