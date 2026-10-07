import mongoose, { Types } from "mongoose";

export type MigrationTestDatabase = Readonly<{
  connection: Readonly<Pick<mongoose.Connection, "collection">>;
  insertMany: (collection: string, documents: Record<string, unknown>[]) => Promise<void>;
  findAll: (collection: string) => Promise<unknown[]>;
  listIndexes: (collection: string) => Promise<unknown[]>;
  explain: (collection: string, filter: Record<string, unknown>, indexName?: string) => Promise<unknown>;
  close: () => Promise<void>;
}>;

export const createMigrationTestDatabase = async (uri: string, dbName: string): Promise<MigrationTestDatabase> => {
  const connection = await mongoose.createConnection(uri, { dbName }).asPromise();
  const database = connection.db;
  if (!database) {
    await connection.close();
    throw new Error("Could not get migration test database");
  }
  return Object.freeze({
    connection,
    insertMany: async (collection, documents) => {
      const idFields = ["_id", "organizationProfileId", "workspaceId"];
      const mapped = documents.map(document => {
        const result = { ...document };
        for (const field of idFields) {
          const value = result[field];
          if (typeof value === "string" && Types.ObjectId.isValid(value)) result[field] = new Types.ObjectId(value);
        }
        return result;
      });
      await database.collection(collection).insertMany(mapped);
    },
    findAll: async collection => database.collection(collection).find().sort({ _id: 1 }).toArray(),
    listIndexes: async collection => database.collection(collection).listIndexes().toArray(),
    explain: async (collection, filter, indexName) => {
      const mongoFilter = { ...filter };
      for (const [field, value] of Object.entries(mongoFilter)) {
        if (typeof value === "string" && Types.ObjectId.isValid(value)) mongoFilter[field] = new Types.ObjectId(value);
      }
      let cursor = database.collection(collection).find(mongoFilter);
      if (indexName) cursor = cursor.hint(indexName);
      return cursor.explain();
    },
    close: async () => connection.close()
  });
};

export const toMongoObjectId = (value: string): unknown => new Types.ObjectId(value);

export const runMongoCommand = async (command: Record<string, unknown>): Promise<Record<string, unknown>> => {
  const database = mongoose.connection.db;
  if (!database) throw new Error("Could not get db");
  return database.admin().command(command);
};

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
