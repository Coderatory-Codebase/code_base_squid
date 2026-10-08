import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceTransaction } from "../integrations/index.js";

const createSession = (calls: string[]) => ({
  withTransaction: async (operation: () => Promise<void>): Promise<void> => {
    calls.push("begin");
    try {
      await operation();
      calls.push("commit");
    } catch (error) {
      calls.push("abort");
      throw error;
    }
  },
  endSession: (): Promise<void> => { calls.push("end"); return Promise.resolve(); }
});

void test("runs workspace operations in one Mongo session and closes it after commit", async () => {
  const calls: string[] = [];
  const transaction = createWorkspaceTransaction(() => Promise.resolve(createSession(calls)));

  const result = await transaction(() => {
    calls.push("operation");
    return Promise.resolve("saved");
  });

  assert.equal(result, "saved");
  assert.deepEqual(calls, ["begin", "operation", "commit", "end"]);
});

void test("aborts the transaction and closes the session when a workspace operation fails", async () => {
  const calls: string[] = [];
  const transaction = createWorkspaceTransaction(() => Promise.resolve(createSession(calls)));

  await assert.rejects(transaction(() => {
    calls.push("operation");
    return Promise.reject(new Error("persistence failed"));
  }), /persistence failed/);

  assert.deepEqual(calls, ["begin", "operation", "abort", "end"]);
});
