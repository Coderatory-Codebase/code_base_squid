import { Router, type RequestHandler } from "express";
import type { ApiHealthResponse } from "@workspace/types";
import { apiRuntime, HTTP_STATUS } from "../../constants/index.js";
import type { ApiConfig } from "../../types/index.js";

export type HealthRouteDependencies = Readonly<{
  config: Pick<ApiConfig, "environment">;
}>;

export const createHealthRouter = ({ config }: HealthRouteDependencies): Router => {
  const router = Router();
  const getHealth: RequestHandler = (_request, response) => {
    const health: ApiHealthResponse = {
      status: "ok",
      service: apiRuntime.serviceName,
      environment: config.environment
    };
    response.status(HTTP_STATUS.ok).json(health);
  };

  router.get("/health", getHealth);
  return router;
};
