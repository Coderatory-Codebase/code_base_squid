import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../constants/index.js";
import { createApplicationError } from "../../errors/index.js";

/** Who is asking (ARC-005). */
export type Principal = Readonly<{
  userId: string;
  workspaceId: string;
}>;

export type AllowDecision = Readonly<{ effect: "allow"; reason?: string }>;
export type DenyDecision = Readonly<{ effect: "deny"; reason?: string }>;
export type PolicyDecision = AllowDecision | DenyDecision;

/** A command as it must look to be dispatched: principal and decision attached. */
export type Command<TPayload = unknown> = Readonly<{
  name: string;
  payload: TPayload;
  principal: Principal;
  decision: PolicyDecision;
}>;

/** What a handler receives: the decision is always an allow. */
export type AllowedCommand<TPayload = unknown> = Readonly<{
  name: string;
  payload: TPayload;
  principal: Principal;
  decision: AllowDecision;
}>;

/** Runtime shape at the door: anything may be missing, the bus verifies it. */
export type UnverifiedCommand = Readonly<{
  name?: string;
  payload?: unknown;
  principal?: Principal | null;
  decision?: PolicyDecision | null;
}>;

export type PolicyRequest = Readonly<{ principal: Principal; commandName: string }>;

/** Port to the policy module. Rejecting or returning garbage means "unavailable". */
export type PolicyEvaluator = (request: PolicyRequest) => Promise<PolicyDecision>;

export type CommandHandler = (command: AllowedCommand) => Promise<unknown>;

/** Minimal logging port; the shared Logger satisfies it. */
export type BusLogger = Readonly<{
  warn: (message: string, meta?: Readonly<Record<string, unknown>>) => void;
}>;

export type CommandBus = Readonly<{
  dispatch: (command: UnverifiedCommand) => Promise<unknown>;
}>;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

const isObject = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const isPrincipal = (value: unknown): value is Principal =>
  isObject(value) && isNonEmptyString(value["userId"]) && isNonEmptyString(value["workspaceId"]);

const isDecision = (value: unknown): value is PolicyDecision =>
  isObject(value) && (value["effect"] === "allow" || value["effect"] === "deny");

/** The repo's error boundary recognises plain application-error objects, not Error instances. */
const fail = (error: ReturnType<typeof createApplicationError>): never => {
  throw error;
};

const policyUnavailable = (): never =>
  fail(
    createApplicationError({
      code: ERROR_CODES.policyUnavailable,
      message: ERROR_MESSAGES.policyUnavailable,
      status: HTTP_STATUS.serviceUnavailable,
      details: { retryable: true }
    })
  );

/**
 * Attaches the caller's principal and a policy decision to a command.
 * Fails closed: if policy cannot answer, the result is a retryable error, never an allow.
 */
export const createCommandFactory =
  ({ evaluate }: { readonly evaluate: PolicyEvaluator }) =>
  async <TPayload>(input: {
    readonly name: string;
    readonly payload: TPayload;
    readonly principal: Principal;
  }): Promise<Command<TPayload>> => {
    let decision: unknown;
    try {
      decision = await evaluate({ principal: input.principal, commandName: input.name });
    } catch {
      return policyUnavailable();
    }
    if (!isDecision(decision)) {
      return policyUnavailable();
    }
    return Object.freeze({ ...input, decision: Object.freeze({ ...decision }) });
  };

export const createCommandBus = ({
  handlers,
  logger
}: {
  readonly handlers: Readonly<Record<string, CommandHandler>>;
  readonly logger: BusLogger;
}): CommandBus =>
  Object.freeze({
    dispatch: async (command) => {
      const name = isNonEmptyString(command.name) ? command.name : "unknown";

      // ARC-005: no principal or no decision means the command never reaches a handler.
      if (!isPrincipal(command.principal) || !isDecision(command.decision)) {
        logger.warn("Command refused: principal or policy decision missing.", { command: name });
        return fail(
          createApplicationError({
            code: ERROR_CODES.policyDecisionRequired,
            message: ERROR_MESSAGES.policyDecisionRequired,
            status: HTTP_STATUS.forbidden
          })
        );
      }

      if (command.decision.effect !== "allow") {
        logger.warn("Command refused: policy denied.", {
          command: name,
          ...(command.decision.reason ? { reason: command.decision.reason } : {})
        });
        return fail(
          createApplicationError({
            code: ERROR_CODES.policyDenied,
            message: ERROR_MESSAGES.policyDenied,
            status: HTTP_STATUS.forbidden
          })
        );
      }

      const handler = handlers[name];
      if (!handler) {
        logger.warn("Command refused: no handler registered.", { command: name });
        return fail(
          createApplicationError({
            code: ERROR_CODES.internal,
            message: ERROR_MESSAGES.internal,
            status: HTTP_STATUS.internalServerError
          })
        );
      }

      const result = await handler({
        name,
        payload: command.payload,
        principal: command.principal,
        decision: command.decision
      });
      return result;
    }
  });
