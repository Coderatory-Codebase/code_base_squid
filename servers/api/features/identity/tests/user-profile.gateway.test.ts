import assert from "node:assert/strict";
import test from "node:test";
import { createUserProfileGateway, type UserProfileQuery } from "../shared/index.js";

void test("user profile gateway queries by principal and appends workspace scope", async () => {
  let receivedQuery: UserProfileQuery | undefined;
  const gateway = createUserProfileGateway({
    queryPort: {
      findOne: (query) => {
        receivedQuery = query;
        return Promise.resolve({
          userProfileId: "user-1",
          userId: "user-1",
          workspaceId: "workspace-1",
          name: "Lena Park",
          version: 0,
          deletedAt: null
        });
      }
    }
  });

  const profile = await gateway.getUserProfile("user-1", { userId: "actor-1", workspaceId: "workspace-1" });

  assert.deepEqual(profile, { name: "Lena Park" });
  assert.deepEqual(receivedQuery, {
    userProfileId: "user-1",
    deletedAt: null,
    workspaceId: "workspace-1"
  });
  assert.equal(Object.keys(receivedQuery).at(-1), "workspaceId");
});
