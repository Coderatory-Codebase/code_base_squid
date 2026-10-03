import express, { type Express } from "express";
import { createHttpLogger, type Logger } from "@workspace/logging";
import type { ApiConfig } from "../types/index.js";
import { apiRuntime } from "../constants/index.js";
import { createUserProfileRoutes, type UserProfileRouteDependencies } from "../features/identity/index.js";
import { createOidcSignInRoutes, type OidcSignInControllerDependencies } from "../features/authentication/index.js";
import { createHealthRoutes } from "../features/health/index.js";
import { createCorsMiddleware, createErrorHandler, createNotFoundHandler } from "../middleware/index.js";

type AppDependencies = Readonly<{
  config: ApiConfig;
  logger: Logger;
  identity?: UserProfileRouteDependencies;
  authentication?: OidcSignInControllerDependencies;
}>;

export const createApp = ({ config, logger, identity, authentication }: AppDependencies): Express => {
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
  const featureRouters = [
    createHealthRoutes({ environment: config.environment, serviceName: apiRuntime.serviceName }),
    ...(profileRoutes ? [profileRoutes] : []),
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
