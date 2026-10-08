import { createIdGenerator, type Clock } from "@workspace/kernel";
import type { Logger } from "@workspace/logging";
import {
  createMongooseOutboxCollection,
  createRedisOutboxLease,
  createOutboxQueue,
  type OutboxCollection,
  type OutboxLease,
  type OutboxQueue
} from "../integrations/index.js";
import { createOutboxBacklogMonitor, type OutboxBacklogMonitor } from "./outbox-backlog-monitor.service.js";
import { createOutboxRelay, type OutboxRelay } from "./outbox-relay.service.js";

export type OutboxRelayRunner = Readonly<{
  start: () => void;
  stop: () => Promise<void>;
}>;

export type Scheduler = Readonly<{
  schedule: (task: () => void, intervalMs: number) => () => void;
}>;

const intervalScheduler: Scheduler = Object.freeze({
  schedule: (task, intervalMs) => {
    const timer = setInterval(task, intervalMs);
    return () => { clearInterval(timer); };
  }
});

const relayLeaseName = "outbox-relay";

const describeError = (error: unknown): string => error instanceof Error ? error.message : String(error);

export type OutboxRelayRunnerDependencies = Readonly<{
  redisUrl?: string;
  queueName: string;
  pollIntervalMs: number;
  batchSize: number;
  publishTimeoutMs: number;
  // Must comfortably exceed pollIntervalMs and publishTimeoutMs; a crashed consumer's lease blocks successors for this long.
  leaseTtlMs: number;
  backlogAlertAfterMs: number;
  clock: Clock;
  logger: Logger;
  scheduler?: Scheduler;
  queue?: OutboxQueue;
  collection?: OutboxCollection;
  ownerId?: string;
  lease?: OutboxLease;
  relay?: OutboxRelay;
  backlogMonitor?: OutboxBacklogMonitor;
}>;

export const createOutboxRelayRunner = ({
  redisUrl,
  queueName,
  pollIntervalMs,
  batchSize,
  publishTimeoutMs,
  leaseTtlMs,
  backlogAlertAfterMs,
  clock,
  logger,
  scheduler = intervalScheduler,
  queue = redisUrl
    ? createOutboxQueue({ connection: { url: redisUrl }, queueName, publishTimeoutMs })
    : undefined,
  collection = queue ? createMongooseOutboxCollection() : undefined,
  ownerId = createIdGenerator({ clock })(),
  lease = redisUrl
    ? createRedisOutboxLease({ url: redisUrl, leaseName: relayLeaseName, commandTimeoutMs: publishTimeoutMs })
    : undefined,
  relay = queue && collection && lease
    ? createOutboxRelay({
      collection,
      queue,
      clock,
      logger,
      batchSize,
      shouldContinue: () => lease.acquire({ ownerId, ttlMs: leaseTtlMs })
    })
    : undefined,
  backlogMonitor = collection
    ? createOutboxBacklogMonitor({ collection, clock, logger, alertAfterMs: backlogAlertAfterMs })
    : undefined
}: OutboxRelayRunnerDependencies): OutboxRelayRunner => {
  if (!queue || !relay || !lease || !backlogMonitor) {
    logger.info("Outbox relay is not configured; starting without event relay.");
    return Object.freeze({ start: (): void => undefined, stop: (): Promise<void> => Promise.resolve() });
  }

  let cancel: (() => void) | undefined;
  let inFlight: Promise<void> | undefined;
  let leading = false;

  // Every poll takes or renews the lease, so only one instance relays at a time; the others keep polling and take over
  // once the leader releases it on shutdown or its lease expires after a crash.
  const holdLease = async (): Promise<boolean> => {
    let held = false;
    try {
      held = await lease.acquire({ ownerId, ttlMs: leaseTtlMs });
    } catch (error) {
      logger.error("Outbox relay lease check failed.", { error: describeError(error) });
    }
    if (held !== leading) {
      leading = held;
      logger.info(held ? "Outbox relay lease acquired." : "Outbox relay lease lost.", { ownerId });
    }
    return held;
  };

  // Progress lives in the outbox rows (published or pending), so a restarted consumer resumes from the oldest unpublished
  // row without keeping any cursor of its own.
  const runCycle = async (): Promise<void> => {
    if (!await holdLease()) return;
    try {
      await relay.relayPending();
    } catch (error) {
      logger.error("Outbox relay tick failed.", { error: describeError(error) });
    }
    // The backlog is checked even when the relay failed, since a stuck relay is exactly what the alert is for.
    try {
      await backlogMonitor.check();
    } catch (error) {
      logger.error("Outbox backlog check failed.", { error: describeError(error) });
    }
  };

  // A tick is skipped while the previous one is still running, so batches never overlap and order holds across ticks.
  const tick = (): void => {
    if (inFlight) return;
    inFlight = runCycle().finally((): void => { inFlight = undefined; });
  };

  return Object.freeze({
    start: (): void => {
      cancel = scheduler.schedule(tick, pollIntervalMs);
      logger.info("Outbox relay started.", { queueName, pollIntervalMs, ownerId });
    },
    stop: async (): Promise<void> => {
      cancel?.();
      await inFlight;
      try {
        await lease.release({ ownerId });
      } catch (error) {
        logger.error("Outbox relay lease release failed.", { error: describeError(error) });
      }
      await lease.close();
      await queue.close();
    }
  });
};
