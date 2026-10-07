import assert from "node:assert/strict";
import test from "node:test";
import { identityUserSchema } from "../user.model.js";

void test("Identity users schema indexes the canonical userById profile record", () => {
  const indexes = identityUserSchema.indexes();
  assert.ok(indexes.some(([keys, options]) => keys.userId === 1 && options.name === "users_by_user_id"));
});

void test("Identity user schema stores an explicit profile version for conflict detection", () => {
  assert.ok(identityUserSchema.path("profileVersion"));
  assert.equal(identityUserSchema.path("profileVersion").options.default, 0);
  assert.equal(identityUserSchema.path("profileVersion").options.min, 0);
});
