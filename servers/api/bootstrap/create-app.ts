import express, { type Express } from "express";
import { createHttpLogger, type Logger } from "@workspace/logging";
import type { ApiConfig } from "../types/index.js";
import { apiRuntime } from "../constants/index.js";
import { createHealthRouter } from "../features/health/index.js";
import { createCorsMiddleware, createErrorHandler, createNotFoundHandler } from "../middleware/index.js";

type AppDependencies = Readonly<{ config: ApiConfig; logger: Logger }>;

export const createApp = ({ config, logger }: AppDependencies): Express => {
  const app = express();
  app.disable("x-powered-by");
  app.use(createHttpLogger({
    logger,
    format: config.environment === "production" ? "combined" : "dev"
  }));
  app.use(createCorsMiddleware({ origin: config.webOrigin }));
  app.use(express.json({ limit: apiRuntime.jsonBodyLimit }));
  const featureRouters = [createHealthRouter({ config })];
  for (const featureRouter of featureRouters) app.use(featureRouter);
  app.use(createNotFoundHandler());
  app.use(createErrorHandler({ logger }));
  return app;
};
