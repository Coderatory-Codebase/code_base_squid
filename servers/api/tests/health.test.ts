import test from "node:test";
import assert from "node:assert/strict";
import type { Logger, LogContext } from "@workspace/logging";
import { createApp, createServer } from "../bootstrap/index.js";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../constants/index.js";
import type { ApiConfig } from "../types/index.js";

const httpLogs: Array<Readonly<{ message: string; context?: LogContext }>> = [];
const logger: Logger = {
  info: (message, context) => { httpLogs.push({ message, ...(context ? { context } : {}) }); },
  warn: () => undefined,
  error: () => undefined
};
const config: ApiConfig = {
  environment: "test",
  host: "127.0.0.1",
  port: 0,
  webOrigin: "http://localhost:3000",
  logLevel: "silent"
};

void test("GET /health reports a healthy API runtime", async (context) => {
  const server = createServer({ app: createApp({ config, logger }), config, logger });
  await server.start();
  context.after(async () => { await server.stop(); });
  const address = server.raw.address();
  assert.ok(address && typeof address === "object");
  const response = await fetch(`http://127.0.0.1:${String(address.port)}/health`);
  assert.equal(response.status, HTTP_STATUS.ok);
  assert.deepEqual(await response.json(), { status: "ok", service: "api", environment: "test" });
  assert.ok(httpLogs.some(({ message, context: logContext }) =>
    message === "HTTP request" && typeof logContext?.http === "string"));
});

void test("unknown routes use the API error boundary", async (context) => {
  const server = createServer({ app: createApp({ config, logger }), config, logger });
  await server.start();
  context.after(async () => { await server.stop(); });
  const address = server.raw.address();
  assert.ok(address && typeof address === "object");
  const response = await fetch(`http://127.0.0.1:${String(address.port)}/missing`);
  assert.equal(response.status, HTTP_STATUS.notFound);
  assert.deepEqual(await response.json(), {
    error: {
      code: ERROR_CODES.routeNotFound,
      message: ERROR_MESSAGES.routeNotFound,
      details: { method: "GET", path: "/missing" }
    }
  });
});
