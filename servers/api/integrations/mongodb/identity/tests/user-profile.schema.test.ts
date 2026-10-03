import assert from "node:assert/strict";
import test from "node:test";
import { userProfileSchema } from "../user-profile.model.js";

void test("user profile schema declares its compound view index", () => {
  const indexes = userProfileSchema.indexes();
  assert.ok(indexes.some(([keys]) =>
    keys.workspaceId === 1 && keys.userProfileId === 1 && keys.updatedAt === 1
  ));
});

void test("user profile schema supports optimistic concurrency and soft deletion", () => {
  assert.ok(userProfileSchema.path("version"));
  assert.ok(userProfileSchema.path("deletedAt"));
  assert.equal(userProfileSchema.options.versionKey, "version");
  assert.equal(userProfileSchema.options.optimisticConcurrency, true);
});