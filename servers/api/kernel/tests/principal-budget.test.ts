import test from "node:test";
import assert from "node:assert/strict";
import {
  createPrincipalResolver,
  type IdentityPort,
  type Membership,
  type PrincipalCache,
  type WorkspacePort
} from "../index.js";

const USERS = 1_000;
const WORKSPACES = 50;
const REQUESTS_PER_USER = 20;
const BUDGET_MS = 20;

const p95 = (samples: ReadonlyArray<number>): number => {
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.ceil(sorted.length * 0.95) - 1] ?? Number.NaN;
};

// Volume fixture: 1,000 members spread over 50 workspaces, all with live sessions.
const workspaceOf = (user: number): string => `w${String(user % WORKSPACES)}`;
const membership: Membership = {
  orgId: "org-1",
  role: "member",
  guest: false,
  membershipStatus: "ACTIVE",
  workspaceStatus: "ACTIVE",
  orgStatus: "ACTIVE"
};
const expiresAt = new Date("2030-01-01T00:00:00Z");

void test("TC-S2-4 / AC-4: principal resolution stays under 20 ms at p95 for 1,000 members of 50 workspaces", async () => {
  const identity: IdentityPort = {
    principalFor: (sessionId) => Promise.resolve({ userId: sessionId.replace("s-", "u-"), status: "ACTIVE", expiresAt })
  };
  const workspace: WorkspacePort = { membershipOf: () => Promise.resolve(membership) };
  const store = new Map<string, unknown>();
  const cache: PrincipalCache = {
    get: (key) => Promise.resolve(store.get(key) ?? null),
    set: (key, value) => {
      store.set(key, value);
      return Promise.resolve();
    },
    delete: (key) => {
      store.delete(key);
      return Promise.resolve();
    }
  };
  const resolver = createPrincipalResolver({
    identity,
    workspace,
    cache,
    logger: { warn: () => undefined },
    now: () => new Date("2026-10-04T10:00:00Z")
  });

  const samples: number[] = [];
  for (let round = 0; round < REQUESTS_PER_USER; round += 1) {
    for (let user = 0; user < USERS; user += 1) {
      const start = process.hrtime.bigint();
      await resolver.resolve({ sessionId: `s-${String(user)}`, workspaceId: workspaceOf(user) });
      samples.push(Number(process.hrtime.bigint() - start) / 1e6);
    }
  }

  const result = p95(samples);
  console.log(
    `PRINCIPAL BUDGET: ${String(samples.length)} resolutions, p95 ${result.toFixed(3)} ms (budget ${String(BUDGET_MS)} ms)`
  );
  assert.equal(samples.length, USERS * REQUESTS_PER_USER);
  assert.ok(result < BUDGET_MS, `p95 ${result.toFixed(3)} ms is not under ${String(BUDGET_MS)} ms`);
});
