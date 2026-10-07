import type { LogLevel } from "@workspace/logging";
import type { ApiEnvironment } from "@workspace/types";

export type OidcProviderSettings = Readonly<{
  issuer: URL;
  clientId: string;
  clientSecret: string;
}>;

export type OidcApiConfiguration = Readonly<{
  callbackBaseUrl: string;
  flowCookieKey: string;
  providers: Readonly<Partial<Record<"google" | "microsoft", OidcProviderSettings>>>;
}>;

export type ApiConfig = Readonly<{
  environment: ApiEnvironment;
  host: string;
  port: number;
  webOrigin: string;
  logFormat: "json" | "pretty";
  mongodbUri?: string;
  redisUrl?: string;
  oidc?: OidcApiConfiguration;
  logLevel: LogLevel;
}>;
