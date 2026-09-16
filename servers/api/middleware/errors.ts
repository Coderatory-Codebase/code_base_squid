import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import type { Logger } from "../observability/logger.js";

export type ApplicationError = Readonly<{
  kind: "application-error";
  code: string;
  message: string;
  status: number;
}>;

export const createApplicationError = (input: Omit<ApplicationError, "kind">): ApplicationError => ({
  kind: "application-error",
  ...input
});

const isApplicationError = (error: unknown): error is ApplicationError =>
  typeof error === "object" && error !== null && "kind" in error && error.kind === "application-error";

export const createNotFoundHandler = (): RequestHandler => (request, _response, next) => {
  next(createApplicationError({
    code: "route_not_found",
    message: `Route ${request.method} ${request.path} was not found.`,
    status: 404
  }));
};

export const createErrorHandler = ({ logger }: { logger: Logger }): ErrorRequestHandler =>
  (error: unknown, _request, response, _next) => {
    if (error instanceof ZodError) {
      response.status(400).json({ error: { code: "validation_error", message: "Request validation failed.", details: error.issues } });
      return;
    }
    if (isApplicationError(error)) {
      response.status(error.status).json({ error: { code: error.code, message: error.message } });
      return;
    }
    logger.error("Unhandled API error.", { error: error instanceof Error ? error.message : String(error) });
    response.status(500).json({ error: { code: "internal_error", message: "An unexpected error occurred." } });
  };
