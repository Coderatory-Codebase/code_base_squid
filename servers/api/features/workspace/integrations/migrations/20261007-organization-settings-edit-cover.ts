import type { Connection } from "mongoose";

const collectionName = "organizations";
const indexName = "workspace_settings_live_cover";
const editableSettingsCover = { workspaceIds: 1, settings: 1, _id: 1, ownerId: 1, version: 1 } as const;
const originalSettingsCover = { workspaceIds: 1, settings: 1 } as const;

const getOrganizations = (connection: Connection) => {
  if (!connection.db) throw new Error("The organization settings index migration requires a connected MongoDB database.");
  return connection.db.collection(collectionName);
};

const replaceSettingsCover = async (
  connection: Connection,
  key: typeof editableSettingsCover | typeof originalSettingsCover
): Promise<void> => {
  const organizations = getOrganizations(connection);
  const existing = (await organizations.indexes()).find(({ name }) => name === indexName);
  const expected = Object.entries(key);
  const current = existing ? Object.entries(existing.key) : [];
  if (existing && JSON.stringify(current) !== JSON.stringify(expected)) {
    await organizations.dropIndex(indexName);
  }
  if (!existing || JSON.stringify(current) !== JSON.stringify(expected)) {
    await organizations.createIndex(key, {
      name: indexName,
      partialFilterExpression: { deletedAt: null }
    });
  }
};

/** Keep the settings read covered after it starts returning safe edit metadata. */
export const up = async (connection: Connection): Promise<void> => {
  await replaceSettingsCover(connection, editableSettingsCover);
};

/** Restore the original covered-read index shape. */
export const down = async (connection: Connection): Promise<void> => {
  await replaceSettingsCover(connection, originalSettingsCover);
};
