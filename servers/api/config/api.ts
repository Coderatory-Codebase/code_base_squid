import type { LogLevel } from "@workspace/logging";
import type { ValidatedApiEnvironment } from "../validation/env.validation.js";

export type ApiConfig = Readonly<{
  environment: "development" | "test" | "production";
  host: string;
  port: number;
  webOrigin: string;
  mongodbUri?: string;
  logLevel: LogLevel;
}>;

export const createApiConfig = (environment: ValidatedApiEnvironment): ApiConfig => Object.freeze({
  environment: environment.NODE_ENV,
  host: environment.API_HOST,
  port: environment.API_PORT,
  webOrigin: environment.WEB_ORIGIN,
  logLevel: environment.LOG_LEVEL,
  ...(environment.MONGODB_URI ? { mongodbUri: environment.MONGODB_URI } : {})
});
