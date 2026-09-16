import express from "express";
import type { ApiConfig } from "../config/environment.js";
import { createCorsMiddleware } from "../middleware/cors.js";
import { createErrorHandler, createNotFoundHandler } from "../middleware/errors.js";
import type { Logger } from "../observability/logger.js";

type AppDependencies = Readonly<{ config: ApiConfig; logger: Logger }>;

export const createApp = ({ config, logger }: AppDependencies) => {
  const app = express();
  app.disable("x-powered-by");
  app.use(createCorsMiddleware({ origin: config.webOrigin }));
  app.use(express.json({ limit: "1mb" }));
  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok", service: "api", environment: config.environment });
  });
  app.use(createNotFoundHandler());
  app.use(createErrorHandler({ logger }));
  return app;
};
