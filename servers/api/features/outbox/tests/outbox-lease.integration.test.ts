import test from "node:test";
import assert from "node:assert/strict";
import { createRedisOutboxLease, type LeaseRedisClient } from "../integrations/index.js";

type Call = Readonly<{ command: string; args: readonly unknown[] }>;

type Answers = Readonly<{
  set?: () => Promise<"OK" | null>;
  evalResult?: () => Promise<unknown>;
}>;

const createClient = (answers: Answers = {}): Readonly<{ client: LeaseRedisClient; calls: Call[] }> => {
  const calls: Call[] = [];
  const client: LeaseRedisClient = {
    set: (...args): Promise<"OK" | null> => {
      calls.push({ command: "set", args });
      return answers.set ? answers.set() : Promise.resolve("OK");
    },
    eval: (...args): Promise<unknown> => {
      calls.push({ command: "eval", args });
      return answers.evalResult ? answers.evalResult() : Promise.resolve(1);
    },
    quit: (): Promise<unknown> => {
      calls.push({ command: "quit", args: [] });
      return Promise.resolve("OK");
    }
  };
  return { client, calls };
};

const createLease = (client: LeaseRedisClient): ReturnType<typeof createRedisOutboxLease> =>
  createRedisOutboxLease({ url: "redis://example.test", leaseName: "outbox-relay", commandTimeoutMs: 5_000, client });

void test("takes a free lease with SET NX and a TTL, storing the owner id under the lease key", async (): Promise<void> => {
  const { client, calls } = createClient({ set: () => Promise.resolve("OK") });

  const acquired = await createLease(client).acquire({ ownerId: "me", ttlMs: 30_000 });

  assert.equal(acquired, true);
  assert.deepEqual(calls, [{ command: "set", args: ["outbox:lease:outbox-relay", "me", "PX", 30_000, "NX"] }]);
});

void test("renews the lease it already holds by extending the TTL only while the key still holds its owner id", async (): Promise<void> => {
  const { client, calls } = createClient({ set: () => Promise.resolve(null), evalResult: () => Promise.resolve(1) });

  const acquired = await createLease(client).acquire({ ownerId: "me", ttlMs: 30_000 });

  assert.equal(acquired, true);
  assert.deepEqual(calls.map((call) => call.command), ["set", "eval"]);
  const renewal = calls.find((call) => call.command === "eval");
  assert.ok(renewal);
  assert.match(String(renewal.args[0]), /get.*== ARGV\[1\].*pexpire/);
  assert.deepEqual(renewal.args.slice(1), [1, "outbox:lease:outbox-relay", "me", 30_000]);
});

void test("reports the lease as held elsewhere when the key exists with another owner", async (): Promise<void> => {
  const { client } = createClient({ set: () => Promise.resolve(null), evalResult: () => Promise.resolve(0) });

  assert.equal(await createLease(client).acquire({ ownerId: "me", ttlMs: 30_000 }), false);
});

void test("surfaces Redis failures instead of treating them as a lost lease", async (): Promise<void> => {
  const { client } = createClient({ set: () => Promise.reject(new Error("redis unavailable")) });

  await assert.rejects(createLease(client).acquire({ ownerId: "me", ttlMs: 30_000 }), /redis unavailable/);
});

void test("releases only a lease the given owner holds", async (): Promise<void> => {
  const { client, calls } = createClient();

  await createLease(client).release({ ownerId: "me" });

  const [release] = calls;
  assert.equal(calls.length, 1);
  assert.ok(release);
  assert.match(String(release.args[0]), /get.*== ARGV\[1\].*del/);
  assert.deepEqual(release.args.slice(1), [1, "outbox:lease:outbox-relay", "me"]);
});

void test("closes the Redis connection", async (): Promise<void> => {
  const { client, calls } = createClient();

  await createLease(client).close();

  assert.deepEqual(calls, [{ command: "quit", args: [] }]);
});
