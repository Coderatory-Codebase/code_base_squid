import { Router, type RequestHandler, type Router as ExpressRouter } from "express";
import { z } from "zod";
import type { TemporaryBrandingReader } from "./gateway.js";
import type { TemporaryBrandingDemoConfig } from "./session.js";
import { createTemporaryBrandingGateway } from "./gateway.js";
import { createTemporaryBrandingDemoToken, credentialsMatch, readTemporaryBrandingDemoToken } from "./session.js";
import { observeOrganizationBrandingRead, type OrganizationBrandingReadSignal } from "./telemetry.js";

const loginBodySchema = z.object({ email: z.email(), password: z.string().min(1) });

type TemporaryBrandingRoutesOptions = Readonly<{
  config: TemporaryBrandingDemoConfig;
  reader: TemporaryBrandingReader;
  emitReadSignal: (signal: OrganizationBrandingReadSignal) => void;
}>;

export const createTemporaryOrganizationBrandingRoutes = ({ config, reader, emitReadSignal }: TemporaryBrandingRoutesOptions): ExpressRouter => {
  const router = Router();
  const gateway = createTemporaryBrandingGateway({ reader });

  router.post("/temporary/organization-branding/login", (request, response) => {
    const body = loginBodySchema.safeParse(request.body);
    if (!body.success || !credentialsMatch(config, body.data.email, body.data.password)) {
      response.setHeader("Cache-Control", "no-store");
      response.status(401).json({ error: "Invalid demo credentials." });
      return;
    }

    response.setHeader("Cache-Control", "no-store");
    response.json({
      token: createTemporaryBrandingDemoToken(config),
      expiresInSeconds: 14_400
    });
  });

  const requireDemoSession: RequestHandler = (request, response, next) => {
    const authorization = request.header("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "";
    const principal = readTemporaryBrandingDemoToken(token, config.sessionSecret);
    if (!principal || principal.workspaceId !== config.workspaceId) {
      response.setHeader("Cache-Control", "no-store");
      response.status(401).json({ error: "Demo session is invalid or expired." });
      return;
    }
    response.locals.temporaryBrandingDemoPrincipal = principal;
    next();
  };

  router.get("/temporary/organization-branding/organizations", requireDemoSession, async (_request, response, next) => {
    try {
      const principal = response.locals.temporaryBrandingDemoPrincipal as Readonly<{ workspaceId: string }>;
      const organizations = await observeOrganizationBrandingRead(
        () => gateway.listForWorkspace(principal),
        { emit: emitReadSignal }
      );
      response.setHeader("Cache-Control", "no-store");
      response.json({
        organizations: organizations.map((organization) => ({
          ...organization,
          organizationName: organization.organizationName ?? organization.organizationId,
          workspaceName: organization.workspaceName ?? principal.workspaceId,
          workspaceId: principal.workspaceId
        }))
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
