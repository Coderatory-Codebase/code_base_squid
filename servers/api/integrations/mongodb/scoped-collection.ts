import type { RawCollection, ScopedDocument } from "../../kernel/index.js";

type Filter = Readonly<Record<string, unknown>>;

/** Minimal structural view of a native driver collection. */
export type DriverCollection = Readonly<{
  find: (filter: Filter) => { readonly toArray: () => Promise<unknown[]> };
  insertOne: (document: Record<string, unknown>) => Promise<unknown>;
  updateOne: (filter: Filter, update: Filter) => Promise<{ readonly matchedCount: number }>;
}>;

export const createMongoScopedCollection = <T extends ScopedDocument>(
  driver: DriverCollection
): RawCollection<T> => ({
  find: async (filter) => (await driver.find(filter).toArray()) as unknown as ReadonlyArray<T>,
  insertOne: async (document) => {
    await driver.insertOne({ ...document });
  },
  updateOne: async (filter, update) => {
    const { matchedCount } = await driver.updateOne(filter, update);
    return { matchedCount };
  }
});
