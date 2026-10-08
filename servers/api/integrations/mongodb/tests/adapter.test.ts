import test from "node:test";
import assert from "node:assert/strict";
import { Types } from "mongoose";
import { convertFilterToMongo, convertDocFromMongo } from "../collection.js";

void test("adapter test: string ids become ObjectId in Mongo filters", () => {
  const stringId = new Types.ObjectId().toString();
  const filter = { _id: stringId, status: "ACTIVE" };
  const mongoFilter = convertFilterToMongo(filter, ["_id"]);

  assert.ok(mongoFilter._id instanceof Types.ObjectId);
  assert.equal(mongoFilter._id.toString(), stringId);
  assert.equal(mongoFilter.status, "ACTIVE");
});

void test("adapter test: $in ObjectId conversion works correctly", () => {
  const id1 = new Types.ObjectId().toString();
  const id2 = new Types.ObjectId().toString();

  const filter = { workspaceId: { $in: [id1, id2] } };
  const mongoFilter = convertFilterToMongo(filter, ["workspaceId"]);

  const workspaceIdObj = mongoFilter.workspaceId as Record<string, unknown[]>;
  assert.ok(Array.isArray(workspaceIdObj.$in));
  assert.ok(workspaceIdObj.$in[0] instanceof Types.ObjectId);
  assert.ok(workspaceIdObj.$in[1] instanceof Types.ObjectId);
  assert.equal(String(workspaceIdObj.$in[0]), id1);
});

void test("adapter test: returned ObjectIds become strings", () => {
  const id = new Types.ObjectId();
  const ownerId = new Types.ObjectId();

  const doc = {
    _id: id,
    ownerId: ownerId,
    name: "Test"
  };

  const converted = convertDocFromMongo(doc);
  assert.equal(typeof converted._id, "string");
  assert.equal(converted._id, id.toString());
  assert.equal(typeof converted.ownerId, "string");
  assert.equal(converted.ownerId, ownerId.toString());
});
