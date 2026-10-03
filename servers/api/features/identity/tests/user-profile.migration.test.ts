import assert from "node:assert/strict";
import test from "node:test";
import {
  USER_PROFILE_COLLECTION,
  USER_PROFILE_VIEW_INDEX_KEYS,
  USER_PROFILE_VIEW_INDEX_NAME
} from "../shared/models/user-profile.js";
import { down, up, type UserProfileMigrationDatabase } from "../migrations/20260930154347-user-profile.js";

void test("user profile migration creates the collection and view index, then rolls back", async () => {
  const calls: string[] = [];
  let createdIndexKeys: Readonly<Record<string, 1 | -1>> | undefined;
  let createdIndexName: string | undefined;
  const database: UserProfileMigrationDatabase = {
    createCollection: (collectionName) => {
      calls.push(`createCollection:${collectionName}`);
      return Promise.resolve();
    },
    createIndex: (collectionName, keys, options) => {
      calls.push(`createIndex:${collectionName}`);
      createdIndexKeys = keys;
      createdIndexName = options.name;
      return Promise.resolve();
    },
    dropCollection: (collectionName) => {
      calls.push(`dropCollection:${collectionName}`);
      return Promise.resolve();
    }
  };

  await up(database);

  assert.deepEqual(calls, [
    `createCollection:${USER_PROFILE_COLLECTION}`,
    `createIndex:${USER_PROFILE_COLLECTION}`
  ]);
  assert.deepEqual(createdIndexKeys, USER_PROFILE_VIEW_INDEX_KEYS);
  assert.equal(createdIndexName, USER_PROFILE_VIEW_INDEX_NAME);

  await down(database);

  assert.equal(calls.at(-1), `dropCollection:${USER_PROFILE_COLLECTION}`);
});
