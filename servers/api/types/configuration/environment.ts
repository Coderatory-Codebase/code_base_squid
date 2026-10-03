import type { LogLevel } from "@workspace/logging";
import type { ApiEnvironment } from "@workspace/types";

export type ApiEnvironmentSource = Readonly<Record<string, string | undefined>>;

export type ValidatedApiEnvironment = Readonly<{
  NODE_ENV: ApiEnvironment;
  API_HOST: string;
  API_PORT: number;
  WEB_ORIGIN: string;
  MONGODB_URI?: string | undefined;
  OIDC_CALLBACK_BASE_URL?: string | undefined;
  OIDC_FLOW_COOKIE_KEY?: string | undefined;
  GOOGLE_OIDC_CLIENT_ID?: string | undefined;
  GOOGLE_OIDC_CLIENT_SECRET?: string | undefined;
  MICROSOFT_OIDC_ISSUER?: string | undefined;
  MICROSOFT_OIDC_CLIENT_ID?: string | undefined;
  MICROSOFT_OIDC_CLIENT_SECRET?: string | undefined;
  LOG_LEVEL: LogLevel;
}>;
