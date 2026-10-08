import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { ERROR_CODES } from "../../../constants/index.js";
import {
  createCommandBus,
  createCommandFactory,
  createPrincipalInvalidator,
  createPrincipalResolver,
  createScopedHandle,
  type AllowedCommand,
  type CommandHandler,
  type IdentityPort,
  type PolicyEvaluator,
  type PrincipalCache,
  type PrincipalRequest,
  type ScopedDocument,
  type SessionIdentity,
  type WorkspacePort
} from "../../../kernel/index.js";
import { createMongoScopedCollection, type DriverCollection } from "../scoped-collection.js";

type MembershipDoc = ScopedDocument & {
  readonly userId: string;
  readonly orgId: string;
  readonly role: string;
  readonly guest: boolean;
  readonly membershipStatus: string;
  readonly workspaceStatus: string;
  readonly orgStatus: string;
};
type TaskDoc = ScopedDocument & { readonly title: string };

const DATABASE = "acceptance_01_4_04_s2";
const NOW = Date.parse("2026-10-04T10:00:00Z");
const MINUTE = 60_000;
const HOUR = 3_600_000;

const designRequest: PrincipalRequest = { sessionId: "s-ben", workspaceId: "design" };

const membershipDoc = (
  id: string,
  workspaceId: string,
  userId: string,
  overrides: Readonly<Record<string, unknown>> = {}
) => ({
  _id: id,
  workspaceId,
  version: 1,
  deletedAt: null,
  userId,
  orgId: "org-1",
  role: "admin",
  guest: false,
  membershipStatus: "ACTIVE",
  workspaceStatus: "ACTIVE",
  orgStatus: "ACTIVE",
  ...overrides
});

/** Counts every call that reaches the driver. */
const counting = (native: unknown) => {
  const real = native as DriverCollection;
  const probe = { calls: 0 };
  const driver: DriverCollection = {
    find: (filter) => {
      probe.calls += 1;
      return real.find(filter);
    },
    insertOne: (document) => {
      probe.calls += 1;
      return real.insertOne(document);
    },
    updateOne: (filter, update) => {
      probe.calls += 1;
      return real.updateOne(filter, update);
    }
  };
  return { driver, probe };
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

const percentile = (samples: ReadonlyArray<number>, quantile: number): number => {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * quantile) - 1] ?? Number.NaN;
};

let replSet: MongoMemoryReplSet;
let connection: mongoose.Connection;

const allow: PolicyEvaluator = () => Promise.resolve({ effect: "allow" });

