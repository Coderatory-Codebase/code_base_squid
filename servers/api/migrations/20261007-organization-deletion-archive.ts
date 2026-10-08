import { OrganizationModel } from "../features/workspace/integrations/organization.model.js";

export const up = async (): Promise<void> => {
  await OrganizationModel.updateMany(
    { lifecycleVersion: { $exists: false } },
    { $set: { lifecycleVersion: 0 } }
  ).exec();
  await OrganizationModel.updateMany(
    { archivedAt: { $exists: false } },
    { $set: { archivedAt: null } }
  ).exec();
  await OrganizationModel.updateMany(
    { archivedBy: { $exists: false } },
    { $set: { archivedBy: null } }
  ).exec();
  await OrganizationModel.updateMany(
    { deletedBy: { $exists: false } },
    { $set: { deletedBy: null } }
  ).exec();
  await OrganizationModel.createIndexes();
};

export const down = async (): Promise<void> => {
  const changedDocuments = await OrganizationModel.countDocuments({
    $or: [
      { lifecycleVersion: { $gt: 0 } },
      { archivedAt: { $ne: null } },
      { deletedBy: { $ne: null } }
    ]
  }).exec();
  if (changedDocuments > 0) {
    throw new Error("Cannot roll back organization lifecycle fields while archived, deleted, or versioned records exist.");
  }
  await OrganizationModel.updateMany(
    { lifecycleVersion: 0, archivedAt: null, archivedBy: null, deletedBy: null },
    { $unset: { lifecycleVersion: 1, archivedAt: 1, archivedBy: 1, deletedBy: 1 } }
  ).exec();
  await OrganizationModel.collection.dropIndex("owner_lifecycle_version").catch((error: unknown) => {
    if (!(error instanceof Error) || !error.message.includes("index not found")) throw error;
  });
  await OrganizationModel.collection.dropIndex("workspace_lifecycle_view").catch((error: unknown) => {
    if (!(error instanceof Error) || !error.message.includes("index not found")) throw error;
  });
};
