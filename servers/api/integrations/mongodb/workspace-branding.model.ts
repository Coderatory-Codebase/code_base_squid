import mongoose, { type InferSchemaType, type Model } from "mongoose";

export const ORGANIZATION_BRANDING_INDEX_NAME = "workspace_organization_branding_covering";
export const ORGANIZATION_BRANDING_LIST_INDEX_NAME = "workspace_organization_branding_list_covering";

export type WorkspaceBrandingQuery = Readonly<{
  organizationId: string;
  deletedAt: null;
  workspaceId: string;
}>;

export type WorkspaceBrandingValue = Readonly<{
  organizationId: string;
  logoUrl: string | null;
  accentColor: string | null;
}>;

export type WorkspaceBrandingProjection = Readonly<{
  _id: 0;
  organizationId: 1;
  logoUrl: 1;
  accentColor: 1;
}>;

const brandingProjection: WorkspaceBrandingProjection = Object.freeze({
  _id: 0,
  organizationId: 1,
  logoUrl: 1,
  accentColor: 1
});

const workspaceSchema = new mongoose.Schema({
  workspaceId: { type: String, required: true },
  organizationId: { type: String, required: true },
  logoUrl: { type: String, default: null },
  accentColor: { type: String, default: null },
  deletedAt: { type: Date, default: null }
}, {
  collection: "workspaces",
  timestamps: true,
  versionKey: false
});

workspaceSchema.index({
  workspaceId: 1,
  organizationId: 1,
  deletedAt: 1,
  logoUrl: 1,
  accentColor: 1
}, { name: ORGANIZATION_BRANDING_INDEX_NAME });

workspaceSchema.index({
  workspaceId: 1,
  deletedAt: 1,
  organizationId: 1,
  logoUrl: 1,
  accentColor: 1
}, { name: ORGANIZATION_BRANDING_LIST_INDEX_NAME });

export type WorkspaceBrandingDocument = InferSchemaType<typeof workspaceSchema>;

export const WorkspaceBrandingModel: Model<WorkspaceBrandingDocument> =
  (mongoose.models.WorkspaceBranding as Model<WorkspaceBrandingDocument> | undefined)
  ?? mongoose.model<WorkspaceBrandingDocument>("WorkspaceBranding", workspaceSchema, "workspaces");

export const workspaceBrandingMongoQueries = Object.freeze({
  listForWorkspace: async (workspaceId: string): Promise<readonly WorkspaceBrandingValue[]> => {
    const rows = await WorkspaceBrandingModel.find({
      workspaceId,
      deletedAt: null
    }, brandingProjection).lean().exec();
    return rows.map(({ organizationId, logoUrl, accentColor }) => ({
      organizationId,
      logoUrl: logoUrl ?? null,
      accentColor: accentColor ?? null
    }));
  },
  findMany: async (query: WorkspaceBrandingQuery): Promise<readonly WorkspaceBrandingValue[]> => {
    const rows = await WorkspaceBrandingModel.find({
      organizationId: query.organizationId,
      deletedAt: query.deletedAt,
      workspaceId: query.workspaceId
    }, brandingProjection).lean().exec();
    return rows.map(({ organizationId, logoUrl, accentColor }) => ({
      organizationId,
      logoUrl: logoUrl ?? null,
      accentColor: accentColor ?? null
    }));
  },
  explain: (query: WorkspaceBrandingQuery): Promise<unknown> => WorkspaceBrandingModel.find({
    organizationId: query.organizationId,
    deletedAt: query.deletedAt,
    workspaceId: query.workspaceId
  }, brandingProjection).explain("executionStats")
});

export const runOrganizationBrandingExplainProbe = async (uri: string): Promise<unknown> => {
  await mongoose.connect(uri, { autoIndex: false, serverSelectionTimeoutMS: 10_000 });
  try {
    return await WorkspaceBrandingModel.find({
      organizationId: "__organization_branding_explain_probe__",
      deletedAt: null,
      workspaceId: "__workspace_explain_probe__"
    }, brandingProjection).explain("executionStats");
  } finally {
    await mongoose.disconnect();
  }
};
