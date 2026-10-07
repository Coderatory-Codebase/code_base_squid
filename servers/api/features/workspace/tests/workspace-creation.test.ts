import assert from "node:assert/strict";
import test from "node:test";
import { createWorkspaceCreation } from "../domain/workspace-creation.js";

void test("workspace creation accepts and trims a valid name", () => {
  assert.deepEqual(createWorkspaceCreation({
    organizationId: "organization-1",
    ownerId: "owner-1",
    name: "  Design  "
  }), {
    ok: true,
    value: {
      organizationId: "organization-1",
      ownerId: "owner-1",
      name: "Design"
    }
  });
});

void test("workspace creation accepts names at both length limits", () => {
  assert.equal(createWorkspaceCreation({
    organizationId: "organization-1",
    ownerId: "owner-1",
    name: "D"
  }).ok, true);
  assert.equal(createWorkspaceCreation({
    organizationId: "organization-1",
    ownerId: "owner-1",
    name: "D".repeat(80)
  }).ok, true);
});

void test("workspace creation returns a typed error for blank or overlong names", () => {
  for (const name of ["", "   ", "D".repeat(81)]) {
    assert.deepEqual(createWorkspaceCreation({
      organizationId: "organization-1",
      ownerId: "owner-1",
      name
    }), {
      ok: false,
      error: {
        kind: "invalid-name",
        message: "Workspace name must contain between 1 and 80 characters."
      }
    });
  }
});
