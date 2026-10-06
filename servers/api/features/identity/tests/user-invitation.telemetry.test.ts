import assert from "node:assert/strict";
import test from "node:test";
import type { Logger } from "@workspace/logging";
import { createInvitationOperationSignalEmitter } from "../user-invitation.telemetry.js";

void test("TC-02.1.02-S1-1 telemetry signal is structured, labelled, and excludes invitation secrets", () => {
  const records: Readonly<{ message: string; context: unknown }>[] = [];
  const logger: Logger = {
    info: (message, context): void => { records.push(Object.freeze({ message, context })); },
    warn: (): void => undefined,
    error: (): void => undefined
  };

  createInvitationOperationSignalEmitter(logger)({
    module: "identity",
    operation: "invite-to-workspace",
    outcome: "refused",
    workspaceId: "design",
    actorId: "sam",
    reason: "forbidden"
  });

  assert.deepEqual(records, [{
    message: "Workspace invitation operation completed.",
    context: {
      module: "identity",
      operation: "invite-to-workspace",
      outcome: "refused",
      workspaceId: "design",
      actorId: "sam",
      reason: "forbidden"
    }
  }]);
});
