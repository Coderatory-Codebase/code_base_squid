import test from "node:test";
import assert from "node:assert/strict";
import type { JobsOptions } from "bullmq";
import { createOutboxQueue, type QueueClient } from "../integrations/index.js";

type Added = Readonly<{ name: string; data: unknown; options: JobsOptions | undefined }>;

const connection = { host: "unused" };
const row = { id: "01HZZ", topic: "user.created", payload: { userId: "u1" }, createdAt: 42 };

const createClient = (): Readonly<{ client: QueueClient; added: Added[]; closed: () => boolean }> => {
  const added: Added[] = [];
  let closed = false;
  return {
    added,
    closed: (): boolean => closed,
    client: {
      add: (name, data, options): Promise<unknown> => { added.push({ name, data, options }); return Promise.resolve(); },
      close: (): Promise<void> => { closed = true; return Promise.resolve(); }
    }
  };
};

void test("publishes a row as a job named for its topic, using the row id as the job id", async (): Promise<void> => {
  const { client, added } = createClient();
  const queue = createOutboxQueue({ connection, queueName: "outbox", publishTimeoutMs: 1_000, client });

  await queue.publish(row);

  assert.deepEqual(added, [{
    name: "user.created",
    data: { id: "01HZZ", topic: "user.created", payload: { userId: "u1" }, createdAt: 42 },
    options: { jobId: "01HZZ" }
  }]);
});

void test("rejects instead of hanging when the queue never accepts the job, as when Redis is unreachable", async (): Promise<void> => {
  const client: QueueClient = {
    add: (): Promise<unknown> => new Promise<unknown>(() => undefined),
    close: (): Promise<void> => Promise.resolve()
  };
  const queue = createOutboxQueue({ connection, queueName: "outbox", publishTimeoutMs: 20, client });

  await assert.rejects(queue.publish(row), /timed out after 20ms/);
});

void test("surfaces a queue failure to the caller", async (): Promise<void> => {
  const client: QueueClient = {
    add: (): Promise<unknown> => Promise.reject(new Error("READONLY")),
    close: (): Promise<void> => Promise.resolve()
  };
  const queue = createOutboxQueue({ connection, queueName: "outbox", publishTimeoutMs: 1_000, client });

  await assert.rejects(queue.publish(row), /READONLY/);
});

void test("closes the underlying queue connection", async (): Promise<void> => {
  const { client, closed } = createClient();
  const queue = createOutboxQueue({ connection, queueName: "outbox", publishTimeoutMs: 1_000, client });

  await queue.close();

  assert.equal(closed(), true);
});
