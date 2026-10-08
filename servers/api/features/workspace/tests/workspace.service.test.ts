import test from "node:test";
import assert from "node:assert/strict";
import { createWorkspaceService } from "../services/workspace.service.js";

void test("Workspace service: getOrganizationProfile delegates to repository", async () => {
  let called = false;
  const repository = {
    findOrganizationProfile: (principal: unknown, orgId: string) => {
      called = true;
      assert.equal(orgId, "org-1");
      return Promise.resolve(null);
    }
  };

  const service = createWorkspaceService({ repository });
  await service.getOrganizationProfile({ userId: "u-1" }, "org-1");
  assert.ok(called);
});
