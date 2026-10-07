import assert from "node:assert/strict";
import test from "node:test";
import { createUserProfileGateway, type UserProfileQuery } from "../shared/index.js";

void test("user profile gateway scopes reads to the authenticated Identity user", async () => {
  let receivedQuery: UserProfileQuery | undefined;
  let queryCalls = 0;
  const gateway = createUserProfileGateway({
    queryPort: {
      findOne: (query) => {
        queryCalls += 1;
        receivedQuery = query;
        return Promise.resolve({
          userId: "user-1",
          email: "lena@example.test",
          name: "Lena Park",
          version: 0
        });
      },
      updateOne: () => Promise.resolve({ kind: "conflict", currentProfile: null })
    }
  });

  const profile = await gateway.getUserProfile("user-1", { userId: "user-1", workspaceId: "workspace-1" });

  assert.deepEqual(profile, { email: "lena@example.test", name: "Lena Park", version: 0 });
  assert.deepEqual(receivedQuery, {
    userId: "user-1",
    status: "ACTIVE",
    closedAt: null
  });
  assert.deepEqual(Object.keys(receivedQuery), ["userId", "status", "closedAt"]);

  const otherUserProfile = await gateway.getUserProfile("other-user", { userId: "user-1", workspaceId: "workspace-1" });
  assert.equal(otherUserProfile, null);
  assert.equal(queryCalls, 1);
});

void test("user profile gateway refuses updates for a different user before persistence", async () => {
  let writes = 0;
  const gateway = createUserProfileGateway({
    queryPort: {
      findOne: () => Promise.resolve(null),
      updateOne: () => {
        writes += 1;
        return Promise.resolve({ kind: "updated", profile: { email: "signed-in@example.test", name: "Changed", version: 1 } });
      }
    }
  });

  const result = await gateway.updateUserProfile("other-user", { userId: "signed-in-user", workspaceId: "workspace-1" }, "Changed", 0);

  assert.deepEqual(result, { kind: "not-found" });
  assert.equal(writes, 0);
});
