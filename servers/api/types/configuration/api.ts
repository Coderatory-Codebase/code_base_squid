import type { LogLevel } from "@workspace/logging";
import type { ApiEnvironment } from "@workspace/types";

export type ApiConfig = Readonly<{
  environment: ApiEnvironment;
  host: string;
  port: number;
  webOrigin: string;
  mongodbUri?: string;
  redisUrl?: string;
  temporaryOrganizationBrandingDemo?: Readonly<{
    email: string;
    password: string;
    workspaceId: string;
    sessionSecret: string;
  }>;
  logLevel: LogLevel;
}>;
