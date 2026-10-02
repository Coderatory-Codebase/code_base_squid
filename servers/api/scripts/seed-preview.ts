import "dotenv/config";
import { createMongoDbIntegration } from "../integrations/mongodb/index.js";
import { createAuthGateway, hashPassword } from "../features/auth/index.js";
import { createOrganizationGateway } from "../features/workspace/index.js";

const requiredEnvironment = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be configured to seed the preview account.`);
  return value;
};

const seedPreview = async (): Promise<void> => {
  const mongoUri = requiredEnvironment("MONGODB_URI");
  const email = requiredEnvironment("PREVIEW_USER_EMAIL").trim().toLowerCase();
  const password = requiredEnvironment("PREVIEW_USER_PASSWORD");
  const workspaceId = requiredEnvironment("PREVIEW_WORKSPACE_ID");
  const database = createMongoDbIntegration({
    uri: mongoUri,
    logger: { info: () => undefined, warn: () => undefined, error: () => undefined }
  });
  await database.connect();
  try {
    const passwordHash = await hashPassword(password);
    const user = await createAuthGateway().upsertUser(email, passwordHash, [workspaceId]);
    const organizationGateway = createOrganizationGateway();
    const lastUsedAt = new Date();
    const ownedLastUsedAt = new Date(lastUsedAt.getTime() - 24 * 60 * 60 * 1_000);
    await organizationGateway.upsertPreviewOrganization("0000000000000000000000a1", {
      name: "Owned organization", ownerId: user.id, workspaceIds: [], lastUsedAt: ownedLastUsedAt, deletedAt: null
    });
    await organizationGateway.upsertPreviewOrganization("0000000000000000000000b1", {
      name: "Workspace organization", ownerId: "preview-other-owner", workspaceIds: [workspaceId], lastUsedAt, deletedAt: null
    });
    await organizationGateway.upsertPreviewOrganization("0000000000000000000000c1", {
      name: "Unrelated organization", ownerId: "preview-unrelated-owner", workspaceIds: [`${workspaceId}-unrelated`], lastUsedAt, deletedAt: null
    });
    console.info(`Preview account and organization fixtures seeded for ${email}.`);
  } finally {
    await database.disconnect();
  }
};

await seedPreview();