// Fresh, seeded collections per criterion so the checks cannot influence each other.
const setup = async (name: string) => {
  const db = connection.getClient().db(DATABASE);
  const membershipsNative = db.collection(`${name}_memberships`);
  const tasksNative = db.collection(`${name}_tasks`);

  await membershipsNative.insertMany([
    membershipDoc("m-ben-design", "design", "ben"),
    membershipDoc("m-ben-legacy", "legacy", "ben", { workspaceStatus: "ARCHIVED" }),
    membershipDoc("m-carl-design", "design", "carl", { role: "member", membershipStatus: "REMOVED" }),
    membershipDoc("m-ana-marketing", "marketing", "ana")
  ] as never);
  await tasksNative.insertMany([
    { _id: "d1", workspaceId: "design", version: 1, deletedAt: null, title: "Design task" },
    { _id: "k1", workspaceId: "marketing", version: 1, deletedAt: null, title: "Marketing task" }
  ] as never);

  const memberships = counting(membershipsNative);
  const tasks = counting(tasksNative);
  const membershipsFor = createScopedHandle<MembershipDoc>({
    collection: createMongoScopedCollection<MembershipDoc>(memberships.driver)
  });
  const tasksFor = createScopedHandle<TaskDoc>({ collection: createMongoScopedCollection<TaskDoc>(tasks.driver) });

  // Identity is not built yet: sessions are in memory.
  const sessions = new Map<string, SessionIdentity>([
    ["s-ben", { userId: "ben", status: "ACTIVE", expiresAt: new Date(NOW + HOUR) }],
    ["s-carl", { userId: "carl", status: "ACTIVE", expiresAt: new Date(NOW + HOUR) }]
  ]);
  const identity: IdentityPort = {
    principalFor: (sessionId) => Promise.resolve(sessions.get(sessionId) ?? null)
  };

  // Workspace.membershipOf, answered through the data gateway on the real database (ARC-003).
  const workspace: WorkspacePort = {
    membershipOf: async ({ userId, workspaceId }) => {
      const [doc] = await membershipsFor({ workspaceId }).find({ userId });
      if (!doc) return null;
      return {
        orgId: doc.orgId,
        role: doc.role,
        guest: doc.guest,
        membershipStatus: doc.membershipStatus,
        workspaceStatus: doc.workspaceStatus,
        orgStatus: doc.orgStatus
      };
    }
  };

  // Redis is not built yet: the cache is in memory.
  const store = new Map<string, unknown>();
  const cache: PrincipalCache = {
    get: (key) => Promise.resolve(store.get(key) ?? null),
    set: (key, value) => {
      store.set(key, value);
      return Promise.resolve();
    },
    delete: (key) => {
      store.delete(key);
      return Promise.resolve();
    }
  };

  const logger = { warn: () => undefined };
  const resolver = createPrincipalResolver({ identity, workspace, cache, logger, now: () => new Date(NOW) });
  const invalidator = createPrincipalInvalidator({ cache, logger });

  // The command that runs after a principal exists: it reads the caller's own workspace tasks.
  const received: AllowedCommand[] = [];
  const handler: CommandHandler = (command) => {
    received.push(command);
    return tasksFor({ workspaceId: command.principal.workspaceId }).find();
  };
  const bus = createCommandBus({ handlers: { "task.list": handler }, logger });
  const buildCommand = createCommandFactory({ evaluate: allow });

  // The pipeline: session -> principal -> command with a policy decision -> bus -> handler.
  const request = async (input: PrincipalRequest) => {
    const principal = await resolver.resolve(input);
    const command = await buildCommand({ name: "task.list", payload: {}, principal });
    return { principal, result: await bus.dispatch(command) };
  };

  return { request, sessions, store, received, memberships, tasks, membershipsFor, invalidator };
};

void describe("01.4.04-S2 acceptance: a request becomes a principal only from a live session and an active membership", () => {
  before(async () => {
    replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    connection = await mongoose.createConnection(replSet.getUri()).asPromise();
  }, { timeout: 180_000 });

  after(async () => {
    await connection.close();
    await replSet.stop();
  });

  void it("AC-1: an active session and an admin membership give Ben a complete principal that reaches the handler", async () => {
    const { request, received } = await setup("ac1");

    const { principal, result } = await request(designRequest);

    assert.deepEqual(principal, {
      userId: "ben",
      orgId: "org-1",
      workspaceId: "design",
      role: "admin",
      guest: false,
      membershipStatus: "ACTIVE",
      workspaceStatus: "ACTIVE",
      orgStatus: "ACTIVE"
    });
    assert.equal(received.length, 1);
    const [handled] = received;
    assert.ok(handled);
    assert.deepEqual(handled.principal, principal);
    assert.equal(handled.decision.effect, "allow");
    assert.deepEqual((result as ReadonlyArray<TaskDoc>).map((task) => task._id), ["d1"]);
  });

  void it("AC-2: a session that expired a minute ago is unauthenticated, no principal is built and no command runs", async () => {
    const { request, sessions, received, memberships, tasks, store } = await setup("ac2");
    sessions.set("s-ben", { userId: "ben", status: "ACTIVE", expiresAt: new Date(NOW - MINUTE) });

    const error = await expectError(() => request(designRequest));

    assert.equal(error["code"], ERROR_CODES.unauthenticated);
    assert.equal(error["status"], 401);
    assert.equal(received.length, 0);
    assert.equal(memberships.probe.calls, 0);
    assert.equal(tasks.probe.calls, 0);
    assert.equal(store.size, 0);
  });

  void it("AC-2: a warm cache never keeps a revoked session alive", async () => {
    const { request, sessions, received, store } = await setup("ac2-warm");
    await request(designRequest);
    assert.equal(store.size, 1);
    sessions.set("s-ben", { userId: "ben", status: "REVOKED", expiresAt: new Date(NOW + HOUR) });

    const error = await expectError(() => request(designRequest));

    assert.equal(error["code"], ERROR_CODES.unauthenticated);
    assert.equal(received.length, 1);
  });

  void it("AC-3: a member of Design only gets no principal for Marketing, is forbidden and nothing from Marketing is read", async () => {
    const { request, received, tasks, store } = await setup("ac3");

    const error = await expectError(() => request({ sessionId: "s-ben", workspaceId: "marketing" }));

    assert.equal(error["code"], ERROR_CODES.forbidden);
    assert.equal(error["status"], 403);
    assert.equal(received.length, 0);
    assert.equal(tasks.probe.calls, 0);
    assert.equal(store.size, 0);
  });

  void it("removed member: once the removal commits, a warm cache cannot keep serving the principal", async () => {
    const { request, received, tasks, store, membershipsFor, invalidator } = await setup("removed");
    await request(designRequest);
    assert.equal(received.length, 1);

    const removal = await invalidator.invalidateAfterCommit([{ userId: "ben", workspaceId: "design" }], () =>
      membershipsFor({ workspaceId: "design" }).softDelete("m-ben-design", 1, "removed")
    );
    assert.deepEqual(removal, { status: "ok" });
    const readsBefore = tasks.probe.calls;

    const error = await expectError(() => request(designRequest));

    assert.equal(error["code"], ERROR_CODES.forbidden);
    assert.equal(received.length, 1);
    assert.equal(tasks.probe.calls, readsBefore);
    assert.equal(store.size, 0);
  });

  void it("removed member: a membership whose status is REMOVED is forbidden and no command runs", async () => {
    const { request, received, tasks, store } = await setup("removed-status");

    const error = await expectError(() => request({ sessionId: "s-carl", workspaceId: "design" }));

    assert.equal(error["code"], ERROR_CODES.forbidden);
    assert.equal(received.length, 0);
    assert.equal(tasks.probe.calls, 0);
    assert.equal(store.size, 0);
  });

  void it("archived workspace: the principal carries ARCHIVED so policy can refuse, never a silent ACTIVE", async () => {
    const { request } = await setup("archived");

    const { principal } = await request({ sessionId: "s-ben", workspaceId: "legacy" });

    assert.equal(principal.workspaceId, "legacy");
    assert.equal(principal.membershipStatus, "ACTIVE");
    assert.equal(principal.workspaceStatus, "ARCHIVED");
  });
});

