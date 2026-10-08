import type { LogLevel } from "@workspace/logging";
import type { ApiEnvironment } from "@workspace/types";

export type ApiEnvironmentSource = Readonly<Record<string, string | undefined>>;

export type ValidatedApiEnvironment = Readonly<{
  NODE_ENV: ApiEnvironment;
  API_HOST: string;
  API_PORT: number;
  WEB_ORIGIN: string;
  MONGODB_URI?: string | undefined;
  REDIS_URL?: string | undefined;
  TEMP_ORG_BRANDING_DEMO_ENABLED?: "true" | undefined;
  TEMP_ORG_BRANDING_DEMO_EMAIL?: string | undefined;
  TEMP_ORG_BRANDING_DEMO_PASSWORD?: string | undefined;
  TEMP_ORG_BRANDING_DEMO_WORKSPACE_ID?: string | undefined;
  TEMP_ORG_BRANDING_DEMO_SESSION_SECRET?: string | undefined;
  LOG_LEVEL: LogLevel;
}>;
