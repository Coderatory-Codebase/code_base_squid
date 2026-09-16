import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_HOST: z.string().min(1).default("127.0.0.1"),
  API_PORT: z.coerce.number().int().min(1).max(65_535).default(4000),
  WEB_ORIGIN: z.url().default("http://localhost:3000"),
  MONGODB_URI: z.string().min(1).optional()
});

export type ApiConfig = Readonly<{
  environment: "development" | "test" | "production";
  host: string;
  port: number;
  webOrigin: string;
  mongodbUri?: string;
}>;

export const readApiConfig = (environment: NodeJS.ProcessEnv = process.env): ApiConfig => {
  const parsed = environmentSchema.parse(environment);
  return Object.freeze({
    environment: parsed.NODE_ENV,
    host: parsed.API_HOST,
    port: parsed.API_PORT,
    webOrigin: parsed.WEB_ORIGIN,
    ...(parsed.MONGODB_URI ? { mongodbUri: parsed.MONGODB_URI } : {})
  });
};
