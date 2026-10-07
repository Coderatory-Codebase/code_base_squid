import express, { type Express } from "express";
import { createHttpLogger, type Logger } from "@workspace/logging";
import type { ApiConfig } from "../types/index.js";
import { apiRuntime } from "../constants/index.js";
import { createHealthRoutes } from "../features/health/index.js";
import { createAuthRoutes, createAuthService, readBearerToken, type AuthService } from "../features/auth/index.js";
import {
  createOrganizationRoutes,
  type MembersService,
  type OrganizationGateway,
  type PrincipalResolver
} from "../features/workspace/index.js";
import { createCorsMiddleware, createErrorHandler, createNotFoundHandler } from "../middleware/index.js";

type AppDependencies = Readonly<{
  config: ApiConfig;
  logger: Logger;
  resolvePrincipal?: PrincipalResolver;
  organizationGateway?: OrganizationGateway;
  membersService?: MembersService;
  authService?: AuthService;
}>;

export const createApp = ({
  config,
  logger,
  resolvePrincipal,
  organizationGateway,
  membersService,
  authService = createAuthService()
}: AppDependencies): Express => {
  const app = express();
  app.disable("x-powered-by");
  app.use(createHttpLogger({
    logger,
    format: config.environment === "production" ? "combined" : "dev"
  }));
  app.use(createCorsMiddleware({ origin: config.webOrigin }));
  app.use(express.json({ limit: apiRuntime.jsonBodyLimit }));

  const featureRouters = [
    createHealthRoutes({
      environment: config.environment,
      serviceName: apiRuntime.serviceName
    }),
    createAuthRoutes(authService),
    createOrganizationRoutes({
      webOrigin: config.webOrigin,
      resolvePrincipal: resolvePrincipal ?? ((request) => authService.resolvePrincipal(readBearerToken(request))),
      ...(organizationGateway ? { gateway: organizationGateway } : {}),
      ...(membersService ? { membersService } : {}),
      logger
    })
  ];

  for (const featureRouter of featureRouters) app.use(featureRouter);
  app.use(createNotFoundHandler());
  app.use(createErrorHandler({ logger }));
  return app;
};
