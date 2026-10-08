import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ERROR_CODES } from "../../constants/index.js";
import {
  createCommandBus,
  createCommandFactory,
  type AllowedCommand,
  type CommandHandler,
  type PolicyEvaluator,
  type PolicyRequest,
  type Principal
} from "../index.js";

// Add each real Wave 1 command here as its route is wired to the bus.
// Public routes (for example /health) are not commands and are not listed.
const WAVE_1_COMMANDS: ReadonlyArray<string> = ["workspace.organization-settings.update"];
// "contract.probe" exercises the bus refusal contract until real commands exist.
const COMMANDS_UNDER_TEST: ReadonlyArray<string> = [...WAVE_1_COMMANDS, "contract.probe"];

const callers = {
  memberWithRights: { userId: "member-with-rights", workspaceId: "w1" },
  memberWithoutRights: { userId: "member-without-rights", workspaceId: "w1" },
  guest: { userId: "guest-1", workspaceId: "w1" },
  apiKey: { userId: "api-key-1", workspaceId: "w1" }
} as const satisfies Readonly<Record<string, Principal>>;

const refusedCallers: ReadonlyArray<readonly [string, Principal]> = [
  ["a member without rights", callers.memberWithoutRights],
  ["a guest", callers.guest],
  ["an API key", callers.apiKey]
];

/** Stand-in for the policy module: only the member with rights is allowed. */
const createPolicy = (requests: PolicyRequest[]): PolicyEvaluator => (request) => {
  requests.push(request);
  return Promise.resolve(
    request.principal.userId === callers.memberWithRights.userId
      ? { effect: "allow" }
      : { effect: "deny", reason: "no rights" }
  );
};

const createFixture = (evaluate: PolicyEvaluator) => {
  const received: AllowedCommand[] = [];
  const warnings: Array<{ message: string; meta?: Readonly<Record<string, unknown>> }> = [];
  const handler: CommandHandler = (command) => {
    received.push(command);
    return Promise.resolve("handled");
  };
  const handlers = Object.fromEntries(COMMANDS_UNDER_TEST.map((name) => [name, handler]));
  const bus = createCommandBus({
    handlers,
    logger: {
      warn: (message, meta) => {
        warnings.push(meta ? { message, meta } : { message });
      }
    }
  });
  return { bus, build: createCommandFactory({ evaluate }), received, warnings };
};

/** Runs the call and returns what it threw; fails the test if it did not throw. */
const expectError = async (work: () => Promise<unknown>): Promise<Readonly<Record<string, unknown>>> => {
  try {
    await work();
  } catch (error) {
    return error as Record<string, unknown>;
  }
  return assert.fail("expected the call to throw");
};

void describe("PACK-POLICY: every Wave 1 entry point obtains a policy decision", () => {
  for (const name of COMMANDS_UNDER_TEST) {
    void it(`${name}: a member with rights reaches the handler with principal and an allow decision (TC-1)`, async () => {
      const requests: PolicyRequest[] = [];
      const { bus, build, received } = createFixture(createPolicy(requests));

      const command = await build({ name, payload: { ok: true }, principal: callers.memberWithRights });

      assert.equal(await bus.dispatch(command), "handled");
      assert.equal(received.length, 1);
      const [handled] = received;
      assert.ok(handled);
      assert.deepEqual(handled.principal, callers.memberWithRights);
      assert.equal(handled.decision.effect, "allow");
      // The decision was really obtained from policy, for this command and this caller.
      assert.deepEqual(requests, [{ principal: callers.memberWithRights, commandName: name }]);
    });

    for (const [label, principal] of refusedCallers) {
      void it(`${name}: ${label} is refused, the handler never runs and the refusal is logged`, async () => {
        const { bus, build, received, warnings } = createFixture(createPolicy([]));

        const command = await build({ name, payload: {}, principal });
        const error = await expectError(() => bus.dispatch(command));

        assert.equal(error["code"], ERROR_CODES.policyDenied);
        assert.equal(error["status"], 403);
        assert.equal(received.length, 0);
        assert.equal(warnings.length, 1);
        const [warning] = warnings;
        assert.ok(warning);
        assert.equal(warning.meta?.["command"], name);
      });
    }

    void it(`${name}: a command built without a policy decision is refused and logged with its name (TC-2)`, async () => {
      const { bus, received, warnings } = createFixture(createPolicy([]));

      const error = await expectError(() =>
        bus.dispatch({ name, payload: {}, principal: callers.memberWithRights })
      );

      assert.equal(error["code"], ERROR_CODES.policyDecisionRequired);
      assert.equal(received.length, 0);
      const [warning] = warnings;
      assert.ok(warning);
      assert.equal(warning.meta?.["command"], name);
    });

    void it(`${name}: with the policy module stopped it fails closed with a retryable error (TC-3)`, async () => {
      const stopped: PolicyEvaluator = () => Promise.reject(new Error("connect ECONNREFUSED policy"));
      const { build, received } = createFixture(stopped);

      for (const principal of [callers.memberWithRights, ...refusedCallers.map(([, caller]) => caller)]) {
        const error = await expectError(() => build({ name, payload: {}, principal }));

        assert.equal(error["code"], ERROR_CODES.policyUnavailable);
        assert.equal(error["status"], 503);
        assert.deepEqual(error["details"], { retryable: true });
      }
      // Nothing was ever built, so nothing could reach a handler.
      assert.equal(received.length, 0);
    });
  }
});
