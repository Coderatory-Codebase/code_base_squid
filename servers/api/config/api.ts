import type { ApiConfig, ValidatedApiEnvironment } from "../types/index.js";

export const createApiConfig = (environment: ValidatedApiEnvironment): ApiConfig => Object.freeze({
  environment: environment.NODE_ENV,
  host: environment.API_HOST,
  port: environment.API_PORT,
  webOrigin: environment.WEB_ORIGIN,
  logLevel: environment.LOG_LEVEL,
  ...(environment.MONGODB_URI ? { mongodbUri: environment.MONGODB_URI } : {}),
  ...(environment.REDIS_URL ? { redisUrl: environment.REDIS_URL } : {}),
  ...(environment.TEMP_ORG_BRANDING_DEMO_ENABLED === "true" && environment.TEMP_ORG_BRANDING_DEMO_EMAIL && environment.TEMP_ORG_BRANDING_DEMO_PASSWORD && environment.TEMP_ORG_BRANDING_DEMO_WORKSPACE_ID && environment.TEMP_ORG_BRANDING_DEMO_SESSION_SECRET
    ? { temporaryOrganizationBrandingDemo: Object.freeze({
      email: environment.TEMP_ORG_BRANDING_DEMO_EMAIL,
      password: environment.TEMP_ORG_BRANDING_DEMO_PASSWORD,
      workspaceId: environment.TEMP_ORG_BRANDING_DEMO_WORKSPACE_ID,
      sessionSecret: environment.TEMP_ORG_BRANDING_DEMO_SESSION_SECRET
    }) }
    : {})
});
