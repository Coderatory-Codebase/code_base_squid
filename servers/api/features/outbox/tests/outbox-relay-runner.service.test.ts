import test from "node:test";
import assert from "node:assert/strict";
import { createFixedClock } from "@workspace/kernel";
import type { Logger } from "@workspace/logging";
import type { OutboxLease, OutboxQueue } from "../integrations/index.js";
import { createOutboxRelayRunner, type OutboxBacklogMonitor, type OutboxRelay, type Scheduler } from "../services/index.js";

type Harness = Readonly<{
  calls: string[];
  logs: string[];
  tick: () => void;
  scheduler: Scheduler;
  queue: OutboxQueue;
  lease: OutboxLease;
  backlogMonitor: OutboxBacklogMonitor;
  logger: Logger;
}>;

const createHarness = (): Harness => {
  const calls: string[] = [];
  const logs: string[] = [];
  const ticks: Array<() => void> = [];
  return {
    calls,
    logs,
    tick: (): void => { for (const task of ticks) task(); },
    scheduler: {
      schedule: (task, intervalMs): () => void => {
        calls.push(`schedule:${String(intervalMs)}`);
        ticks.push(task);
        return (): void => { calls.push("cancel"); };
      }
    },
    queue: {
      publish: (): Promise<void> => Promise.resolve(),
      close: (): Promise<void> => { calls.push("queue:close"); return Promise.resolve(); }
    },
    lease: {
      acquire: (): Promise<boolean> => Promise.resolve(true),
      release: (): Promise<void> => { calls.push("lease:release"); return Promise.resolve(); }
    },
    backlogMonitor: { check: (): Promise<number | undefined> => Promise.resolve(undefined) },
    logger: {
      info: (message): void => { logs.push(`info:${message}`); },
      warn: (): void => undefined,
      error: (message, context): void => { logs.push(`error:${message}:${String(context?.error)}`); }
    }
  };
};

const baseOptions = {
  queueName: "outbox",
  pollIntervalMs: 1_000,
  batchSize: 10,
  publishTimeoutMs: 1_000,
  leaseTtlMs: 30_000,
  backlogAlertAfterMs: 60_000,
  clock: createFixedClock(0)
};

const flush = (): Promise<void> => new Promise((resolve) => { setImmediate(resolve); });

void test("starts without a relay when Redis is not configured", async (): Promise<void> => {
  const harness = createHarness();
  const runner = createOutboxRelayRunner({ ...baseOptions, logger: harness.logger, scheduler: harness.scheduler });

  runner.start();
  await runner.stop();

  assert.deepEqual(harness.logs, ["info:Outbox relay is not configured; starting without event relay."]);
  assert.deepEqual(harness.calls, []);
});

void test("relays pending rows on every scheduled tick", async (): Promise<void> => {
  const harness = createHarness();
  let relayed = 0;
  const relay: OutboxRelay = { relayPending: (): Promise<number> => { relayed += 1; return Promise.resolve(0); } };
  const runner = createOutboxRelayRunner({
    ...baseOptions, logger: harness.logger, scheduler: harness.scheduler, queue: harness.queue, lease: harness.lease, backlogMonitor: harness.backlogMonitor, relay
  });

  runner.start();
  harness.tick();
  await flush();
  harness.tick();
  await flush();

  assert.equal(relayed, 2);
  assert.deepEqual(harness.calls, ["schedule:1000"]);
});

void test("skips a tick while the previous batch is still being relayed so batches never overlap", async (): Promise<void> => {
  const harness = createHarness();
  let relayed = 0;
  let finishBatch: () => void = (): void => undefined;
  const relay: OutboxRelay = {
    relayPending: (): Promise<number> => {
      relayed += 1;
      return new Promise((resolve) => { finishBatch = (): void => { resolve(1); }; });
    }
  };
  const runner = createOutboxRelayRunner({
    ...baseOptions, logger: harness.logger, scheduler: harness.scheduler, queue: harness.queue, lease: harness.lease, backlogMonitor: harness.backlogMonitor, relay
  });

  runner.start();
  harness.tick();
  harness.tick();
  await flush();
  assert.equal(relayed, 1);

  finishBatch();
  await flush();
  harness.tick();
  await flush();
  assert.equal(relayed, 2);
});

void test("logs a failed batch and keeps relaying on later ticks", async (): Promise<void> => {
  const harness = createHarness();
  let attempts = 0;
  const relay: OutboxRelay = {
    relayPending: (): Promise<number> => {
      attempts += 1;
      return attempts === 1 ? Promise.reject(new Error("redis unavailable")) : Promise.resolve(1);
    }
  };
  const runner = createOutboxRelayRunner({
    ...baseOptions, logger: harness.logger, scheduler: harness.scheduler, queue: harness.queue, lease: harness.lease, backlogMonitor: harness.backlogMonitor, relay
  });

  runner.start();
  harness.tick();
  await flush();
  harness.tick();
  await flush();

  assert.equal(attempts, 2);
  assert.ok(harness.logs.includes("error:Outbox relay tick failed.:redis unavailable"));
});

void test("stop cancels the schedule, waits for the in-flight batch, releases the lease, then closes the queue", async (): Promise<void> => {
  const harness = createHarness();
  let finishBatch: () => void = (): void => undefined;
  const relay: OutboxRelay = {
    relayPending: (): Promise<number> => new Promise((resolve) => {
      finishBatch = (): void => { harness.calls.push("batch:done"); resolve(1); };
    })
  };
  const runner = createOutboxRelayRunner({
    ...baseOptions, logger: harness.logger, scheduler: harness.scheduler, queue: harness.queue, lease: harness.lease, backlogMonitor: harness.backlogMonitor, relay
  });

  runner.start();
  harness.tick();
  await flush();
  const stopping = runner.stop();
  await flush();
  assert.ok(!harness.calls.includes("queue:close"));

  finishBatch();
  await stopping;

  assert.deepEqual(harness.calls, ["schedule:1000", "cancel", "batch:done", "lease:release", "queue:close"]);
});
