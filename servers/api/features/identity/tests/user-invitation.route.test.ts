import assert from "node:assert/strict";
import test from "node:test";
import type { Request, Response, NextFunction } from "express";
import type { Logger } from "@workspace/logging";
import type { PolicyEvaluator } from "../../../kernel/index.js";
import { createIdentityPolicyEvaluator, createUserInvitationListController, createUserInvitationQueryService, type UserInvitation } from "../index.js";

const logger: Logger = {
  info: (): void => undefined,
  warn: (): void => undefined,
  error: (): void => undefined
};

const invitations: readonly UserInvitation[] = Object.freeze([Object.freeze({
  id: "invitation-1",
  workspaceId: "workspace-1",
  email: "invitee@example.test",
  invitedBy: "admin-1",
  tokenHash: "secret-hash-that-must-not-leak",
  status: "pending" as const,
  role: "member",
  expiresAt: new Date("2026-10-15T00:00:00.000Z"),
  createdAt: new Date("2026-10-08T00:00:00.000Z"),
  updatedAt: new Date("2026-10-08T00:00:00.000Z")
})]);

const createQueryService = (evaluatePolicy: PolicyEvaluator) => createUserInvitationQueryService({
  gateway: {
    findByPrincipal: (_principal, options = {}) => Promise.resolve(options.status
      ? invitations.filter((invitation) => invitation.status === options.status)
      : invitations),
    findOneByEmail: () => Promise.resolve(null),
    findPendingByEmail: () => Promise.resolve(null),
    createPending: () => Promise.reject(new Error("unexpected write")),
    replacePending: () => Promise.resolve(null),
    revokePending: () => Promise.resolve(false),
    resendPending: () => Promise.resolve(false)
  },
  evaluatePolicy,
  logger
});

const invokeController = async (status: string | string[] | undefined) => {
  let responseStatus = 0;
  let responseBody: unknown;
  let nextError: unknown;
  const controller = createUserInvitationListController({
    principalResolver: {
      resolve: () => Promise.resolve({ kind: "resolved", principal: { userId: "admin-1", sessionId: "session-1", workspaceId: "workspace-1" } })
    },
    list: createQueryService(() => Promise.resolve({ effect: "allow" })).list
  });
  const request = { headers: { authorization: "Bearer valid-token-value" }, query: { ...(status === undefined ? {} : { status }) } } as unknown as Request;
  const response = {
    status: (value: number) => { responseStatus = value; return response; },
    json: (value: unknown) => { responseBody = value; return response; }
  } as unknown as Response;
  const next: NextFunction = (error?: unknown) => { nextError = error; };
  const handler = controller as unknown as (request: Request, response: Response, next: NextFunction) => Promise<void>;
  await handler(request, response, next);
  return { responseStatus, responseBody, nextError };
};

void test("invitation list policy permits an active owner or admin membership only", async () => {
  const owner = createIdentityPolicyEvaluator({ resolveActor: () => Promise.resolve({ role: "Owner", guest: false }) });
  const admin = createIdentityPolicyEvaluator({ resolveActor: () => Promise.resolve({ role: "admin", guest: false }) });
  const member = createIdentityPolicyEvaluator({ resolveActor: () => Promise.resolve({ role: "member", guest: false }) });
  const guest = createIdentityPolicyEvaluator({ resolveActor: () => Promise.resolve({ role: "admin", guest: true }) });

  assert.deepEqual(await owner({ principal: { userId: "u1", workspaceId: "w1" }, commandName: "identity.user-invitations.list" }), { effect: "allow" });
  assert.deepEqual(await admin({ principal: { userId: "u1", workspaceId: "w1" }, commandName: "identity.user-invitations.list" }), { effect: "allow" });
  assert.deepEqual(await member({ principal: { userId: "u1", workspaceId: "w1" }, commandName: "identity.user-invitations.list" }), { effect: "deny", reason: "insufficient-role" });
  assert.deepEqual(await guest({ principal: { userId: "u1", workspaceId: "w1" }, commandName: "identity.user-invitations.list" }), { effect: "deny", reason: "insufficient-role" });
});

void test("identity invitation list returns a scoped, secret-free view", async () => {
  const result = await createQueryService(() => Promise.resolve({ effect: "allow" })).list({ userId: "admin-1", workspaceId: "workspace-1" });
  assert.deepEqual(result, [{
    id: "invitation-1",
    email: "invitee@example.test",
    status: "pending",
    role: "member",
    expiresAt: new Date("2026-10-15T00:00:00.000Z"),
    createdAt: new Date("2026-10-08T00:00:00.000Z")
  }]);
  assert.doesNotMatch(JSON.stringify(result), /secret-hash-that-must-not-leak|tokenHash|invitedBy/);
});

void test("identity invitation list rejects unsupported filters at the HTTP controller", async () => {
  const invalid = await invokeController("all");
  assert.equal(invalid.responseStatus, 0);
  assert.equal(invalid.nextError && typeof invalid.nextError === "object" && "status" in invalid.nextError ? invalid.nextError.status : null, 400);

  const repeated = await invokeController(["pending", "revoked"]);
  assert.equal(repeated.responseStatus, 0);
  assert.equal(repeated.nextError && typeof repeated.nextError === "object" && "status" in repeated.nextError ? repeated.nextError.status : null, 400);
});

void test("identity invitation list fails closed for member and guest actors", async () => {
  for (const actor of [{ role: "member", guest: false }, { role: "admin", guest: true }]) {
    const evaluator = createIdentityPolicyEvaluator({ resolveActor: () => Promise.resolve(actor) });
    await assert.rejects(
      () => createQueryService(evaluator).list({ userId: "u1", workspaceId: "w1" }),
      (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "policy_denied"
    );
  }
});
