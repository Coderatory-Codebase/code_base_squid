import type { Logger } from "@workspace/logging";
import type { InvitationOperationSignal } from "./user-invitation.service.js";

export const createInvitationOperationSignalEmitter = (logger: Logger) =>
  (signal: InvitationOperationSignal): void => {
    logger.info("Workspace invitation operation completed.", signal);
  };
