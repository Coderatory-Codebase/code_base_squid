import type { Logger } from "@workspace/logging";
import { createInvitationAcceptedGateway } from "../db/invitation-accepted.gateway.js";
import { createInvitationAcceptedConsumer } from "./invitation-accepted.consumer.js";

/** Feature composition for the API runtime; the outbox worker can consume this handler. */
export const createWorkspaceInvitationAcceptedConsumer = ({ logger }: { logger: Logger }) =>
  createInvitationAcceptedConsumer({
    ...createInvitationAcceptedGateway(),
    emitSignal: (signal) => {
      const metadata = { ...signal, overThreshold: signal.durationMs > signal.thresholdMs };
      if (signal.durationMs > signal.thresholdMs || signal.outcome === "failed") {
        logger.warn("Invitation acceptance consumer signal.", metadata);
      } else {
        logger.info("Invitation acceptance consumer signal.", metadata);
      }
    }
  });

export { createInvitationAcceptedConsumer } from "./invitation-accepted.consumer.js";
export type {
  InvitationAcceptedConsumer,
  InvitationAcceptedConsumerDependencies,
  InvitationAcceptedEvent,
  InvitationAcceptedOutcome,
  InvitationAcceptedPersistence,
  InvitationAcceptedSignal,
  InvitationWorkspace
} from "./invitation-accepted.consumer.js";
