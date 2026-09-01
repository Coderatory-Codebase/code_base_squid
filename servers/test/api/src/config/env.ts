import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required("MONGO_URI", "mongodb://127.0.0.1:27017/nut-shyll"),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
  accessTokenSecret: required("ACCESS_TOKEN_SECRET", "dev-access-secret-change-me"),
  refreshTokenSecret: required("REFRESH_TOKEN_SECRET", "dev-refresh-secret-change-me"),
  accessTokenTtl: "15m",
  refreshTokenTtl: "7d",
} as const;

export const isProduction = env.nodeEnv === "production";
