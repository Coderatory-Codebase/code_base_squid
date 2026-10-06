import test from "node:test";
import assert from "node:assert/strict";
import { ERROR_CODES } from "../../constants/index.js";
import {
  PRINCIPAL_CACHE_TTL_SECONDS,
  createPrincipalInvalidator,
  createPrincipalResolver,
  principalCacheKey,
  type IdentityPort,
  type Membership,
  type PrincipalCache,
  type SessionIdentity,
  type WorkspacePort
} from "../index.js";

const NOW = Date.parse("2026-10-04T10:00:00Z");
const HOUR = 3_600_000;
const MINUTE = 60_000;

const activeMembership = (role: string): Membership => ({
  orgId: "org-1",
  role,
  guest: false,
  membershipStatus: "ACTIVE",
  workspaceStatus: "ACTIVE",
  orgStatus: "ACTIVE"
});

const activeSession = (userId: string): SessionIdentity => ({
  userId,
  status: "ACTIVE",
  expiresAt: new Date(NOW + HOUR)
});

/** Ben has an ACTIVE session and is an admin of workspace "design". */
const createFixture = () => {
  const clock = { current: NOW };
  const sessions = new Map<string, unknown>([["s-ben", activeSession("ben")]]);
  const memberships = new Map<string, unknown>([["ben:design", activeMembership("admin")]]);
  const calls = { membership: [] as Array<{ userId: string; workspaceId: string }> };
  const stats = { sets: [] as Array<{ key: string; ttl: number }>, deletes: [] as string[] };
  const store = new Map<string, { value: unknown; expiresAt: number }>();
  const failures = { identity: false, workspace: false, cacheGet: false, cacheSet: false, cacheDelete: false };
  const warnings: string[] = [];

  const identity: IdentityPort = {
    principalFor: (sessionId) => {
      if (failures.identity) return Promise.reject(new Error("identity unavailable"));
      return Promise.resolve((sessions.get(sessionId) ?? null) as SessionIdentity | null);
    }
  };
  const workspace: WorkspacePort = {
    membershipOf: (input) => {
      calls.membership.push({ userId: input.userId, workspaceId: input.workspaceId });
      if (failures.workspace) return Promise.reject(new Error("workspace unavailable"));
      return Promise.resolve((memberships.get(`${input.userId}:${input.workspaceId}`) ?? null) as Membership | null);
    }
  };
  const cache: PrincipalCache = {
    get: (key) => {
      if (failures.cacheGet) return Promise.reject(new Error("cache unavailable"));
      const entry = store.get(key);
      return Promise.resolve(entry && entry.expiresAt > clock.current ? entry.value : null);
    },
    set: (key, value, ttl) => {
      if (failures.cacheSet) return Promise.reject(new Error("cache unavailable"));
      stats.sets.push({ key, ttl });
      store.set(key, { value, expiresAt: clock.current + ttl * 1000 });
      return Promise.resolve();
    },
    delete: (key) => {
      if (failures.cacheDelete) return Promise.reject(new Error("cache unavailable"));
      stats.deletes.push(key);
      store.delete(key);
      return Promise.resolve();
    }
  };
  const logger = {
    warn: (message: string) => {
      warnings.push(message);
    }
  };
  const resolver = createPrincipalResolver({ identity, workspace, cache, logger, now: () => new Date(clock.current) });
  const invalidator = createPrincipalInvalidator({ cache, logger });
  return { clock, sessions, memberships, calls, stats, store, failures, warnings, resolver, invalidator };
};

/** Runs the call and returns what it threw; fails the test if it did not throw. */
const expectError = async (work: () => Promise<unknown>): Promise<Readonly<Record<string, unknown>>> => {
  try {
    await work();
  } catch (error) {
    return error as Record<string, unknown>;
  }
  return assert.fail("expected the call to throw");
};

const designRequest = { sessionId: "s-ben", workspaceId: "design" };

