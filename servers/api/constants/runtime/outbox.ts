export const outboxRuntime = Object.freeze({
  queueName: "outbox",
  pollIntervalMs: 2_000,
  batchSize: 25,
  publishTimeoutMs: 5_000
});
