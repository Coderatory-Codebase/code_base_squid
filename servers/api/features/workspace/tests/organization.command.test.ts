import test from "node:test";
import assert from "node:assert/strict";
import { createOrganizationCommandBus } from "../commands/organization.command.js";
import type { OrganizationGateway } from "../db/organization.gateway.js";
import type { Principal } from "../types.js";

void test("command bus refuses a create command without a policy decision", async () => {
  const principal: Principal = { userId: "user-1", workspaceIds: [] };
  let createCalled = false;
  const gateway: OrganizationGateway = {
    listOrganizationsForPrincipal: () => Promise.resolve({ organizations: [], nextOffset: null }),
    createOrganizationForPrincipal: () => {
      createCalled = true;
      return Promise.reject(new Error("Must not reach persistence"));
    },
    upsertPreviewOrganization: () => Promise.resolve()
  };
  await assert.rejects(createOrganizationCommandBus(gateway).dispatch({ principal, name: "Example" }), {
    code: "forbidden",
    status: 403
  });
  assert.equal(createCalled, false);
});

void test("command bus binds policy decisions to the requested action and principal", async () => {
  const principal: Principal = { userId: "user-1", workspaceIds: [] };
  let createCalled = false;
  const gateway: OrganizationGateway = {
    listOrganizationsForPrincipal: () => Promise.resolve({ organizations: [], nextOffset: null }),
    createOrganizationForPrincipal: () => {
      createCalled = true;
      return Promise.reject(new Error("Must not reach persistence"));
    },
    upsertPreviewOrganization: () => Promise.resolve()
  };
  const commandBus = createOrganizationCommandBus(gateway);
  const invalidDecisions = [
    { action: "organization:delete", subjectId: principal.userId, allowed: true },
    { action: "organization:create", subjectId: "another-user", allowed: true },
    { action: "organization:create", subjectId: principal.userId, allowed: false }
  ] as const;

  for (const policyDecision of invalidDecisions) {
    await assert.rejects(commandBus.dispatch({ principal, name: "Example", policyDecision }), {
      code: "forbidden",
      status: 403
    });
  }
  assert.equal(createCalled, false);
});
