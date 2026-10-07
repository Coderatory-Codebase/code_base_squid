import { z } from "zod";
import type { ValidatedApiEnvironment } from "../types/index.js";

export const apiEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  API_HOST: z.string().min(1),
  API_PORT: z.coerce.number().int().min(1).max(65_535),
  WEB_ORIGIN: z.url(),
  MONGODB_URI: z.string().min(1).optional(),
  TEMP_ORG_BRANDING_DEMO_ENABLED: z.literal("true").optional(),
  TEMP_ORG_BRANDING_DEMO_EMAIL: z.email().optional(),
  TEMP_ORG_BRANDING_DEMO_PASSWORD: z.string().min(16).optional(),
  TEMP_ORG_BRANDING_DEMO_WORKSPACE_ID: z.string().min(1).optional(),
  TEMP_ORG_BRANDING_DEMO_SESSION_SECRET: z.string().min(32).optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
}).superRefine((environment, context) => {
  const demoValues = [
    environment.TEMP_ORG_BRANDING_DEMO_EMAIL,
    environment.TEMP_ORG_BRANDING_DEMO_PASSWORD,
    environment.TEMP_ORG_BRANDING_DEMO_WORKSPACE_ID,
    environment.TEMP_ORG_BRANDING_DEMO_SESSION_SECRET
  ];
  const hasDemoValue = demoValues.some((value) => value !== undefined);
  if (!environment.TEMP_ORG_BRANDING_DEMO_ENABLED && hasDemoValue) {
    context.addIssue({ code: "custom", path: ["TEMP_ORG_BRANDING_DEMO_ENABLED"], message: "Set the explicit enable flag when configuring temporary branding demo auth." });
  }
  if (environment.TEMP_ORG_BRANDING_DEMO_ENABLED) {
    if (environment.NODE_ENV !== "development") {
      context.addIssue({ code: "custom", path: ["TEMP_ORG_BRANDING_DEMO_ENABLED"], message: "Temporary branding demo auth is development-only." });
    }
    if (!environment.MONGODB_URI) {
      context.addIssue({ code: "custom", path: ["MONGODB_URI"], message: "MongoDB is required for temporary branding demo auth." });
    }
    if (demoValues.some((value) => value === undefined)) {
      context.addIssue({ code: "custom", path: ["TEMP_ORG_BRANDING_DEMO_EMAIL"], message: "Configure the demo email, password, trusted workspace ID and session secret together." });
    }
  }
});

export const validatedApiEnvironmentSchema = apiEnvironmentSchema satisfies z.ZodType<ValidatedApiEnvironment>;

export const validateApiEnvironment = (input: unknown): ValidatedApiEnvironment =>
  Object.freeze(validatedApiEnvironmentSchema.parse(input));
