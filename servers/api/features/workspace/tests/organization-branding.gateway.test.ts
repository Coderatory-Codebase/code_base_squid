import assert from "node:assert/strict";
import test from "node:test";
import {
  createOrganizationBrandingGateway,
  type OrganizationBranding,
  type OrganizationBrandingQuery
} from "../index.js";
import { explainUsesOrganizationBrandingIndex } from "../organization-branding.mongo-reader.js";
import {
  ORGANIZATION_BRANDING_INDEX_NAME,
  ORGANIZATION_BRANDING_LIST_INDEX_NAME,
  WorkspaceBrandingModel
} from "../../../integrations/index.js";

type StoredBranding = OrganizationBranding & Readonly<{
  workspaceId: string;
  deletedAt: Date | null;
}>;

const records: readonly StoredBranding[] = Object.freeze([
  {
    organizationId: "org-a",
    workspaceId: "workspace-a",
    logoUrl: "https://assets.example.test/org-a.svg",
    accentColor: "#1D4ED8",
    deletedAt: null
  },
  {
    organizationId: "org-a",
    workspaceId: "workspace-b",
    logoUrl: "https://assets.example.test/other-workspace.svg",
    accentColor: "#DC2626",
    deletedAt: null
  },
  {
    organizationId: "org-a",
    workspaceId: "workspace-a",
    logoUrl: "https://assets.example.test/deleted.svg",
    accentColor: "#000000",
    deletedAt: new Date("2026-09-01T00:00:00.000Z")
  }
]);

const createMockReader = (queries: OrganizationBrandingQuery[] = []) => ({
  findMany: (query: OrganizationBrandingQuery): Promise<readonly OrganizationBranding[]> => {
    queries.push(query);
    const matches = records
      .filter((record) => record.organizationId === query.organizationId)
      .filter((record) => record.deletedAt === query.deletedAt)
      .filter((record) => record.workspaceId === query.workspaceId)
      .map(({ organizationId, logoUrl, accentColor }) => ({ organizationId, logoUrl, accentColor }));
    return Promise.resolve(matches);
  }
});

void test("scopes branding reads to the principal and excludes soft-deleted records", async () => {
  const queries: OrganizationBrandingQuery[] = [];
  const gateway = createOrganizationBrandingGateway({ reader: createMockReader(queries) });

  const result = await gateway.findOrganizationBranding(
    { workspaceId: "workspace-a" },
    "org-a"
  );

  assert.deepEqual(result, [{
    organizationId: "org-a",
    logoUrl: "https://assets.example.test/org-a.svg",
    accentColor: "#1D4ED8"
  }]);
  const query = queries.at(0);
  assert.ok(query);
  assert.deepEqual(query, {
    organizationId: "org-a",
    deletedAt: null,
    workspaceId: "workspace-a"
  });
  assert.deepEqual(Object.keys(query), [
    "organizationId",
    "deletedAt",
    "workspaceId"
  ]);
});

void test("returns no branding when the principal belongs to another workspace", async () => {
  const queries: OrganizationBrandingQuery[] = [];
  const gateway = createOrganizationBrandingGateway({ reader: createMockReader(queries) });

  const result = await gateway.findOrganizationBranding(
    { workspaceId: "workspace-c" },
    "org-a"
  );

  assert.deepEqual(result, []);
  assert.deepEqual(queries, [{
    organizationId: "org-a",
    deletedAt: null,
    workspaceId: "workspace-c"
  }]);
});

void test("permission refusal: another workspace cannot read this organization's branding", async () => {
  const queries: OrganizationBrandingQuery[] = [];
  const gateway = createOrganizationBrandingGateway({ reader: createMockReader(queries) });

  const result = await gateway.findOrganizationBranding({ workspaceId: "workspace-c" }, "org-a");

  assert.deepEqual(result, []);
  assert.equal(queries[0]?.workspaceId, "workspace-c");
  assert.equal(result.length, 0);
});

void test("declares the covering index for the scoped branding projection", () => {
  const coveringIndex = WorkspaceBrandingModel.schema.indexes().find(([, options]) =>
    options.name === ORGANIZATION_BRANDING_INDEX_NAME
  );

  assert.ok(coveringIndex);
  assert.deepEqual(coveringIndex[0], {
    workspaceId: 1,
    organizationId: 1,
    deletedAt: 1,
    logoUrl: 1,
    accentColor: 1
  });
});

void test("declares a workspace-list covering index whose prefix matches the list query", () => {
  const listIndex = WorkspaceBrandingModel.schema.indexes().find(([, options]) =>
    options.name === ORGANIZATION_BRANDING_LIST_INDEX_NAME
  );

  assert.ok(listIndex);
  assert.deepEqual(listIndex[0], {
    workspaceId: 1,
    deletedAt: 1,
    organizationId: 1,
    logoUrl: 1,
    accentColor: 1
  });
  assert.notEqual(ORGANIZATION_BRANDING_LIST_INDEX_NAME, ORGANIZATION_BRANDING_INDEX_NAME);
});

void test("accepts the named index only when the winning and executed plans use it", () => {
  assert.equal(explainUsesOrganizationBrandingIndex({
    queryPlanner: {
      winningPlan: { stage: "PROJECTION_COVERED", inputStage: { stage: "IXSCAN", indexName: ORGANIZATION_BRANDING_INDEX_NAME } },
      rejectedPlans: [{ stage: "IXSCAN", indexName: "some_other_index" }]
    },
    executionStats: { executionStages: { stage: "PROJECTION_COVERED", inputStage: { stage: "IXSCAN", indexName: ORGANIZATION_BRANDING_INDEX_NAME } } }
  }), true);

  assert.equal(explainUsesOrganizationBrandingIndex({
    queryPlanner: {
      winningPlan: { stage: "COLLSCAN" },
      rejectedPlans: [{ stage: "IXSCAN", indexName: ORGANIZATION_BRANDING_INDEX_NAME }]
    },
    executionStats: { executionStages: { stage: "COLLSCAN" } }
  }), false);
});
