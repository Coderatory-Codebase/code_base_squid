import type { LogLevel } from "@workspace/logging";

export type ApiEnvironmentName = "development" | "test" | "production";

export type ApiEnvironmentSource = Readonly<Record<string, string | undefined>>;

export type ValidatedApiEnvironment = Readonly<{
  NODE_ENV: ApiEnvironmentName;
  API_HOST: string;
  API_PORT: number;
  WEB_ORIGIN: string;
  MONGODB_URI?: string | undefined;
  LOG_LEVEL: LogLevel;
}>;
