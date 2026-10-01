import type { Clock } from "@workspace/kernel";
import type { Logger } from "@workspace/logging";
import { createMongooseOutboxCollection, createOutboxQueue, type OutboxQueue } from "../integrations/index.js";
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

export type OutboxRelayRunnerDependencies = Readonly<{
  redisUrl?: string;
  queueName: string;
  pollIntervalMs: number;
  batchSize: number;
  publishTimeoutMs: number;
  clock: Clock;
  logger: Logger;
  scheduler?: Scheduler;
  queue?: OutboxQueue;
  relay?: OutboxRelay;
}>;

export const createOutboxRelayRunner = ({
  redisUrl,
  queueName,
  pollIntervalMs,
  batchSize,
  publishTimeoutMs,
  clock,
  logger,
  scheduler = intervalScheduler,
  queue = redisUrl
    ? createOutboxQueue({ connection: { url: redisUrl }, queueName, publishTimeoutMs })
    : undefined,
  relay = queue
    ? createOutboxRelay({ collection: createMongooseOutboxCollection(), queue, clock, logger, batchSize })
    : undefined
}: OutboxRelayRunnerDependencies): OutboxRelayRunner => {
  if (!queue || !relay) {
    logger.info("Outbox relay is not configured; starting without event relay.");
    return Object.freeze({ start: (): void => undefined, stop: (): Promise<void> => Promise.resolve() });
  }

  let cancel: (() => void) | undefined;
  let inFlight: Promise<void> | undefined;

  // A tick is skipped while the previous one is still running, so batches never overlap and order holds across ticks.
  const tick = (): void => {
    if (inFlight) return;
    inFlight = relay.relayPending()
      .then((): void => undefined)
      .catch((error: unknown): void => {
        logger.error("Outbox relay tick failed.", { error: error instanceof Error ? error.message : String(error) });
      })
      .finally((): void => { inFlight = undefined; });
  };

  return Object.freeze({
    start: (): void => {
      cancel = scheduler.schedule(tick, pollIntervalMs);
      logger.info("Outbox relay started.", { queueName, pollIntervalMs });
    },
    stop: async (): Promise<void> => {
      cancel?.();
      await inFlight;
      await queue.close();
    }
  });
};
