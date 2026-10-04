import type { PrincipalCache } from "../../kernel/index.js";

/** The few node-redis calls the cache needs; the real client is passed in at wiring time. */
export type RedisLike = Readonly<{
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, options: Readonly<{ EX: number }>) => Promise<unknown>;
  del: (key: string) => Promise<unknown>;
}>;

export const createRedisPrincipalCache = ({ client }: { readonly client: RedisLike }): PrincipalCache => ({
  get: async (key) => {
    const raw = await client.get(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  },
  set: async (key, value, ttlSeconds) => {
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  },
  delete: async (key) => {
    await client.del(key);
  }
});
