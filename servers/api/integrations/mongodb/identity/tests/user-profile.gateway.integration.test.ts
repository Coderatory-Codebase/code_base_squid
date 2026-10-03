import assert from "node:assert/strict";
import mongoose from "mongoose";
import test from "node:test";
import {
  createUserProfileGateway,
  USER_PROFILE_VIEW_INDEX_NAME,
  type UserProfileRecord
} from "../../../../features/identity/index.js";
import { createUserProfileModel } from "../user-profile.model.js";
import { createUserProfileQueryAdapter } from "../profile-query.adapter.js";

void test("user profile gateway enforces workspace and deletion scope using its index", async (context) => {
  const databaseName = `identity_gateway_test_${String(process.pid)}_${String(Date.now())}`;
  let connection: mongoose.Connection;

  try {
    connection = await mongoose.createConnection(
      `mongodb://127.0.0.1:27017/${databaseName}`,
      { serverSelectionTimeoutMS: 1_000 }
    ).asPromise();
  } catch {
    context.skip("Local MongoDB is unavailable; set up the repository test database to run this integration test.");
    return;
  }

  try {
    const model = createUserProfileModel(connection);
    await model.init();

    const profiles: UserProfileRecord[] = Array.from({ length: 1_000 }, (_, index) => ({
      userProfileId: `other-user-${String(index)}`,
      userId: `other-user-${String(index)}`,
      workspaceId: "workspace-a",
      name: `Other User ${String(index)}`,
      updatedAt: new Date(1_700_000_000_000 + index),
      version: 0,
      deletedAt: null
    }));
    profiles.push(
      {
        userProfileId: "user-1",
        userId: "user-1",
        workspaceId: "workspace-a",
        name: "Lena in A",
        updatedAt: new Date("2026-09-01T00:00:00.000Z"),
        version: 0,
        deletedAt: null
      },
      {
        userProfileId: "deleted-user",
        userId: "deleted-user",
        workspaceId: "workspace-a",
        name: "Deleted User",
        updatedAt: new Date("2026-09-02T00:00:00.000Z"),
        version: 1,
        deletedAt: new Date("2026-09-03T00:00:00.000Z")
      }
    );
    await model.insertMany(profiles);

    const gateway = createUserProfileGateway({ queryPort: createUserProfileQueryAdapter(model) });
    const profile = await gateway.getUserProfile("user-1", { userId: "actor-1", workspaceId: "workspace-a" });
    const crossWorkspaceProfile = await gateway.getUserProfile("user-1", {
      userId: "actor-1",
      workspaceId: "workspace-b"
    });
    const deletedProfile = await gateway.getUserProfile("deleted-user", {
      userId: "actor-1",
      workspaceId: "workspace-a"
    });

    assert.deepEqual(profile, { name: "Lena in A" });
    assert.equal(crossWorkspaceProfile, null);
    assert.equal(deletedProfile, null);

    const explanation = await model.collection.find({
      workspaceId: "workspace-a",
      userProfileId: "user-1",
      deletedAt: null
    }).sort({ updatedAt: -1 }).explain("executionStats");
    const queryPlanner = explanation.queryPlanner as { winningPlan: unknown };
    const winningPlan = JSON.stringify(queryPlanner.winningPlan);
    assert.ok(winningPlan.includes(USER_PROFILE_VIEW_INDEX_NAME), winningPlan);
  } finally {
    await connection.dropDatabase();
    await connection.close();
  }
});
