import {
  validateApiEnvironment
} from "../validation/env.validation.js";
import type { ApiEnvironmentSource, ValidatedApiEnvironment } from "../types/index.js";

export const readApiEnvironment = (
  source: ApiEnvironmentSource = process.env
): ValidatedApiEnvironment => validateApiEnvironment({
  NODE_ENV: source.NODE_ENV,
  API_HOST: source.API_HOST,
  API_PORT: source.API_PORT,
  WEB_ORIGIN: source.WEB_ORIGIN,
  LOG_FORMAT: source.LOG_FORMAT,
  MONGODB_URI: source.MONGODB_URI,
  OIDC_CALLBACK_BASE_URL: source.OIDC_CALLBACK_BASE_URL,
  OIDC_FLOW_COOKIE_KEY: source.OIDC_FLOW_COOKIE_KEY,
  GOOGLE_OIDC_CLIENT_ID: source.GOOGLE_OIDC_CLIENT_ID,
  GOOGLE_OIDC_CLIENT_SECRET: source.GOOGLE_OIDC_CLIENT_SECRET,
  MICROSOFT_OIDC_ISSUER: source.MICROSOFT_OIDC_ISSUER,
  MICROSOFT_OIDC_CLIENT_ID: source.MICROSOFT_OIDC_CLIENT_ID,
  MICROSOFT_OIDC_CLIENT_SECRET: source.MICROSOFT_OIDC_CLIENT_SECRET,
  REDIS_URL: source.REDIS_URL,
  LOG_LEVEL: source.LOG_LEVEL
});