void test("AC-1: an active session and an active admin membership give a complete principal", async () => {
  const { resolver } = createFixture();

  assert.deepEqual(await resolver.resolve(designRequest), {
    userId: "ben",
    orgId: "org-1",
    workspaceId: "design",
    role: "admin",
    guest: false,
    membershipStatus: "ACTIVE",
    workspaceStatus: "ACTIVE",
    orgStatus: "ACTIVE"
  });
});

void test("AC-2: a session that expired a minute ago is unauthenticated and no principal is built", async () => {
  const { resolver, sessions, calls, stats } = createFixture();
  sessions.set("s-ben", { userId: "ben", status: "ACTIVE", expiresAt: new Date(NOW - MINUTE) });

  const error = await expectError(() => resolver.resolve(designRequest));

  assert.equal(error["code"], ERROR_CODES.unauthenticated);
  assert.equal(error["status"], 401);
  assert.equal(calls.membership.length, 0);
  assert.equal(stats.sets.length, 0);
});

void test("AC-2: expired, revoked, unknown and missing sessions are all unauthenticated", async () => {
  const { resolver, sessions } = createFixture();
  sessions.set("s-expired", { userId: "ben", status: "EXPIRED", expiresAt: new Date(NOW + HOUR) });
  sessions.set("s-revoked", { userId: "ben", status: "REVOKED", expiresAt: new Date(NOW + HOUR) });

  for (const sessionId of ["s-expired", "s-revoked", "s-unknown", ""]) {
    const error = await expectError(() => resolver.resolve({ sessionId, workspaceId: "design" }));
    assert.equal(error["code"], ERROR_CODES.unauthenticated, sessionId);
  }
});

void test("AC-2: a warm cache never keeps a dead session alive", async () => {
  const { resolver, sessions, calls } = createFixture();
  await resolver.resolve(designRequest);
  sessions.set("s-ben", { userId: "ben", status: "REVOKED", expiresAt: new Date(NOW + HOUR) });

  const error = await expectError(() => resolver.resolve(designRequest));

  assert.equal(error["code"], ERROR_CODES.unauthenticated);
  assert.equal(calls.membership.length, 1);
});

void test("AC-3: a member of Design only gets no principal for Marketing and nothing is cached", async () => {
  const { resolver, calls, stats } = createFixture();

  const error = await expectError(() => resolver.resolve({ sessionId: "s-ben", workspaceId: "marketing" }));

  assert.equal(error["code"], ERROR_CODES.forbidden);
  assert.equal(error["status"], 403);
  assert.deepEqual(calls.membership, [{ userId: "ben", workspaceId: "marketing" }]);
  assert.equal(stats.sets.length, 0);
});

void test("a membership that is not ACTIVE is forbidden and is not cached", async () => {
  const { resolver, memberships, stats } = createFixture();
  memberships.set("ben:design", { ...activeMembership("admin"), membershipStatus: "SUSPENDED" });

  const error = await expectError(() => resolver.resolve(designRequest));

  assert.equal(error["code"], ERROR_CODES.forbidden);
  assert.equal(stats.sets.length, 0);
});

void test("the cache is per (user, workspace): another workspace never gets this role", async () => {
  const { resolver, memberships, calls } = createFixture();
  memberships.set("ben:marketing", activeMembership("member"));

  const design = await resolver.resolve(designRequest);
  const marketing = await resolver.resolve({ sessionId: "s-ben", workspaceId: "marketing" });
  const designAgain = await resolver.resolve(designRequest);

  assert.equal(design.role, "admin");
  assert.equal(marketing.role, "member");
  assert.equal(designAgain.role, "admin");
  assert.equal(calls.membership.length, 2);
});

