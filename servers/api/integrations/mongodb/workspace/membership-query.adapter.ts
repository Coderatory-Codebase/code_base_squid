import type { Connection, Model } from "mongoose";
import { Schema } from "mongoose";
import type { WorkspaceMembershipPort, WorkspaceMembershipRecord } from "../../../features/workspace/index.js";

export const WORKSPACE_MEMBERSHIP_COLLECTION = "memberships";

const workspaceMembershipSchema = new Schema<WorkspaceMembershipRecord>(
  {
    workspaceId: { type: String, required: true },
    userId: { type: String, required: true },
    role: { type: String, required: true },
    status: { type: String, required: true, enum: ["ACTIVE", "SUSPENDED", "REMOVED"] },
    guest: { type: Boolean, required: true, default: false },
    version: { type: Number, required: true, default: 0, min: 0 }
  },
  { timestamps: false, versionKey: false }
);

workspaceMembershipSchema.index(
  { workspaceId: 1, userId: 1 },
  { unique: true, name: "memberships_by_workspace_user" }
);
workspaceMembershipSchema.index({ userId: 1, status: 1 }, { name: "memberships_by_user_status" });

const createWorkspaceMembershipModel = (connection: Connection): Model<WorkspaceMembershipRecord> =>
  connection.model<WorkspaceMembershipRecord>("WorkspaceMembership", workspaceMembershipSchema, WORKSPACE_MEMBERSHIP_COLLECTION);

export const createWorkspaceMembershipQueryAdapter = (connection: Connection): WorkspaceMembershipPort => {
  const model = createWorkspaceMembershipModel(connection);
  return {
    activeMembershipsFor: async (userId) => {
      const memberships = await model.aggregate<{ workspaceId: string }>([
        { $match: { userId, status: "ACTIVE" } },
        {
          $lookup: {
            from: "workspaces",
            let: { workspaceId: "$workspaceId" },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ["$_id", "$$workspaceId"] }, { $eq: ["$status", "ACTIVE"] }] } } },
              { $project: { _id: 1, orgId: 1 } }
            ],
            as: "workspace"
          }
        },
        { $unwind: "$workspace" },
        {
          $lookup: {
            from: "organizations",
            let: { orgId: "$workspace.orgId" },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ["$_id", "$$orgId"] }, { $eq: ["$status", "ACTIVE"] }] } } },
              { $project: { _id: 1 } }
            ],
            as: "organization"
          }
        },
        { $match: { "organization.0": { $exists: true } } },
        { $project: { _id: 0, workspaceId: 1 } }
      ]).exec();

      return memberships.map(({ workspaceId }) => ({ workspaceId }));
    }
  };
};