import mongoose, { Types } from "mongoose";

export const generateTestId = (): string => new Types.ObjectId().toString();

export const setupTestDatabase = async (uri: string): Promise<void> => {
  const dbName = `test_workspace_${new Types.ObjectId().toString()}`;
  await mongoose.connect(uri, { dbName });
};

export const teardownTestDatabase = async (): Promise<void> => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};

export const createTestIndex = async (collection: string, index: Record<string, 1 | -1>, options?: { unique?: boolean }): Promise<void> => {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Could not get db");
  await db.collection(collection).createIndex(index, options);
};

export const insertTestDocuments = async (collection: string, docs: Record<string, unknown>[]): Promise<void> => {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Could not get db");

  // Convert strings to objectIds manually for test seeds if they are _id, orgId, ownerId, userId, workspaceId
  const idFields = ["_id", "orgId", "ownerId", "userId", "workspaceId"];
  const mapped = docs.map(doc => {
    const res = { ...doc };
    for (const field of idFields) {
      if (typeof res[field] === "string" && Types.ObjectId.isValid(res[field])) {
        res[field] = new Types.ObjectId(res[field]);
      }
    }
    return res;
  });

  await db.collection(collection).insertMany(mapped);
};

export const getExplainPlan = async (collection: string, filter: Record<string, unknown>): Promise<string> => {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Could not get db");

  // map filter
  const mapped: Record<string, unknown> = { ...filter };
  if (typeof mapped.orgId === "string") mapped.orgId = new Types.ObjectId(mapped.orgId);

  const wsExplain = await db.collection(collection).find(mapped).explain();
  return JSON.stringify(wsExplain);
};
