import type { Clock } from "@workspace/kernel";
import type { Logger } from "@workspace/logging";
import type { OutboxCollection, OutboxQueue } from "../integrations/index.js";

export type OutboxRelayDependencies = Readonly<{
  collection: OutboxCollection;
  queue: OutboxQueue;
  clock: Clock;
  logger: Logger;
  batchSize: number;
}>;

export type OutboxRelay = Readonly<{
  relayPending: () => Promise<number>;
}>;

// Rows are published one at a time, oldest first, and each is marked published before the next is attempted.
// A failure stops the batch, so later rows are never published ahead of an earlier one that is still pending.
export const createOutboxRelay = ({
  collection,
  queue,
  clock,
  logger,
  batchSize
}: OutboxRelayDependencies): OutboxRelay => Object.freeze({
  relayPending: async () => {
    const rows = await collection.findPending({ limit: batchSize });
    let published = 0;
    for (const row of rows) {
      await queue.publish(row);
      await collection.markPublished({ ids: [row.id], publishedAt: clock.now() });
      published += 1;
    }
    if (published > 0) logger.info("Outbox rows published.", { published });
    return published;
  }
});
