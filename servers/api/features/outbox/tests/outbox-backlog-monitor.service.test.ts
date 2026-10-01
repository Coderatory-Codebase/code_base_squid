import test from "node:test";
import assert from "node:assert/strict";
import type { Clock } from "@workspace/kernel";
import type { Logger } from "@workspace/logging";
import type { OutboxCollection, OutboxRow } from "../integrations/index.js";
import { createOutboxBacklogMonitor } from "../services/index.js";

type Warning = Readonly<{ message: string; context: Record<string, unknown> | undefined }>;

type Harness = Readonly<{
  warnings: Warning[];
  setPending: (rows: readonly OutboxRow[]) => void;
  setNow: (time: number) => void;
  monitor: ReturnType<typeof createOutboxBacklogMonitor>;
}>;

const createHarness = (): Harness => {
  const warnings: Warning[] = [];
  let pending: readonly OutboxRow[] = [];
  let now = 0;
  const collection: OutboxCollection = {
    findPending: ({ limit }): Promise<readonly OutboxRow[]> => Promise.resolve(pending.slice(0, limit)),
    markPublished: (): Promise<void> => Promise.resolve()
  };
  const clock: Clock = { now: (): number => now };
  const logger: Logger = {
    info: (): void => undefined,
    warn: (message, context): void => { warnings.push({ message, context }); },
    error: (): void => undefined
  };
  return {
    warnings,
    setPending: (rows): void => { pending = rows; },
    setNow: (time): void => { now = time; },
    monitor: createOutboxBacklogMonitor({ collection, clock, logger, alertAfterMs: 60_000 })
  };
};

const rowCreatedAt = (id: string, createdAt: number): OutboxRow => ({ id, topic: "user.created", payload: {}, createdAt });

void test("reports no backlog and raises no alert when nothing is pending", async (): Promise<void> => {
  const harness = createHarness();
  harness.setNow(500_000);

  assert.equal(await harness.monitor.check(), undefined);
  assert.deepEqual(harness.warnings, []);
});

void test("does not alert while the oldest pending row is no older than 60 seconds", async (): Promise<void> => {
  const harness = createHarness();
  harness.setPending([rowCreatedAt("01A", 1_000), rowCreatedAt("01B", 50_000)]);
  harness.setNow(61_000);

  assert.equal(await harness.monitor.check(), 60_000);
  assert.deepEqual(harness.warnings, []);
});

void test("alerts once the oldest pending row is older than 60 seconds, naming the row and its age", async (): Promise<void> => {
  const harness = createHarness();
  harness.setPending([rowCreatedAt("01A", 1_000), rowCreatedAt("01B", 50_000)]);
  harness.setNow(61_001);

  assert.equal(await harness.monitor.check(), 60_001);
  assert.deepEqual(harness.warnings, [{
    message: "Outbox backlog is older than the alert threshold.",
    context: { oldestRowId: "01A", oldestAgeMs: 60_001, alertAfterMs: 60_000 }
  }]);
});

void test("repeats the alert at most once per threshold interval while the backlog persists", async (): Promise<void> => {
  const harness = createHarness();
  harness.setPending([rowCreatedAt("01A", 0)]);

  harness.setNow(61_000);
  await harness.monitor.check();
  harness.setNow(63_000);
  await harness.monitor.check();
  assert.equal(harness.warnings.length, 1);

  harness.setNow(121_000);
  await harness.monitor.check();
  assert.equal(harness.warnings.length, 2);
});

void test("alerts again for a new backlog after the previous one drained", async (): Promise<void> => {
  const harness = createHarness();
  harness.setPending([rowCreatedAt("01A", 0)]);
  harness.setNow(61_000);
  await harness.monitor.check();

  harness.setPending([]);
  harness.setNow(62_000);
  await harness.monitor.check();

  harness.setPending([rowCreatedAt("01B", 1_000)]);
  harness.setNow(62_500 + 60_000);
  await harness.monitor.check();

  assert.equal(harness.warnings.length, 2);
});
