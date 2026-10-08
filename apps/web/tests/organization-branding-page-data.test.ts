import assert from "node:assert/strict";
import test from "node:test";
import { getOrganizationInitials, loadOrganizationBrandingPageData, selectOrganizationBrandingPageData } from "../features/organization-branding/organization-branding-page-data";

void test("derives initials from the first two organization-name words", () => {
  assert.equal(getOrganizationInitials("Northwind Traders"), "NT");
  assert.equal(getOrganizationInitials("Aster & Co."), "AC");
});

void test("returns the empty state when the reader has no organizations", async () => {
  const result = await loadOrganizationBrandingPageData({
    gateway: { findForWorkspace: async () => [] },
    principal: { workspaceId: "workspace-under-test" }
  });
  assert.deepEqual(result, { kind: "empty" });
});

void test("returns the empty state when no organization matches the selection", () => {
  assert.deepEqual(selectOrganizationBrandingPageData([], "organization-under-test"), { kind: "empty" });
});

void test("returns the unavailable state when the reader fails", async () => {
  const result = await loadOrganizationBrandingPageData({
    gateway: { findForWorkspace: async () => { throw new Error("reader unavailable"); } },
    principal: { workspaceId: "workspace-under-test" }
  });
  assert.deepEqual(result, { kind: "unavailable" });
});
