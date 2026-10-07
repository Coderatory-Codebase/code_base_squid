import assert from "node:assert/strict";
import test from "node:test";
import { percentile95 } from "../../../integrations/index.js";
import {
  ORGANIZATION_BRANDING_LIST_INDEX_NAME
} from "../../../integrations/index.js";
import { explainUsesOrganizationBrandingListIndex } from "../organization-branding.mongo-reader.js";

void test("the T5 p95 calculation selects the nearest-rank 95th percentile", () => {
  const timings = Array.from({ length: 200 }, (_, index) => index + 1).reverse();
  assert.equal(percentile95(timings), 190);
});

void test("the T5 explain assertion only passes when its named list index executes", () => {
  const plan = {
    queryPlanner: { winningPlan: { stage: "PROJECTION_COVERED", inputStage: { stage: "IXSCAN", indexName: ORGANIZATION_BRANDING_LIST_INDEX_NAME } } },
    executionStats: { executionStages: { stage: "PROJECTION_COVERED", inputStage: { stage: "IXSCAN", indexName: ORGANIZATION_BRANDING_LIST_INDEX_NAME } } }
  };
  assert.equal(explainUsesOrganizationBrandingListIndex(plan), true);
  assert.equal(explainUsesOrganizationBrandingListIndex({
    queryPlanner: { winningPlan: { stage: "COLLSCAN" } },
    executionStats: { executionStages: { stage: "COLLSCAN" } }
  }), false);
});
