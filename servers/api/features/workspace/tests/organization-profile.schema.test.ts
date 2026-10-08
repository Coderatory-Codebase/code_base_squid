import assert from "node:assert/strict";
import test from "node:test";
import {
  ORGANIZATION_PROFILE_COLLECTION,
  ORGANIZATION_PROFILE_WORKSPACE_INDEX,
  ORGANIZATION_WORKSPACE_STATES,
  organizationProfileSchema
} from "../organization-profile.schema.js";

void test("organization profile schema contains story fields and concurrency metadata", () => {
  assert.equal(organizationProfileSchema.options.collection, ORGANIZATION_PROFILE_COLLECTION);
  assert.equal(organizationProfileSchema.path("workspaceId").instance, "ObjectId");
  assert.equal(organizationProfileSchema.path("organizationProfileId").instance, "ObjectId");
  assert.equal(organizationProfileSchema.path("workspaceState").instance, "String");
  assert.equal(organizationProfileSchema.path("activeMemberCount").instance, "Number");
  assert.equal(organizationProfileSchema.path("version").instance, "Number");
  assert.equal(organizationProfileSchema.path("deletedAt").instance, "Date");
  assert.deepEqual(organizationProfileSchema.path("workspaceState").options.enum, ORGANIZATION_WORKSPACE_STATES);
  assert.equal(organizationProfileSchema.path("activeMemberCount").options.min, 0);
  const integerValidator = organizationProfileSchema.path("activeMemberCount").validators
    .find(({ message }) => message === "activeMemberCount must be a non-negative integer.")?.validator;
  assert.ok(integerValidator);
  assert.equal(integerValidator(2), true);
  assert.equal(integerValidator(2.5), false);
  assert.equal(organizationProfileSchema.options.versionKey, "version");
  assert.equal(organizationProfileSchema.options.optimisticConcurrency, true);
});

void test("organization profile schema declares the required compound view index", () => {
  const index = organizationProfileSchema.indexes().find(([, options]) => options.name === ORGANIZATION_PROFILE_WORKSPACE_INDEX);
  assert.ok(index);
  assert.deepEqual(index[0], { organizationProfileId: 1, workspaceId: 1 });
  assert.equal(index[1].name, ORGANIZATION_PROFILE_WORKSPACE_INDEX);
});
