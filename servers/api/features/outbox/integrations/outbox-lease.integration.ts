import { Redis } from "ioredis";

export type OutboxLease = Readonly<{
  // Takes the lease, or renews it when this owner already holds it. Resolves false while another owner's lease is live.
  acquire: (options: { ownerId: string; ttlMs: number }) => Promise<boolean>;
  // Gives the lease up immediately so a successor does not have to wait for it to expire. Only the holder can release it.
  release: (options: { ownerId: string }) => Promise<void>;
  close: () => Promise<void>;
}>;

export type LeaseRedisClient = Readonly<{
  set: (key: string, value: string, mode: "PX", ttlMs: number, flag: "NX") => Promise<"OK" | null>;
  eval: (script: string, keyCount: number, ...args: readonly (string | number)[]) => Promise<unknown>;
  quit: () => Promise<unknown>;
}>;

type OutboxLeaseDependencies = Readonly<{
  url: string;
  leaseName: string;
  commandTimeoutMs: number;
  client?: LeaseRedisClient;
}>;

// Extends the TTL only while the key still holds this owner's id, so an expired lease taken by someone else is never renewed.
const renewScript = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("pexpire", KEYS[1], ARGV[2]) end return 0`;
// Deletes the key only while it still holds this owner's id, so a late release cannot drop a successor's lease.
const releaseScript = `if redis.call("get", KEYS[1]) == ARGV[1] then return redis.call("del", KEYS[1]) end return 0`;

// Fail fast while Redis is unreachable; a command that never settles would wedge the relay's polling.
const createIoRedisClient = (url: string, commandTimeoutMs: number): LeaseRedisClient => {
  const redis = new Redis(url, { maxRetriesPerRequest: 1, commandTimeout: commandTimeoutMs });
  return Object.freeze({
    set: (key, value, mode, ttlMs, flag) => redis.set(key, value, mode, ttlMs, flag),
    eval: (script, keyCount, ...args) => redis.eval(script, keyCount, ...args),
    quit: () => redis.quit()
  });
};

// The lease is one key holding the owner id, taken with SET NX PX. Redis expires it, so a crashed owner's lease lapses
// on its own, and the owner renews it on every poll while it is alive.
export const createRedisOutboxLease = ({
  url,
  leaseName,
  commandTimeoutMs,
  client = createIoRedisClient(url, commandTimeoutMs)
}: OutboxLeaseDependencies): OutboxLease => {
  const key = `outbox:lease:${leaseName}`;

  return Object.freeze({
    acquire: async ({ ownerId, ttlMs }) => {
      if (await client.set(key, ownerId, "PX", ttlMs, "NX") === "OK") return true;
      return await client.eval(renewScript, 1, key, ownerId, ttlMs) === 1;
    },
    release: async ({ ownerId }) => {
      await client.eval(releaseScript, 1, key, ownerId);
    },
    close: async () => {
      await client.quit();
    }
  });
};
