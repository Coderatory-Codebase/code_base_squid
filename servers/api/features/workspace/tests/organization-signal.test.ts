import test from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import { createOrganizationRequestSignal } from "../routes/organization-signal.js";

void test("organization request signal includes workspace metadata and outcome for failed requests", () => {
  const calls: Array<{ message: string; context: Record<string, unknown> }> = [];
  const logger = {
    info: (message: string, context: Record<string, unknown> = {}): void => {
      calls.push({ message, context });
    },
    warn: (): void => undefined,
    error: (): void => undefined
  };

  type MockResponse = { statusCode: number; once: (event: string, handler: () => void) => MockResponse; finishHandler?: () => void };
  const response: MockResponse = {
    statusCode: 200,
    once: (event: string, handler: () => void): MockResponse => {
      if (event === "finish") {
        response.finishHandler = handler;
      }
      return response;
    }
  };

  const request: Pick<Request, "method" | "path" | "query"> = {
    method: "GET",
    path: "/organizations",
    query: {}
  };
  const middleware = createOrganizationRequestSignal({ logger });
  middleware(request, response as unknown as Pick<Response, "statusCode" | "once">, () => undefined);

  response.statusCode = 401;
  assert.ok(response.finishHandler);
  response.finishHandler();

  assert.equal(calls.length, 1);
  const firstCall = calls[0];
  assert.ok(firstCall !== undefined);
  assert.equal(firstCall.message, "organization.request.signal");
  assert.equal(firstCall.context.workspace, "Platform");
  assert.equal(firstCall.context.module, "workspace");
  assert.equal(firstCall.context.operation, "listOrganizations");
  assert.equal(firstCall.context.statusCode, 401);
  assert.equal(firstCall.context.outcome, "error");
  assert.equal(firstCall.context.pageOffset, 0);
  assert.equal(typeof firstCall.context.durationMs, "number");
  assert.ok(Number(firstCall.context.durationMs) >= 0);
});
