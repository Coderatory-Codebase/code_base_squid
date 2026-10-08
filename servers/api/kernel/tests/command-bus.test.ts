import test from "node:test";
import assert from "node:assert/strict";
import { ERROR_CODES } from "../../constants/index.js";
import {
  createCommandBus,
  createCommandFactory,
  type AllowedCommand,
  type PolicyEvaluator,
  type Principal
} from "../index.js";

const member: Principal = { userId: "u1", workspaceId: "w1" };

const createLogger = () => {
  const warnings: Array<{ message: string; meta?: Readonly<Record<string, unknown>> }> = [];
  return {
    warnings,
    logger: {
      warn: (message: string, meta?: Readonly<Record<string, unknown>>) => {
        warnings.push(meta ? { message, meta } : { message });
      }
    }
  };
};

const createHandlerSpy = () => {
  const state = { received: [] as AllowedCommand[] };
  const handler = (command: AllowedCommand): Promise<unknown> => {
    state.received.push(command);
    return Promise.resolve("handled");
  };
  return { state, handler };
};

const allow: PolicyEvaluator = () => Promise.resolve({ effect: "allow" });

const captureError = async (work: () => Promise<unknown>): Promise<Record<string, unknown> | undefined> => {
  try {
    await work();
  } catch (error) {
    return error as Record<string, unknown>;
  }
  return undefined;
};

void test("AC-1: a signed-in member's command reaches the handler with principal and an allow decision", async () => {
  const { state, handler } = createHandlerSpy();
  const { logger } = createLogger();
  const bus = createCommandBus({ handlers: { "task.create": handler }, logger });
  const command = await createCommandFactory({ evaluate: allow })({
    name: "task.create",
    payload: { title: "A" },
    principal: member
  });

  assert.equal(await bus.dispatch(command), "handled");
  assert.equal(state.received.length, 1);
  assert.deepEqual(state.received[0]?.principal, member);
  assert.equal(state.received[0].decision.effect, "allow");
  assert.deepEqual(state.received[0].payload, { title: "A" });
});

void test("AC-2: a command without a policy decision is refused and logged with its name", async () => {
  const { state, handler } = createHandlerSpy();
  const { logger, warnings } = createLogger();
  const bus = createCommandBus({ handlers: { "task.create": handler }, logger });

  const error = await captureError(() =>
    bus.dispatch({ name: "task.create", payload: {}, principal: member })
  );

  assert.equal(error?.["code"], ERROR_CODES.policyDecisionRequired);
  assert.equal(state.received.length, 0);
  assert.equal(warnings.length, 1);
  assert.equal(warnings[0]?.meta?.["command"], "task.create");
});

void test("a command without a principal is refused and never reaches the handler", async () => {
  const { state, handler } = createHandlerSpy();
  const { logger, warnings } = createLogger();
  const bus = createCommandBus({ handlers: { "task.create": handler }, logger });

  const error = await captureError(() =>
    bus.dispatch({ name: "task.create", payload: {}, decision: { effect: "allow" } })
  );

  assert.equal(error?.["code"], ERROR_CODES.policyDecisionRequired);
  assert.equal(state.received.length, 0);
  assert.equal(warnings[0]?.meta?.["command"], "task.create");
});

void test("a deny decision is refused and the handler does not run", async () => {
  const { state, handler } = createHandlerSpy();
  const { logger, warnings } = createLogger();
  const bus = createCommandBus({ handlers: { "task.create": handler }, logger });
  const command = await createCommandFactory({
    evaluate: () => Promise.resolve({ effect: "deny", reason: "not a member" })
  })({ name: "task.create", payload: {}, principal: member });

  const error = await captureError(() => bus.dispatch(command));

  assert.equal(error?.["code"], ERROR_CODES.policyDenied);
  assert.equal(state.received.length, 0);
  assert.equal(warnings[0]?.meta?.["command"], "task.create");
});

void test("AC-3: policy unavailable fails closed with a retryable error, never an allow", async () => {
  const create = createCommandFactory({ evaluate: () => Promise.reject(new Error("policy down")) });

  const error = await captureError(() =>
    create({ name: "task.create", payload: {}, principal: member })
  );

  assert.equal(error?.["code"], ERROR_CODES.policyUnavailable);
  assert.equal(error["status"], 503);
  assert.deepEqual(error["details"], { retryable: true });
});

void test("a policy that answers with garbage also fails closed", async () => {
  const create = createCommandFactory({
    evaluate: (() => Promise.resolve({ effect: "maybe" })) as unknown as PolicyEvaluator
  });

  const error = await captureError(() =>
    create({ name: "task.create", payload: {}, principal: member })
  );

  assert.equal(error?.["code"], ERROR_CODES.policyUnavailable);
  assert.deepEqual(error["details"], { retryable: true });
});