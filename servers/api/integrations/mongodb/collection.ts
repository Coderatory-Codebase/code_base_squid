import mongoose, { Types } from "mongoose";

export type DocumentFilter = Record<string, unknown>;

export type ReadableCollection<T> = Readonly<{
  find: (filter: DocumentFilter) => Promise<T[]>;
  findOne: (filter: DocumentFilter) => Promise<T | null>;
}>;

const toObjectId = (id: string): Types.ObjectId | string => {
  return Types.ObjectId.isValid(id) && (String(new Types.ObjectId(id)) === id) ? new Types.ObjectId(id) : id;
};

export const convertFilterToMongo = (filter: DocumentFilter, idFields: string[]): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...filter };
  for (const field of idFields) {
    if (result[field] !== undefined) {
      const val = result[field];
      if (typeof val === "string") {
        result[field] = toObjectId(val);
      } else if (val && typeof val === "object" && "$in" in val) {
        const inArr = (val as Record<string, unknown>).$in;
        if (Array.isArray(inArr)) {
          result[field] = { ...val, $in: inArr.map((id: unknown) => typeof id === "string" ? toObjectId(id) : id) };
        }
      }
    }
  }
  return result;
};

export const convertDocFromMongo = (doc: unknown): Record<string, unknown> => {
  if (!doc) return doc as Record<string, unknown>;
  const result = { ...(doc as Record<string, unknown>) };
  for (const key of Object.keys(result)) {
    if (result[key] instanceof Types.ObjectId) {
      result[key] = result[key].toString();
    } else if (Array.isArray(result[key])) {
      result[key] = (result[key] as unknown[]).map((item: unknown) => item instanceof Types.ObjectId ? item.toString() : item);
    }
  }
  return result;
};

export const createReadableCollection = <T>(collectionName: string, idFields: string[] = ["_id"]): ReadableCollection<T> => {
  return Object.freeze({
    find: async (filter: DocumentFilter): Promise<T[]> => {
      const db = mongoose.connection.db;
      if (!db) throw new Error("Database not connected");
      const mongoFilter = convertFilterToMongo(filter, idFields);
      const docs = await db.collection(collectionName).find(mongoFilter).toArray();
      return docs.map(doc => convertDocFromMongo(doc) as T);
    },
    findOne: async (filter: DocumentFilter): Promise<T | null> => {
      const db = mongoose.connection.db;
      if (!db) throw new Error("Database not connected");
      const mongoFilter = convertFilterToMongo(filter, idFields);
      const doc = await db.collection(collectionName).findOne(mongoFilter);
      return doc ? convertDocFromMongo(doc) as T : null;
    }
  });
};
