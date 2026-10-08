import type { Connection } from "mongoose";

const organizationsCollectionName = "organizations";

const organizationsCollection = (connection: Connection) => {
  if (!connection.db) throw new Error("The organization-setting migration requires a connected MongoDB database.");
  return connection.db.collection(organizationsCollectionName);
};

/** Backfill the explicit optimistic-concurrency version on existing organization records. */
export const up = async (connection: Connection): Promise<void> => {
  await organizationsCollection(connection).updateMany(
    { version: { $exists: false } },
    { $set: { version: 1 } }
  );
};

/** Remove only the version field introduced by this migration. */
export const down = async (connection: Connection): Promise<void> => {
  await organizationsCollection(connection).updateMany(
    { version: { $exists: true } },
    { $unset: { version: "" } }
  );
};
