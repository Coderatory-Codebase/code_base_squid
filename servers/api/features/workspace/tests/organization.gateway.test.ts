import test from "node:test";
import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";
import { buildOrganizationQueryForPrincipal, createOrganizationGateway } from "../db/organization.gateway.js";
import { createMongoDbIntegration } from "../../../integrations/mongodb/index.js";
import { OrganizationModel } from "../integrations/organization.model.js";
import type { OrganizationDocument } from "../integrations/organization.model.js";

void test("gateway applies deletedAt exclusion and workspace scope last", async (): Promise<void> => {
  const calls: string[] = [];
  let capturedDeletedAtFilter: unknown;
  let capturedOrFilter: unknown;
  let capturedWorkspaceFilter: unknown;

  const fakeQuery = {
    where(path: string) {
      calls.push(`where:${path}`);
      return {
        equals(value: unknown) {
          calls.push("equals");
          capturedDeletedAtFilter = value;
          return fakeQuery;
        },
        in(values: readonly unknown[]) {
          calls.push("in");
          capturedWorkspaceFilter = values;
          return fakeQuery;
        }
      };
    },
    or(conditions: readonly Record<string, unknown>[]) {
      calls.push("or");
      capturedOrFilter = conditions;
      return fakeQuery;
    },
    sort() {
      calls.push("sort");
      return fakeQuery;
    },
    lean: (): Promise<OrganizationDocument[]> => Promise.resolve([])
  };
  const model = { find: () => fakeQuery as never };
  const gateway = createOrganizationGateway({ model });

  await gateway.listOrganizationsForPrincipal({
    userId: "user-1",
    workspaceIds: ["ws-a", "ws-b"]
  });

  // deletedAt exclusion is applied
  assert.equal(capturedDeletedAtFilter, null);

  // ownership/membership condition is present
  assert.deepEqual(capturedOrFilter, [
    { ownerId: "user-1" },
    { workspaceIds: { $in: ["ws-a", "ws-b"] } }
  ]);

  // workspace scope filter is present, using the principal's workspaceIds
  assert.deepEqual(capturedWorkspaceFilter, ["ws-a", "ws-b"]);

  // workspace scope (where "workspaceIds" -> in) is applied AFTER the base filter (deletedAt, or)
  const deletedAtIndex = calls.indexOf("where:deletedAt");
  const orIndex = calls.indexOf("or");
  const workspaceScopeIndex = calls.indexOf("where:workspaceIds");

  assert.ok(deletedAtIndex < workspaceScopeIndex);
  assert.ok(orIndex < workspaceScopeIndex);
});

void test("returns no organizations belonging to another workspace", async (context): Promise<void> => {
  const mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 60_000 } });
  const mongoIntegration = createMongoDbIntegration({
    uri: mongo.getUri(),
    logger: {
      info: (): void => undefined,
      warn: (): void => undefined,
      error: (): void => undefined
    }
  });
  context.after(async () => {
    await mongoIntegration.disconnect();
    await mongo.stop();
  });

  await mongoIntegration.connect();
  await OrganizationModel.init();
  await OrganizationModel.create({
    name: "Other workspace organization",
    ownerId: "other-user",
    workspaceIds: ["workspace-other"]
  });

  await OrganizationModel.insertMany(
    Array.from({ length: 64 }, (_, index) => ({
      _id: String(index).padStart(24, "0"),
      name: `Unrelated organization ${String(index)}`,
      ownerId: `unrelated-user-${String(index)}`,
      workspaceIds: [`workspace-unrelated-${String(index)}`],
      lastUsedAt: new Date(),
      deletedAt: null
    }))
  );
  const gateway = createOrganizationGateway();
  const principal = {
    userId: "current-user",
    workspaceIds: ["workspace-current"]
  } as const;
  const organizations = await gateway.listOrganizationsForPrincipal(principal);

  assert.deepEqual(organizations, []);

  const explanation = await buildOrganizationQueryForPrincipal(principal).explain("queryPlanner");
  const queryPlanner = explanation as { queryPlanner?: { winningPlan?: unknown } };
  const winningPlanUsesWorkspaceIndex = (value: unknown): boolean => {
    if (Array.isArray(value)) {
      return value.some(winningPlanUsesWorkspaceIndex);
    }
    if (value === null || typeof value !== "object") {
      return false;
    }

    const planNode = value as Record<string, unknown>;
    return (
      (planNode.stage === "IXSCAN" && planNode.indexName === "workspaceIds_1") ||
      Object.values(planNode).some(winningPlanUsesWorkspaceIndex)
    );
  };

  assert.ok(
    winningPlanUsesWorkspaceIndex(queryPlanner.queryPlanner?.winningPlan),
    "the query planner should use the workspaceIds_1 index"
  );
});


