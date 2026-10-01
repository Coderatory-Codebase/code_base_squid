import test from "node:test";
import assert from "node:assert/strict";
import type { Clock } from "@workspace/kernel";
import type { Logger } from "@workspace/logging";
import type { OutboxCollection, OutboxLease, OutboxQueue, OutboxRow } from "../integrations/index.js";
import { createOutboxRelayRunner, type OutboxRelayRunner } from "../services/index.js";

// These scenarios run complete runners against shared in-memory stand-ins for the outbox collection, the lease document
// and the queue, so they show how several consumers (or one consumer across restarts) behave together.

const flush = (): Promise<void> => new Promise((resolve) => { setImmediate(resolve); });

type World = Readonly<{
  clock: Clock;
  setNow: (time: number) => void;
  collection: OutboxCollection;
  queue: OutboxQueue;
  lease: OutboxLease;
  published: string[];
  failPublishFor: Set<string>;
}>;

const createWorld = (ids: readonly string[]): World => {
  let now = 0;
  const pending = new Set(ids);
  const published: string[] = [];
  const failPublishFor = new Set<string>();
  let held: { ownerId: string; expiresAt: number } | undefined;

  return {
    clock: { now: (): number => now },
    setNow: (time): void => { now = time; },
    published,
    failPublishFor,
    collection: {
      findPending: ({ limit }): Promise<readonly OutboxRow[]> => Promise.resolve(
        ids.filter((id) => pending.has(id)).slice(0, limit)
          .map((id): OutboxRow => ({ id, topic: "user.created", payload: { id }, createdAt: 0 }))
      ),
      markPublished: ({ ids: publishedIds }): Promise<void> => {
        for (const id of publishedIds) pending.delete(id);
        return Promise.resolve();
      }
    },
    queue: {
      publish: (row): Promise<void> => {
        if (failPublishFor.has(row.id)) return Promise.reject(new Error("redis unavailable"));
        published.push(row.id);
        return Promise.resolve();
      },
      close: (): Promise<void> => Promise.resolve()
    },
    // Mirrors the MongoDB lease: take it when free, expired or already ours; otherwise it is held elsewhere.
    lease: {
      acquire: ({ ownerId, ttlMs, now: at }): Promise<boolean> => {
        if (held && held.ownerId !== ownerId && held.expiresAt > at) return Promise.resolve(false);
        held = { ownerId, expiresAt: at + ttlMs };
        return Promise.resolve(true);
      },
      release: ({ ownerId }): Promise<void> => {
        if (held?.ownerId === ownerId) held = undefined;
        return Promise.resolve();
      }
    }
  };
};

type Consumer = Readonly<{
  runner: OutboxRelayRunner;
  tick: () => Promise<void>;
  logs: string[];
  warnings: Array<Record<string, unknown> | undefined>;
}>;

const createConsumer = (
  world: World,
  ownerId: string,
  options: Readonly<{ batchSize: number; lease?: OutboxLease }>
): Consumer => {
  const logs: string[] = [];
  const warnings: Array<Record<string, unknown> | undefined> = [];
  let task: () => void = (): void => undefined;
  const logger: Logger = {
    info: (message): void => { logs.push(`info:${message}`); },
    warn: (message, context): void => { logs.push(`warn:${message}`); warnings.push(context); },
    error: (message, context): void => { logs.push(`error:${message}:${String(context?.error)}`); }
  };
  const runner = createOutboxRelayRunner({
    queueName: "outbox",
    pollIntervalMs: 2_000,
    batchSize: options.batchSize,
    publishTimeoutMs: 5_000,
    leaseTtlMs: 30_000,
    backlogAlertAfterMs: 60_000,
    clock: world.clock,
    logger,
    ownerId,
    queue: world.queue,
    collection: world.collection,
    lease: options.lease ?? world.lease,
    scheduler: { schedule: (scheduled): () => void => { task = scheduled; return (): void => undefined; } }
  });
  runner.start();
  return { runner, tick: async (): Promise<void> => { task(); await flush(); }, logs, warnings };
};

void test("only one of several consumers relays while all of them poll, and every row is published once", async (): Promise<void> => {
  const world = createWorld(["01A", "01B", "01C", "01D", "01E"]);
  const first = createConsumer(world, "first", { batchSize: 10 });
  const second = createConsumer(world, "second", { batchSize: 10 });

  await first.tick();
  await second.tick();
  await second.tick();
  await first.tick();

  assert.deepEqual(world.published, ["01A", "01B", "01C", "01D", "01E"]);
  assert.ok(first.logs.includes("info:Outbox relay lease acquired."));
  assert.ok(!second.logs.includes("info:Outbox relay lease acquired."));
});

