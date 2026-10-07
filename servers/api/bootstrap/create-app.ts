import express, { type Express } from "express";
import { createHttpLogger, type Logger } from "@workspace/logging";
import type { ApiConfig } from "../types/index.js";
import { apiRuntime } from "../constants/index.js";
import { createHealthRoutes } from "../features/health/index.js";
import { createTemporaryOrganizationBrandingRoutes, type TemporaryBrandingReader } from "../features/organization-branding-demo/index.js";
import { createCorsMiddleware, createErrorHandler, createNotFoundHandler } from "../middleware/index.js";

type AppDependencies = Readonly<{
  config: ApiConfig;
  logger: Logger;
  temporaryBrandingDemoReader?: TemporaryBrandingReader;
}>;

export const createApp = ({ config, logger, temporaryBrandingDemoReader }: AppDependencies): Express => {
  const app = express();
  app.disable("x-powered-by");
  app.use(createHttpLogger({
    logger,
    format: config.environment === "production" ? "combined" : "dev"
  }));
  app.use(createCorsMiddleware({ origin: config.webOrigin }));
  app.use(express.json({ limit: apiRuntime.jsonBodyLimit }));
  const featureRouters = [createHealthRoutes({
    environment: config.environment,
    serviceName: apiRuntime.serviceName
  })];
  if (config.temporaryOrganizationBrandingDemo) {
    if (!temporaryBrandingDemoReader) {
      throw new Error("Temporary organization-branding demo auth requires its workspace reader.");
    }
    featureRouters.push(createTemporaryOrganizationBrandingRoutes({
      config: config.temporaryOrganizationBrandingDemo,
      reader: temporaryBrandingDemoReader,
      emitReadSignal: (signal) => {
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
