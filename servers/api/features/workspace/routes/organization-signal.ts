import type { NextFunction, Request, Response } from "express";
import { performance } from "node:perf_hooks";
import type { Logger } from "@workspace/logging";

export type OrganizationSignalLogger = Pick<Logger, "info">;

export type OrganizationSignalDependencies = Readonly<{
  logger: OrganizationSignalLogger;
}>;

const isSettingsUpdate = (request: Pick<Request, "method" | "path">): boolean =>
  request.method === "PATCH" && /^\/organizations\/[^/]+\/settings$/u.test(request.path);

const resolveOperation = (request: Pick<Request, "method" | "path">): string => {
  if (isSettingsUpdate(request)) return "update";
  if (request.method === "POST" && request.path.endsWith("/invitations/accept")) return "acceptInvitation";
  if (request.method === "POST" && request.path.endsWith("/invitations")) return "createInvitation";
  if (request.method === "POST") return "createOrganization";
  if (request.method === "PATCH" && request.path.endsWith("/lifecycle")) return "transitionOrganizationLifecycle";
  if (request.method === "PATCH") return "updateMemberRole";
  if (request.method === "DELETE") return "removeMember";
  if (request.method === "GET" && request.path.endsWith("/dashboard")) return "getOrganizationDashboard";
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
        ...(isSettingsUpdate(request) ? { feature: "organization-settings" } : {}),
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