void test("a standby consumer takes over at once when the leader stops gracefully, without republishing", async (): Promise<void> => {
  const world = createWorld(["01A", "01B", "01C", "01D", "01E"]);
  const leader = createConsumer(world, "leader", { batchSize: 2 });
  const standby = createConsumer(world, "standby", { batchSize: 2 });

  await leader.tick();
  await standby.tick();
  assert.deepEqual(world.published, ["01A", "01B"]);

  await leader.runner.stop();
  await standby.tick();
  await standby.tick();

  assert.deepEqual(world.published, ["01A", "01B", "01C", "01D", "01E"]);
  assert.ok(standby.logs.includes("info:Outbox relay lease acquired."));
});

void test("after a crash the standby waits for the leader's lease to expire, then continues", async (): Promise<void> => {
  const world = createWorld(["01A", "01B", "01C", "01D"]);
  const crashed = createConsumer(world, "crashed", { batchSize: 2 });
  const standby = createConsumer(world, "standby", { batchSize: 2 });

  await crashed.tick();
  assert.deepEqual(world.published, ["01A", "01B"]);

  world.setNow(29_999);
  await standby.tick();
  assert.deepEqual(world.published, ["01A", "01B"]);

  world.setNow(30_000);
  await standby.tick();
  assert.deepEqual(world.published, ["01A", "01B", "01C", "01D"]);
});

void test("a restarted consumer continues from the first unpublished row instead of starting over", async (): Promise<void> => {
  const world = createWorld(["01A", "01B", "01C", "01D", "01E"]);
  const beforeRestart = createConsumer(world, "before-restart", { batchSize: 2 });
  await beforeRestart.tick();
  await beforeRestart.runner.stop();
  assert.deepEqual(world.published, ["01A", "01B"]);

  const afterRestart = createConsumer(world, "after-restart", { batchSize: 2 });
  await afterRestart.tick();
  await afterRestart.tick();

  assert.deepEqual(world.published, ["01A", "01B", "01C", "01D", "01E"]);
});

void test("a consumer that crashed mid-batch is replaced by one that resumes at the row that failed", async (): Promise<void> => {
  const world = createWorld(["01A", "01B", "01C", "01D", "01E"]);
  world.failPublishFor.add("01C");
  const crashed = createConsumer(world, "crashed", { batchSize: 10 });
  await crashed.tick();
  assert.deepEqual(world.published, ["01A", "01B"]);
  assert.ok(crashed.logs.includes("error:Outbox relay tick failed.:redis unavailable"));

  world.failPublishFor.clear();
  world.setNow(30_000);
  const replacement = createConsumer(world, "replacement", { batchSize: 10 });
  await replacement.tick();

  assert.deepEqual(world.published, ["01A", "01B", "01C", "01D", "01E"]);
});

void test("a leader that loses its lease part-way through a batch stops publishing", async (): Promise<void> => {
  const world = createWorld(["01A", "01B", "01C"]);
  // Held when the poll starts and before the first row, then taken over before the second row.
  const answers = [true, true];
  const lease: OutboxLease = {
    acquire: (): Promise<boolean> => Promise.resolve(answers.shift() ?? false),
    release: (): Promise<void> => Promise.resolve()
  };
  const consumer = createConsumer(world, "slow", { batchSize: 10, lease });

  await consumer.tick();
  assert.deepEqual(world.published, ["01A"]);
  assert.ok(consumer.logs.includes("info:Outbox relay lease acquired."));

  await consumer.tick();
  assert.deepEqual(world.published, ["01A"]);
  assert.ok(consumer.logs.includes("info:Outbox relay lease lost."));
});

void test("treats a failed lease check as not leading, relays nothing, and logs the failure", async (): Promise<void> => {
  const world = createWorld(["01A"]);
  const lease: OutboxLease = {
    acquire: (): Promise<boolean> => Promise.reject(new Error("mongo unavailable")),
    release: (): Promise<void> => Promise.resolve()
  };
  const consumer = createConsumer(world, "blind", { batchSize: 10, lease });

  await consumer.tick();

  assert.deepEqual(world.published, []);
  assert.ok(consumer.logs.includes("error:Outbox relay lease check failed.:mongo unavailable"));
});

void test("alerts when the backlog is older than 60 seconds even though the relay is failing", async (): Promise<void> => {
  const world = createWorld(["01A", "01B"]);
  world.failPublishFor.add("01A");
  const consumer = createConsumer(world, "stuck", { batchSize: 10 });

  world.setNow(59_000);
  await consumer.tick();
  assert.ok(!consumer.logs.includes("warn:Outbox backlog is older than the alert threshold."));

  world.setNow(61_000);
  await consumer.tick();

  assert.ok(consumer.logs.includes("warn:Outbox backlog is older than the alert threshold."));
  assert.deepEqual(consumer.warnings, [{ oldestRowId: "01A", oldestAgeMs: 61_000, alertAfterMs: 60_000 }]);
});

void test("does not alert when the relay keeps up, however old the rows were when it caught up", async (): Promise<void> => {
  const world = createWorld(["01A", "01B"]);
  const consumer = createConsumer(world, "healthy", { batchSize: 10 });

  world.setNow(61_000);
  await consumer.tick();

  assert.deepEqual(world.published, ["01A", "01B"]);
  assert.deepEqual(consumer.warnings, []);
});
