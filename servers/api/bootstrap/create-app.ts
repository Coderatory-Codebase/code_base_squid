import express, { type Express } from "express";
import { createHttpLogger, type Logger } from "@workspace/logging";
import type { ApiConfig } from "../types/index.js";
import { apiRuntime } from "../constants/index.js";
import { createHealthRoutes } from "../features/health/index.js";
import { createAuthRoutes, createAuthService, readBearerToken, type AuthService } from "../features/auth/index.js";
import {
  createOrganizationRoutes,
  createWorkspaceRoutes,
  createWorkspaceRepository,
  type MembersService,
  type OrganizationGateway,
  type OrganizationLifecycleService,
  type OrganizationSettingsReader,
  type OrganizationSettingsUpdater,
  type PrincipalResolver
} from "../features/workspace/index.js";
import { createTemporaryOrganizationBrandingRoutes, type TemporaryBrandingReader } from "../features/organization-branding-demo/index.js";
import { createReadableCollection } from "../integrations/mongodb/index.js";
import { createCorsMiddleware, createErrorHandler, createNotFoundHandler } from "../middleware/index.js";

type AppDependencies = Readonly<{
  config: ApiConfig;
  logger: Logger;
  resolvePrincipal?: PrincipalResolver;
  organizationGateway?: OrganizationGateway;
  membersService?: MembersService;
  lifecycleService?: OrganizationLifecycleService;
  organizationSettingsReader?: OrganizationSettingsReader;
  organizationSettingsUpdater?: OrganizationSettingsUpdater;
  authService?: AuthService;
  temporaryBrandingDemoReader?: TemporaryBrandingReader;
}>;

export const createApp = ({
  config,
  logger,
  resolvePrincipal,
  organizationGateway,
  membersService,
  lifecycleService,
  organizationSettingsReader,
  organizationSettingsUpdater,
  authService = createAuthService(),
  temporaryBrandingDemoReader
}: AppDependencies): Express => {
  const app = express();
  app.disable("x-powered-by");
  app.use(createHttpLogger({
    logger,
    format: config.environment === "production" ? "combined" : "dev"
  }));
  app.use(createCorsMiddleware({ origin: config.webOrigin }));
  app.use(express.json({ limit: apiRuntime.jsonBodyLimit }));

  const authenticatedPrincipal: PrincipalResolver = request => resolvePrincipal
    ? resolvePrincipal(request)
    : authService.resolvePrincipal(readBearerToken(request));
  const users = createReadableCollection<{ _id: string; displayName?: string }>("users", ["_id"]);
  const featureRouters = [
    createHealthRoutes({
      environment: config.environment,
      serviceName: apiRuntime.serviceName
    }),
    createAuthRoutes(authService),
    createOrganizationRoutes({
      webOrigin: config.webOrigin,
      resolvePrincipal: authenticatedPrincipal,
      ...(organizationGateway ? { gateway: organizationGateway } : {}),
      ...(membersService ? { membersService } : {}),
      ...(lifecycleService ? { lifecycleService } : {}),
      ...(organizationSettingsReader ? { settingsReader: organizationSettingsReader } : {}),
      ...(organizationSettingsUpdater ? { settingsUpdater: organizationSettingsUpdater } : {}),
      logger
    }),
    createWorkspaceRoutes({
      repository: createWorkspaceRepository({
        organizations: createReadableCollection("organizations", ["_id", "ownerId"]),
        workspaces: createReadableCollection("workspaces", ["_id", "orgId"]),
        memberships: createReadableCollection("memberships", ["_id", "workspaceId", "userId"]),
        userById: async userId => users.findOne({ _id: userId })
      }),
      resolveWorkspacePrincipal: request => authenticatedPrincipal(request),
      logger
    })
  ];

  if (config.temporaryOrganizationBrandingDemo) {
    if (!temporaryBrandingDemoReader) {
      throw new Error("Temporary organization-branding demo auth requires its workspace reader.");
    }
    featureRouters.push(createTemporaryOrganizationBrandingRoutes({
      config: config.temporaryOrganizationBrandingDemo,
      reader: temporaryBrandingDemoReader,
      emitReadSignal: signal => {
        const context = { ...signal };
        if (signal.outcome === "error" || !signal.withinBudget) {
          logger.warn("Organization branding read signal.", context);
        } else {
          logger.info("Organization branding read signal.", context);
        }
      }
    }));
  }

  for (const featureRouter of featureRouters) app.use(featureRouter);
  app.use(createNotFoundHandler());
  app.use(createErrorHandler({ logger }));
  return app;
};
