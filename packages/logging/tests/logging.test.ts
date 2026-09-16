import test from "node:test";
import assert from "node:assert/strict";
import type { DestinationStream } from "pino";
import { createLogger } from "../src/index.js";

const isLogEntry = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

void test("writes structured application logs through Pino", () => {
  const messages: string[] = [];
  const destination: DestinationStream = { write: (message: string) => { messages.push(message); } };
  const logger = createLogger({ service: "test-service", destination });
  logger.info("runtime ready", { port: 4000 });
  const entry: unknown = JSON.parse(messages[0] ?? "null");
  assert.deepEqual(isLogEntry(entry) ? {
    service: entry.service,
    message: entry.msg,
    port: entry.port
  } : null, { service: "test-service", message: "runtime ready", port: 4000 });
});