void describe("01.4.04-S2 acceptance AC-4 (scaled): 1,000 members of 50 workspaces", () => {
  void it("resolution stays under 20 ms at p95 (10,000 resolutions, in-memory ports; the 10-minute run is deferred)", async () => {
    const USERS = 1_000;
    const WORKSPACES = 50;
    const ROUNDS = 10;
    const BUDGET_MS = 20;
    const store = new Map<string, unknown>();
    const resolver = createPrincipalResolver({
      identity: {
        principalFor: (sessionId) =>
          Promise.resolve({
            userId: sessionId.replace("s-", "u-"),
            status: "ACTIVE",
            expiresAt: new Date("2030-01-01T00:00:00Z")
          })
      },
      workspace: {
        membershipOf: () =>
          Promise.resolve({
            orgId: "org-1",
            role: "member",
            guest: false,
            membershipStatus: "ACTIVE",
            workspaceStatus: "ACTIVE",
            orgStatus: "ACTIVE"
          })
      },
      cache: {
        get: (key) => Promise.resolve(store.get(key) ?? null),
        set: (key, value) => {
          store.set(key, value);
          return Promise.resolve();
        },
        delete: (key) => {
          store.delete(key);
          return Promise.resolve();
        }
      },
      logger: { warn: () => undefined },
      now: () => new Date(NOW)
    });

    const samples: number[] = [];
    for (let round = 0; round < ROUNDS; round += 1) {
      for (let user = 0; user < USERS; user += 1) {
        const start = process.hrtime.bigint();
        await resolver.resolve({ sessionId: `s-${String(user)}`, workspaceId: `w${String(user % WORKSPACES)}` });
        samples.push(Number(process.hrtime.bigint() - start) / 1e6);
      }
    }

    const p95 = percentile(samples, 0.95);
    console.log(`AC-4 (scaled): ${String(samples.length)} resolutions, p95 ${p95.toFixed(3)} ms (budget ${String(BUDGET_MS)} ms)`);
    assert.equal(samples.length, USERS * ROUNDS);
    assert.ok(p95 < BUDGET_MS, `p95 ${p95.toFixed(3)} ms is not under ${String(BUDGET_MS)} ms`);
  });
});