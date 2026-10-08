import { systemClock } from "@workspace/kernel";
import { WorkspaceModel } from "../integrations/workspace.model.js";
import type {
  InvitationAcceptedOutcome,
  InvitationAcceptedPersistence,
  InvitationWorkspace
} from "../consumers/invitation-accepted.consumer.js";

const applied = (eventIds: readonly string[], eventId: string): boolean => eventIds.includes(eventId);

/** Mongo adapter for InvitationAccepted; each membership/receipt mutation is one document write. */
export const createInvitationAcceptedGateway = (): InvitationAcceptedPersistence => {
  const workspaceOf = async (workspaceId: string): Promise<InvitationWorkspace | null> => {
    const workspace = await WorkspaceModel.findById(workspaceId)
      .select({ status: 1, defaultRole: 1 })
      .lean()
      .exec();
    return workspace
      ? Object.freeze({ status: workspace.status, defaultRole: workspace.defaultRole })
      : null;
  };

  const markNotApplied: InvitationAcceptedPersistence["markNotApplied"] = async ({
    eventId,
    workspaceId,
    reason
  }) => {
    const now = new Date(systemClock.now());
    const recorded = await WorkspaceModel.updateOne(
      {
        _id: workspaceId,
        notAppliedEvents: { $not: { $elemMatch: { eventId } } },
        appliedEventIds: { $ne: eventId }
      },
      { $push: { notAppliedEvents: { eventId, reason, recordedAt: now } } }
    ).exec();
    if (recorded.modifiedCount > 0) return "recorded";

    const workspace = await WorkspaceModel.findById(workspaceId)
      .select({ appliedEventIds: 1, notAppliedEvents: 1 })
      .lean()
      .exec();
    if (!workspace) throw new Error("InvitationAccepted references an unknown workspace.");
    if (applied(workspace.appliedEventIds, eventId) || workspace.notAppliedEvents.some((entry) => entry.eventId === eventId)) {
      return "duplicate";
    }
    throw new Error("Could not record the archived-workspace refusal.");
  };

  const addMemberOnce: InvitationAcceptedPersistence["addMemberOnce"] = async ({
    eventId,
    workspaceId,
    userId,
    role,
    guest
  }): Promise<InvitationAcceptedOutcome> => {
    const joinedAt = new Date(systemClock.now());
    const added = await WorkspaceModel.updateOne(
      {
        _id: workspaceId,
        status: "ACTIVE",
        appliedEventIds: { $ne: eventId },
        "notAppliedEvents.eventId": { $ne: eventId },
        "members.userId": { $ne: userId }
      },
      {
        $push: { members: { userId, role, guest, joinedAt } },
        $addToSet: { appliedEventIds: eventId }
      }
    ).exec();
    if (added.modifiedCount > 0) return "applied";

    const existing = await WorkspaceModel.findById(workspaceId)
      .select({ status: 1, members: 1, appliedEventIds: 1, notAppliedEvents: 1 })
      .lean()
      .exec();
    if (!existing) throw new Error("InvitationAccepted references an unknown workspace.");
    if (applied(existing.appliedEventIds, eventId) || existing.notAppliedEvents.some((entry) => entry.eventId === eventId)) {
      return "duplicate";
    }
    if (existing.status === "ARCHIVED") {
      const result = await markNotApplied({ eventId, workspaceId, reason: "ARCHIVED" });
      return result === "duplicate" ? "duplicate" : "archived";
    }

    const alreadyMember = existing.members.some((member) => member.userId === userId);
    if (alreadyMember) {
      const recorded = await WorkspaceModel.updateOne(
        { _id: workspaceId, status: "ACTIVE", appliedEventIds: { $ne: eventId } },
        { $addToSet: { appliedEventIds: eventId } }
      ).exec();
      if (recorded.modifiedCount > 0) return "duplicate";
      const latest = await WorkspaceModel.findById(workspaceId).select({ appliedEventIds: 1 }).lean().exec();
      if (latest && applied(latest.appliedEventIds, eventId)) return "duplicate";
      throw new Error("Could not record the duplicate membership event.");
    }

    // The workspace may have changed state between the first read and the write.
    const latest = await WorkspaceModel.findById(workspaceId).select({ status: 1 }).lean().exec();
    if (!latest) throw new Error("InvitationAccepted references an unknown workspace.");
    if (latest.status === "ARCHIVED") {
      const result = await markNotApplied({ eventId, workspaceId, reason: "ARCHIVED" });
      return result === "duplicate" ? "duplicate" : "archived";
    }
    throw new Error("Could not atomically apply the invitation membership.");
  };

  return Object.freeze({ workspaceOf, addMemberOnce, markNotApplied });
};
