import type { NextFunction, Request, Response } from "express";
import { performance } from "node:perf_hooks";
import type { Logger } from "@workspace/logging";

export type OrganizationSignalLogger = Pick<Logger, "info">;

export type OrganizationSignalDependencies = Readonly<{
  logger: OrganizationSignalLogger;
}>;

const resolveOperation = (request: Pick<Request, "method">): "listOrganizations" | "createOrganization" => {
  if (request.method === "POST") return "createOrganization";
  return "listOrganizations";
};

export const createOrganizationRequestSignal = ({ logger }: OrganizationSignalDependencies) =>
  (request: Pick<Request, "method" | "path" | "query">, response: Pick<Response, "statusCode" | "once">, next: NextFunction): void => {
    const startedAt = performance.now();
    response.once("finish", () => {
      const statusCode = response.statusCode;
      const rawOffset = request.query.offset;
      const pageOffset = request.method === "GET"
        && request.path === "/organizations"
        && (rawOffset === undefined
          || (typeof rawOffset === "string" && /^\d+$/u.test(rawOffset)
            && Number.isSafeInteger(Number(rawOffset)) && Number(rawOffset) <= 500_000))
        ? Number(rawOffset ?? 0)
        : null;
      logger.info("organization.request.signal", {
        workspace: "Platform",
        module: "workspace",
        operation: resolveOperation(request),
        method: request.method,
        path: request.path,
        statusCode,
        outcome: statusCode >= 400 ? "error" : "success",
        durationMs: Number((performance.now() - startedAt).toFixed(2)),
        ...(pageOffset === null ? {} : { pageOffset })
      });
    });
    next();
  };
