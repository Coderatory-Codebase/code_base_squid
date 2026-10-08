import { Queue, type ConnectionOptions, type JobsOptions } from "bullmq";
import type { OutboxRow } from "./outbox-collection.integration.js";

export type QueueClient = Readonly<{
  add: (name: string, data: unknown, options?: JobsOptions) => Promise<unknown>;
  close: () => Promise<void>;
}>;

export type OutboxQueue = Readonly<{
  publish: (row: OutboxRow) => Promise<void>;
  close: () => Promise<void>;
}>;

type OutboxQueueDependencies = Readonly<{
  connection: ConnectionOptions;
  queueName: string;
  publishTimeoutMs: number;
  client?: QueueClient;
}>;

const createBullMqClient = (connection: ConnectionOptions, queueName: string): QueueClient => {
  const queue = new Queue(queueName, { connection });
  return Object.freeze({
    add: (name, data, options) => queue.add(name, data, options),
    close: () => queue.close()
  });
};

// BullMQ keeps retrying while Redis is unreachable and never settles add(), which would wedge the relay.
const withTimeout = <T>(operation: Promise<T>, timeoutMs: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => { reject(new Error(`Publishing to the outbox queue timed out after ${String(timeoutMs)}ms.`)); }, timeoutMs);
    operation.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error: unknown) => { clearTimeout(timer); reject(error instanceof Error ? error : new Error(String(error))); }
    );
  });

export const createOutboxQueue = ({
  connection,
  queueName,
  publishTimeoutMs,
  client = createBullMqClient(connection, queueName)
}: OutboxQueueDependencies): OutboxQueue => Object.freeze({
  // The row id is the job id, so re-publishing a row (after a timeout or a failed status update) cannot enqueue a duplicate job.
  publish: async (row) => {
    await withTimeout(
      client.add(
        row.topic,
        { id: row.id, topic: row.topic, payload: row.payload, createdAt: row.createdAt },
        { jobId: row.id }
      ),
      publishTimeoutMs
    );
  },
  close: () => client.close()
});
