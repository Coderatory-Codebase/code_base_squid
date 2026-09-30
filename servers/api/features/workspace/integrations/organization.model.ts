import mongoose, { Schema } from "mongoose";

export type OrganizationDocument = Readonly<{
  _id: string;
  name: string;
  ownerId: string;
  workspaceIds: readonly string[];
  lastUsedAt: Date;
  deletedAt: Date | null;
}>;

const organizationSchema = new Schema<OrganizationDocument>(
  {
    name: { type: String, required: true, minlength: 1, maxlength: 80 },
    ownerId: { type: String, required: true, index: true },
    workspaceIds: { type: [String], required: true, index: true },
    lastUsedAt: { type: Date, required: true, default: () => new Date() },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export const OrganizationModel =
  mongoose.models.Organization ??
  mongoose.model<OrganizationDocument>("Organization", organizationSchema);