void test("a principal is cached for 60 seconds, then resolved again", async () => {
  const { resolver, clock, calls, stats } = createFixture();

  await resolver.resolve(designRequest);
  await resolver.resolve(designRequest);
  assert.equal(calls.membership.length, 1);
  assert.deepEqual(stats.sets, [
    { key: principalCacheKey({ userId: "ben", workspaceId: "design" }), ttl: PRINCIPAL_CACHE_TTL_SECONDS }
  ]);
  assert.equal(PRINCIPAL_CACHE_TTL_SECONDS, 60);

  clock.current += 61_000;
  await resolver.resolve(designRequest);
  assert.equal(calls.membership.length, 2);
});

void test("a malformed cached value is ignored, never returned as a partial principal", async () => {
  const { resolver, store, clock, calls } = createFixture();
  store.set(principalCacheKey({ userId: "ben", workspaceId: "design" }), {
    value: { userId: "ben", workspaceId: "design" },
    expiresAt: clock.current + HOUR
  });

  const principal = await resolver.resolve(designRequest);

  assert.equal(principal.role, "admin");
  assert.equal(calls.membership.length, 1);
});

void test("cache failures fall back to the source instead of denying", async () => {
  const { resolver, failures, warnings } = createFixture();
  failures.cacheGet = true;
  failures.cacheSet = true;

  const principal = await resolver.resolve(designRequest);

  assert.equal(principal.userId, "ben");
  assert.equal(warnings.length, 2);
});

void test("an unavailable input fails closed with a retryable 503 and no principal", async () => {
  const { resolver, failures, stats } = createFixture();

  failures.identity = true;
  const identityError = await expectError(() => resolver.resolve(designRequest));
  failures.identity = false;
  failures.workspace = true;
  const workspaceError = await expectError(() => resolver.resolve(designRequest));

  for (const error of [identityError, workspaceError]) {
    assert.equal(error["code"], ERROR_CODES.principalUnavailable);
    assert.equal(error["status"], 503);
    assert.deepEqual(error["details"], { retryable: true });
  }
  assert.equal(stats.sets.length, 0);
});

void test("an input that answers with a partial shape is treated as unavailable", async () => {
  const { resolver, sessions, memberships } = createFixture();

  sessions.set("s-ben", { userId: "ben" });
  const partialSession = await expectError(() => resolver.resolve(designRequest));
  sessions.set("s-ben", activeSession("ben"));
  memberships.set("ben:design", { orgId: "org-1", role: "admin" });
  const partialMembership = await expectError(() => resolver.resolve(designRequest));

  assert.equal(partialSession["code"], ERROR_CODES.principalUnavailable);
  assert.equal(partialMembership["code"], ERROR_CODES.principalUnavailable);
});

void test("invalidation after commit makes the next request see the changed membership", async () => {
  const { resolver, invalidator, memberships, calls, stats } = createFixture();
  await resolver.resolve(designRequest);

  const result = await invalidator.invalidateAfterCommit([{ userId: "ben", workspaceId: "design" }], () => {
    memberships.set("ben:design", activeMembership("member"));
    return Promise.resolve("committed");
  });

  assert.equal(result, "committed");
  assert.deepEqual(stats.deletes, [principalCacheKey({ userId: "ben", workspaceId: "design" })]);
  assert.equal((await resolver.resolve(designRequest)).role, "member");
  assert.equal(calls.membership.length, 2);
});

void test("nothing is invalidated when the commit fails", async () => {
  const { invalidator, stats } = createFixture();

  const error = await expectError(() =>
    invalidator.invalidateAfterCommit([{ userId: "ben", workspaceId: "design" }], () =>
      Promise.reject(new Error("commit failed"))
    )
  );

  assert.equal((error as unknown as Error).message, "commit failed");
  assert.equal(stats.deletes.length, 0);
});

void test("a failed invalidation is logged and the committed result is still returned", async () => {
  const { invalidator, failures, warnings } = createFixture();
  failures.cacheDelete = true;

  const result = await invalidator.invalidateAfterCommit([{ userId: "ben", workspaceId: "design" }], () =>
    Promise.resolve("committed")
  );

  assert.equal(result, "committed");
  assert.equal(warnings.length, 1);
});
