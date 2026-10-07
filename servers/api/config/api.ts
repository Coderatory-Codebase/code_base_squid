import type { ApiConfig, ValidatedApiEnvironment } from "../types/index.js";

export const createApiConfig = (environment: ValidatedApiEnvironment): ApiConfig => Object.freeze({
  environment: environment.NODE_ENV,
  host: environment.API_HOST,
  port: environment.API_PORT,
  webOrigin: environment.WEB_ORIGIN,
  logFormat: environment.LOG_FORMAT ?? (environment.NODE_ENV === "production" ? "json" : "pretty"),
  logLevel: environment.LOG_LEVEL,
  ...(environment.MONGODB_URI ? { mongodbUri: environment.MONGODB_URI } : {}),
  ...(environment.OIDC_CALLBACK_BASE_URL
    && environment.OIDC_FLOW_COOKIE_KEY
    && (environment.GOOGLE_OIDC_CLIENT_ID || environment.MICROSOFT_OIDC_CLIENT_ID)
    ? {
        oidc: Object.freeze({
          callbackBaseUrl: environment.OIDC_CALLBACK_BASE_URL,
          flowCookieKey: environment.OIDC_FLOW_COOKIE_KEY,
          providers: Object.freeze({
            ...(environment.GOOGLE_OIDC_CLIENT_ID && environment.GOOGLE_OIDC_CLIENT_SECRET ? { google: Object.freeze({
              issuer: new URL("https://accounts.google.com"),
              clientId: environment.GOOGLE_OIDC_CLIENT_ID,
              clientSecret: environment.GOOGLE_OIDC_CLIENT_SECRET
            }) } : {}),
            ...(environment.MICROSOFT_OIDC_ISSUER
              && environment.MICROSOFT_OIDC_CLIENT_ID
              && environment.MICROSOFT_OIDC_CLIENT_SECRET ? { microsoft: Object.freeze({
              issuer: new URL(environment.MICROSOFT_OIDC_ISSUER),
              clientId: environment.MICROSOFT_OIDC_CLIENT_ID,
              clientSecret: environment.MICROSOFT_OIDC_CLIENT_SECRET
            }) } : {})
          })
        })
      }
    : {})
});
