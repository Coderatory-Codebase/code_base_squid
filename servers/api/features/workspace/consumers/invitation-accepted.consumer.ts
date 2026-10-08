/**
 * Workspace-side consumer for an accepted invitation event.
 *
 * The persistence adapter must apply membership and the event receipt atomically,
 * keyed by eventId. It must also re-check workspace status while applying so an
 * archive racing this read cannot create an active membership.
 */
export type InvitationAcceptedEvent = Readonly<{
  eventId: string;
  workspaceId: string;
  userId: string;
  guest: boolean;
}>;

export type InvitationWorkspace = Readonly<{
  status: "ACTIVE" | "ARCHIVED";
  defaultRole: string;
}>;

export type InvitationAcceptedOutcome = "applied" | "duplicate" | "archived";
export type InvitationAcceptedSignal = Readonly<{
  module: "workspace";
  feature: "invitation-accepted";
  operation: "consume";
  eventId: string;
  workspaceId: string;
  outcome: "succeeded" | "duplicate" | "refused" | "failed";
  durationMs: number;
  thresholdMs: 5_000;
}>;

export type InvitationAcceptedConsumerDependencies = Readonly<{
  workspaceOf: (workspaceId: string) => Promise<InvitationWorkspace | null>;
  /**
   * Atomically records the event receipt and creates the membership once.
   * If the workspace was archived before commit, it records not-applied/ARCHIVED
   * and returns archived instead. Replays return duplicate without another write.
   */
  addMemberOnce: (input: Readonly<{
    eventId: string;
    workspaceId: string;
    userId: string;
    role: string;
    guest: boolean;
  }>) => Promise<InvitationAcceptedOutcome>;
  /** Persist a non-applied receipt with reason ARCHIVED, idempotently by eventId. */
  markNotApplied: (input: Readonly<{
    eventId: string;
    workspaceId: string;
    reason: "ARCHIVED";
  }>) => Promise<"recorded" | "duplicate">;
  emitSignal: (signal: InvitationAcceptedSignal) => void;
}>;

export type InvitationAcceptedPersistence = Pick<
  InvitationAcceptedConsumerDependencies,
  "workspaceOf" | "addMemberOnce" | "markNotApplied"
>;

export type InvitationAcceptedConsumer = Readonly<{
  consume: (event: InvitationAcceptedEvent) => Promise<InvitationAcceptedOutcome>;
}>;

const isNonEmpty = (value: string): boolean => value.trim().length > 0;

/** Creates the workspace-owned handler without binding it to a queue or database. */
export const createInvitationAcceptedConsumer = (
  dependencies: InvitationAcceptedConsumerDependencies
): InvitationAcceptedConsumer => {
  const consume = async (event: InvitationAcceptedEvent): Promise<InvitationAcceptedOutcome> => {
    const startedAt = performance.now();
    let outcome: InvitationAcceptedSignal["outcome"] = "failed";
    if (
      !isNonEmpty(event.eventId) ||
      !isNonEmpty(event.workspaceId) ||
      !isNonEmpty(event.userId)
    ) {
      const error = new Error("InvitationAccepted requires event, workspace and user identifiers.");
      dependencies.emitSignal(Object.freeze({
        module: "workspace",
        feature: "invitation-accepted",
        operation: "consume",
        eventId: event.eventId,
        workspaceId: event.workspaceId,
        outcome,
        durationMs: performance.now() - startedAt,
        thresholdMs: 5_000
      }));
      throw error;
    }

    try {
      const workspace = await dependencies.workspaceOf(event.workspaceId);
      if (!workspace) {
        throw new Error("InvitationAccepted references an unknown workspace.");
      }

      if (workspace.status === "ARCHIVED") {
        const result = await dependencies.markNotApplied({
          eventId: event.eventId,
          workspaceId: event.workspaceId,
          reason: "ARCHIVED"
        });
        outcome = result === "duplicate" ? "duplicate" : "refused";
        return result === "duplicate" ? "duplicate" : "archived";
      }

      if (!isNonEmpty(workspace.defaultRole)) {
        throw new Error("The active workspace has no configured default role.");
      }

      const result = await dependencies.addMemberOnce({
        eventId: event.eventId,
        workspaceId: event.workspaceId,
        userId: event.userId,
        role: event.guest ? "guest" : workspace.defaultRole,
        guest: event.guest
      });
      outcome = result === "applied" ? "succeeded" : result === "duplicate" ? "duplicate" : "refused";
      return result;
    } finally {
      dependencies.emitSignal(Object.freeze({
        module: "workspace",
        feature: "invitation-accepted",
        operation: "consume",
        eventId: event.eventId,
        workspaceId: event.workspaceId,
        outcome,
        durationMs: performance.now() - startedAt,
        thresholdMs: 5_000
      }));
    }
  };

  return Object.freeze({ consume });
};
