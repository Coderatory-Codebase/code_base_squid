import type { Connection } from "mongoose";

const collectionName = "organizations";
const workspaceIndexName = "workspace_settings_live_cover";
const ownerIndexName = "owner_settings_live_cover";
const workspaceSettingsCover = { workspaceIds: 1, settings: 1, _id: 1, ownerId: 1, version: 1, name: 1 } as const;
const previousWorkspaceSettingsCover = { workspaceIds: 1, settings: 1, _id: 1, ownerId: 1, version: 1 } as const;
const ownerSettingsCover = { ownerId: 1, settings: 1, _id: 1, version: 1, name: 1 } as const;
const liveOrganizationFilter = { deletedAt: null } as const;

const getOrganizations = (connection: Connection) => {
  if (!connection.db) throw new Error("The owner organization settings index migration requires a connected MongoDB database.");
  return connection.db.collection(collectionName);
};

const ensureIndex = async (
  connection: Connection,
  name: string,
  key: Readonly<Record<string, 1>>
): Promise<void> => {
  const organizations = getOrganizations(connection);
  const existing = (await organizations.indexes()).find((index) => index.name === name);
  const expectedKey = Object.entries(key);
  const currentKey = existing ? Object.entries(existing.key) : [];
  if (existing && JSON.stringify(currentKey) !== JSON.stringify(expectedKey)) {
    await organizations.dropIndex(name);
  }
  if (!existing || JSON.stringify(currentKey) !== JSON.stringify(expectedKey)) {
    await organizations.createIndex(key, { name, partialFilterExpression: liveOrganizationFilter });
  }
};

/** Keep owner and workspace settings reads covered while exposing organization names. */
export const up = async (connection: Connection): Promise<void> => {
  await ensureIndex(connection, workspaceIndexName, workspaceSettingsCover);
  await ensureIndex(connection, ownerIndexName, ownerSettingsCover);
};

/** Remove the owner-only read index and restore the prior workspace settings cover. */
export const down = async (connection: Connection): Promise<void> => {
  const organizations = getOrganizations(connection);
  if ((await organizations.indexes()).some((index) => index.name === ownerIndexName)) {
    await organizations.dropIndex(ownerIndexName);
  }
  await ensureIndex(connection, workspaceIndexName, previousWorkspaceSettingsCover);
};
