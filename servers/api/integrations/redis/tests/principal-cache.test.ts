import test from "node:test";
import assert from "node:assert/strict";
import { createRedisPrincipalCache, type RedisLike } from "../index.js";

const createClient = () => {
  const store = new Map<string, string>();
  const state = { lastOptions: undefined as { EX: number } | undefined };
  const client: RedisLike = {
    get: (key) => Promise.resolve(store.get(key) ?? null),
    set: (key, value, options) => {
      state.lastOptions = { EX: options.EX };
      store.set(key, value);
      return Promise.resolve("OK");
    },
    del: (key) => {
      store.delete(key);
      return Promise.resolve(1);
    }
  };
  return { client, store, state };
};

const principal = {
  userId: "ben",
  orgId: "org-1",
  workspaceId: "design",
  role: "admin",
  guest: false,
  membershipStatus: "ACTIVE",
  workspaceStatus: "ACTIVE",
  orgStatus: "ACTIVE"
};

void test("stores the principal as JSON with the TTL and reads it back", async () => {
  const { client, state } = createClient();
  const cache = createRedisPrincipalCache({ client });

  await cache.set("k", principal, 60);

  assert.deepEqual(state.lastOptions, { EX: 60 });
  assert.deepEqual(await cache.get("k"), principal);
});

void test("a missing or unparseable value reads as null", async () => {
  const { client, store } = createClient();
  const cache = createRedisPrincipalCache({ client });
  store.set("broken", "{not json");

  assert.equal(await cache.get("absent"), null);
  assert.equal(await cache.get("broken"), null);
});

void test("delete removes the entry", async () => {
  const { client } = createClient();
  const cache = createRedisPrincipalCache({ client });
  await cache.set("k", principal, 60);

  await cache.delete("k");

  assert.equal(await cache.get("k"), null);
});
