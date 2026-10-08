import { z } from "zod";
import type { ValidatedApiEnvironment } from "../types/index.js";

export const apiEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  API_HOST: z.string().min(1),
  API_PORT: z.coerce.number().int().min(1).max(65_535),
  WEB_ORIGIN: z.url(),
  LOG_FORMAT: z.enum(["json", "pretty"]).optional(),
  MONGODB_URI: z.string().min(1).optional(),
  OIDC_CALLBACK_BASE_URL: z.url().optional(),
  OIDC_FLOW_COOKIE_KEY: z.string().optional(),
  GOOGLE_OIDC_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_OIDC_CLIENT_SECRET: z.string().min(1).optional(),
  MICROSOFT_OIDC_ISSUER: z.url().optional(),
  MICROSOFT_OIDC_CLIENT_ID: z.string().min(1).optional(),
  MICROSOFT_OIDC_CLIENT_SECRET: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
}).superRefine((environment, context) => {
  const googleConfigured = Boolean(environment.GOOGLE_OIDC_CLIENT_ID || environment.GOOGLE_OIDC_CLIENT_SECRET);
  const microsoftConfigured = Boolean(environment.MICROSOFT_OIDC_CLIENT_ID || environment.MICROSOFT_OIDC_CLIENT_SECRET);
  const oidcConfigured = googleConfigured || microsoftConfigured;

  if (Boolean(environment.GOOGLE_OIDC_CLIENT_ID) !== Boolean(environment.GOOGLE_OIDC_CLIENT_SECRET)) {
    context.addIssue({
      code: "custom",
      path: ["GOOGLE_OIDC_CLIENT_SECRET"],
      message: "Google OIDC client ID and secret must be configured together."
    });
  }
  if (Boolean(environment.MICROSOFT_OIDC_CLIENT_ID) !== Boolean(environment.MICROSOFT_OIDC_CLIENT_SECRET)) {
    context.addIssue({
      code: "custom",
      path: ["MICROSOFT_OIDC_CLIENT_SECRET"],
      message: "Microsoft OIDC client ID and secret must be configured together."
    });
  }
  if (microsoftConfigured && !environment.MICROSOFT_OIDC_ISSUER) {
    context.addIssue({
      code: "custom",
      path: ["MICROSOFT_OIDC_ISSUER"],
      message: "Microsoft OIDC issuer must be configured with its client credentials."
    });
  }
  if (oidcConfigured) {
    if (!environment.OIDC_CALLBACK_BASE_URL) {
      context.addIssue({
        code: "custom",
        path: ["OIDC_CALLBACK_BASE_URL"],
        message: "OIDC callback base URL is required when a provider is configured."
      });
    }
    if (!environment.OIDC_FLOW_COOKIE_KEY
      || Buffer.from(environment.OIDC_FLOW_COOKIE_KEY, "base64url").length !== 32) {
      context.addIssue({
        code: "custom",
        path: ["OIDC_FLOW_COOKIE_KEY"],
        message: "OIDC flow cookie key must be a base64url-encoded 32-byte key."
      });
    }
  }
}) satisfies z.ZodType<ValidatedApiEnvironment>;

export const validateApiEnvironment = (input: unknown): ValidatedApiEnvironment =>
  Object.freeze(apiEnvironmentSchema.parse(input));
