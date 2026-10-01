import type { Clock } from "@workspace/kernel";
import type { Logger } from "@workspace/logging";
import type { OutboxCollection } from "../integrations/index.js";

export type OutboxBacklogMonitorDependencies = Readonly<{
  collection: OutboxCollection;
  clock: Clock;
  logger: Logger;
  alertAfterMs: number;
}>;

export type OutboxBacklogMonitor = Readonly<{
  // Resolves the age of the oldest unpublished row, or undefined when nothing is pending.
  check: () => Promise<number | undefined>;
}>;

// Rows are read oldest first, so the first pending row is the oldest. The alert repeats at most once per alertAfterMs
// while the backlog stays over the threshold, so a long outage does not log on every poll.
export const createOutboxBacklogMonitor = ({
  collection,
  clock,
  logger,
  alertAfterMs
}: OutboxBacklogMonitorDependencies): OutboxBacklogMonitor => {
  let lastAlertAt: number | undefined;

  return Object.freeze({
    check: async () => {
      const [oldest] = await collection.findPending({ limit: 1 });
      if (!oldest) {
        lastAlertAt = undefined;
        return undefined;
      }
      const now = clock.now();
      const oldestAgeMs = now - oldest.createdAt;
      if (oldestAgeMs > alertAfterMs && (lastAlertAt === undefined || now - lastAlertAt >= alertAfterMs)) {
        lastAlertAt = now;
        logger.warn("Outbox backlog is older than the alert threshold.", {
          oldestRowId: oldest.id,
          oldestAgeMs,
          alertAfterMs
        });
      }
      return oldestAgeMs;
    }
  });
};
