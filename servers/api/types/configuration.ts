import type { LogLevel } from "@workspace/logging";
import type { ApiEnvironmentName } from "./environment.js";

export type ApiConfig = Readonly<{
  environment: ApiEnvironmentName;
  host: string;
  port: number;
  webOrigin: string;
  mongodbUri?: string;
  logLevel: LogLevel;
}>;
