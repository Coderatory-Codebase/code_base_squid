import express, { type Express } from "express";
import { createHttpLogger, type Logger } from "@workspace/logging";
import type { ApiHealthResponse } from "@workspace/types";
import type { ApiConfig } from "../types/index.js";
import { apiRuntime } from "../constants/runtime.js";
import { HTTP_STATUS } from "../constants/http.js";
import { createCorsMiddleware } from "../middleware/cors.js";
import { createErrorHandler, createNotFoundHandler } from "../middleware/errors.js";

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
  app.get("/health", (_request, response) => {
    const health: ApiHealthResponse = { status: "ok", service: apiRuntime.serviceName, environment: config.environment };
    response.status(HTTP_STATUS.ok).json(health);
  });
  app.use(createNotFoundHandler());
  app.use(createErrorHandler({ logger }));
  return app;
};
