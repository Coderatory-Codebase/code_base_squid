import express, { type Express } from "express";
import { createHttpLogger, type Logger } from "@workspace/logging";
import type { ApiConfig } from "../types/index.js";
import { apiRuntime } from "../constants/index.js";
import { createUserProfileRoutes, createUserSessionsRoutes, type UserProfileRouteDependencies, type UserSessionsRouteDependencies } from "../features/identity/index.js";
import { createOidcSignInRoutes, type OidcSignInControllerDependencies } from "../features/authentication/index.js";
import { createHealthRoutes } from "../features/health/index.js";
import { createAuthRoutes, createAuthService, readBearerToken, type AuthService } from "../features/auth/index.js";
import {
  createOrganizationRoutes,
  createWorkspaceRoutes,
  createWorkspaceRepository,
  type MembersService,
  type OrganizationGateway,
  type OrganizationLifecycleService,
  type PrincipalResolver
} from "../features/workspace/index.js";
import { createTemporaryOrganizationBrandingRoutes, type TemporaryBrandingReader } from "../features/organization-branding-demo/index.js";
import { createReadableCollection } from "../integrations/mongodb/index.js";
import { createCorsMiddleware, createErrorHandler, createNotFoundHandler } from "../middleware/index.js";

type AppDependencies = Readonly<{
  config: ApiConfig;
  logger: Logger;
  identity?: UserProfileRouteDependencies;
  identitySessions?: UserSessionsRouteDependencies;
  authentication?: OidcSignInControllerDependencies;
  resolvePrincipal?: PrincipalResolver;
  organizationGateway?: OrganizationGateway;
  membersService?: MembersService;
  lifecycleService?: OrganizationLifecycleService;
  authService?: AuthService;
  temporaryBrandingDemoReader?: TemporaryBrandingReader;
}>;

export const createApp = ({
  config, logger, identity, identitySessions, authentication,
  resolvePrincipal, organizationGateway, membersService, lifecycleService,
  authService = createAuthService(), temporaryBrandingDemoReader
}: AppDependencies): Express => {
  const app = express();
  app.disable("x-powered-by");
  app.use(createHttpLogger({
    logger,
    format: config.environment === "production" ? "combined" : "dev"
  }));
  app.use(createCorsMiddleware({ origin: config.webOrigin }));
  app.use(express.json({ limit: apiRuntime.jsonBodyLimit }));
  const profileRoutes = identity
    ? createUserProfileRoutes({
        ...identity,
        recordProfileSignal: (signal) => {
          identity.recordProfileSignal?.(signal);
          const write = signal.outcome === "error" ? logger.error : logger.info;
          write("Identity user profile gateway query.", signal);
        }
      })
    : undefined;
  const sessionRoutes = identitySessions
    ? createUserSessionsRoutes({
        ...identitySessions,
        recordSessionAudit: (event) => {
          identitySessions.recordSessionAudit?.(event);
          logger.warn("Identity session revocation attempted.", event);
        }
      })
    : undefined;
  const authenticatedPrincipal: PrincipalResolver = request => resolvePrincipal
    ? resolvePrincipal(request)
    : authService.resolvePrincipal(readBearerToken(request));
  const users = createReadableCollection<{ _id: string; displayName?: string }>("users", ["_id"]);
  const featureRouters = [
    createHealthRoutes({ environment: config.environment, serviceName: apiRuntime.serviceName }),
    ...(profileRoutes ? [profileRoutes] : []),
    ...(sessionRoutes ? [sessionRoutes] : []),
    ...(authentication ? [createOidcSignInRoutes({
      ...authentication,
      recordInvalidSignIn: () => {
        authentication.recordInvalidSignIn?.();
        logger.warn("Identity sign-in verification failed.", {
          event: "identity.sign_in.failed",
          module: "identity",
          increment: 1
        });
      },
      recordSignInSignal: (signal) => {
        authentication.recordSignInSignal?.(signal);
        const write = signal.outcome === "error" ? logger.error : logger.info;
        write("Identity sign-in callback completed.", signal);
      }
    })] : []),
    createAuthRoutes(authService),
    createOrganizationRoutes({
      webOrigin: config.webOrigin,
      resolvePrincipal: authenticatedPrincipal,
      ...(organizationGateway ? { gateway: organizationGateway } : {}),
      ...(membersService ? { membersService } : {}),
      ...(lifecycleService ? { lifecycleService } : {}),
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
    if (!temporaryBrandingDemoReader) throw new Error("Temporary organization-branding demo auth requires its workspace reader.");
    featureRouters.push(createTemporaryOrganizationBrandingRoutes({
      config: config.temporaryOrganizationBrandingDemo,
      reader: temporaryBrandingDemoReader,
      emitReadSignal: signal => {
        const write = signal.outcome === "error" || !signal.withinBudget ? logger.warn : logger.info;
        write("Organization branding read signal.", { ...signal });
      }
    }));
  }
  for (const featureRouter of featureRouters) app.use(featureRouter);
  app.use(createNotFoundHandler());
  app.use(createErrorHandler({ logger }));
  return app;
};
