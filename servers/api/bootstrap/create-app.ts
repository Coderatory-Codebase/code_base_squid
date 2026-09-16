import express from "express";
import { createHttpLogger, type Logger } from "@workspace/logging";
import type { ApiConfig } from "../config/api.js";
import { apiRuntime } from "../constants/runtime.js";
import { createCorsMiddleware } from "../middleware/cors.js";
import { createErrorHandler, createNotFoundHandler } from "../middleware/errors.js";

type AppDependencies = Readonly<{ config: ApiConfig; logger: Logger }>;

export const createApp = ({ config, logger }: AppDependencies) => {
  const app = express();
  app.disable("x-powered-by");
  app.use(createHttpLogger({
    logger,
    format: config.environment === "production" ? "combined" : "dev"
  }));
  app.use(createCorsMiddleware({ origin: config.webOrigin }));
  app.use(express.json({ limit: apiRuntime.jsonBodyLimit }));
  app.get("/health", (_request, response) => {
    response.status(200).json({ status: "ok", service: apiRuntime.serviceName, environment: config.environment });
  });
  app.use(createNotFoundHandler());
  app.use(createErrorHandler({ logger }));
  return app;
};
