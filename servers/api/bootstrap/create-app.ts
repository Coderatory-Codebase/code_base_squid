import express, { type Express } from "express";
import { createHttpLogger, type Logger } from "@workspace/logging";
import type { ApiConfig } from "../types/index.js";
import { apiRuntime } from "../constants/index.js";
import { createUserProfileRoutes, createUserSessionsRoutes, type UserProfileRouteDependencies, type UserSessionsRouteDependencies } from "../features/identity/index.js";
import { createOidcSignInRoutes, type OidcSignInControllerDependencies } from "../features/authentication/index.js";
import { createHealthRoutes } from "../features/health/index.js";
import { createWorkspaceRoutes, type WorkspaceRouteDependencies } from "../features/workspace/index.js";
import { createCorsMiddleware, createErrorHandler, createNotFoundHandler } from "../middleware/index.js";

type AppDependencies = Readonly<{
  config: ApiConfig;
  logger: Logger;
  identity?: UserProfileRouteDependencies;
  identitySessions?: UserSessionsRouteDependencies;
  authentication?: OidcSignInControllerDependencies;
  workspace?: WorkspaceRouteDependencies;
}>;

export const createApp = ({ config, logger, identity, identitySessions, authentication, workspace }: AppDependencies): Express => {
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
  const featureRouters = [
    createHealthRoutes({ environment: config.environment, serviceName: apiRuntime.serviceName }),
    ...(profileRoutes ? [profileRoutes] : []),
    ...(sessionRoutes ? [sessionRoutes] : []),
    ...(workspace ? [createWorkspaceRoutes(workspace)] : []),
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
    })] : [])
  ];
  for (const featureRouter of featureRouters) app.use(featureRouter);
  app.use(createNotFoundHandler());
  app.use(createErrorHandler({ logger }));
  return app;
};
