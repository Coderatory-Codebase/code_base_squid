import test from "node:test";
import assert from "node:assert/strict";
import { createFixedClock } from "@workspace/kernel";
import type { Logger } from "@workspace/logging";
import type { OutboxCollection, OutboxQueue, OutboxRow } from "../integrations/index.js";
import { createOutboxRelay } from "../services/index.js";

const row = (id: string): OutboxRow => ({ id, topic: "user.created", payload: { id }, createdAt: 1 });

const silentLogger: Logger = { info: (): void => undefined, warn: (): void => undefined, error: (): void => undefined };

type Harness = Readonly<{
  calls: string[];
  collection: OutboxCollection;
  queue: OutboxQueue;
  limits: number[];
}>;

const createHarness = (pending: readonly OutboxRow[], failPublishFor?: string): Harness => {
  const calls: string[] = [];
  const limits: number[] = [];
  return {
    calls,
    limits,
    collection: {
      findPending: ({ limit }): Promise<readonly OutboxRow[]> => {
        limits.push(limit);
        return Promise.resolve(pending);
      },
      markPublished: ({ ids, publishedAt }): Promise<void> => {
        calls.push(`mark:${ids.join(",")}@${String(publishedAt)}`);
        return Promise.resolve();
      }
    },
    queue: {
      publish: (outboxRow): Promise<void> => {
        calls.push(`publish:${outboxRow.id}`);
        return outboxRow.id === failPublishFor ? Promise.reject(new Error("redis unavailable")) : Promise.resolve();
      },
      close: (): Promise<void> => Promise.resolve()
    }
  };
};

void test("publishes pending rows in the order they are read, marking each before the next is published", async (): Promise<void> => {
  const harness = createHarness([row("01A"), row("01B"), row("01C")]);
  const relay = createOutboxRelay({
    collection: harness.collection,
    queue: harness.queue,
    clock: createFixedClock(1_700_000_000_000),
    logger: silentLogger,
    batchSize: 10
  });

  const published = await relay.relayPending();

  assert.equal(published, 3);
  assert.deepEqual(harness.calls, [
    "publish:01A", "mark:01A@1700000000000",
    "publish:01B", "mark:01B@1700000000000",
    "publish:01C", "mark:01C@1700000000000"
  ]);
});

void test("reads at most one batch of pending rows", async (): Promise<void> => {
  const harness = createHarness([]);
  const relay = createOutboxRelay({
    collection: harness.collection,
    queue: harness.queue,
    clock: createFixedClock(0),
    logger: silentLogger,
    batchSize: 7
  });

  assert.equal(await relay.relayPending(), 0);
  assert.deepEqual(harness.limits, [7]);
  assert.deepEqual(harness.calls, []);
});

void test("stops at the first failed publish so later rows are never published ahead of it", async (): Promise<void> => {
  const harness = createHarness([row("01A"), row("01B"), row("01C")], "01B");
  const relay = createOutboxRelay({
    collection: harness.collection,
    queue: harness.queue,
    clock: createFixedClock(5),
    logger: silentLogger,
    batchSize: 10
  });

  await assert.rejects(relay.relayPending(), /redis unavailable/);

  assert.deepEqual(harness.calls, ["publish:01A", "mark:01A@5", "publish:01B"]);
});

void test("leaves a row pending when publishing succeeded but marking failed, so it is retried first", async (): Promise<void> => {
  const harness = createHarness([row("01A"), row("01B")]);
  const relay = createOutboxRelay({
    collection: {
      ...harness.collection,
      markPublished: (): Promise<void> => Promise.reject(new Error("mongo unavailable"))
    },
    queue: harness.queue,
    clock: createFixedClock(5),
    logger: silentLogger,
    batchSize: 10
  });

  await assert.rejects(relay.relayPending(), /mongo unavailable/);

  assert.deepEqual(harness.calls, ["publish:01A"]);
});

void test("ends the batch before publishing a row once the guard says the relay may no longer continue", async (): Promise<void> => {
  const harness = createHarness([row("01A"), row("01B"), row("01C")]);
  let asked = 0;
  const relay = createOutboxRelay({
    collection: harness.collection,
    queue: harness.queue,
    clock: createFixedClock(5),
    logger: silentLogger,
    batchSize: 10,
    shouldContinue: (): Promise<boolean> => { asked += 1; return Promise.resolve(asked <= 2); }
  });

  assert.equal(await relay.relayPending(), 2);

  assert.deepEqual(harness.calls, ["publish:01A", "mark:01A@5", "publish:01B", "mark:01B@5"]);
});
