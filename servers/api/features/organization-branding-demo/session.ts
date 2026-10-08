import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { systemClock } from "@workspace/kernel";

const sessionLifetimeSeconds = 4 * 60 * 60;

export type TemporaryBrandingDemoConfig = Readonly<{
  email: string;
  password: string;
  workspaceId: string;
  sessionSecret: string;
}>;

export type TemporaryBrandingDemoPrincipal = Readonly<{
  email: string;
  workspaceId: string;
}>;

const constantTimeEqual = (left: string, right: string): boolean =>
  timingSafeEqual(createHash("sha256").update(left).digest(), createHash("sha256").update(right).digest());

export const credentialsMatch = (
  config: TemporaryBrandingDemoConfig,
  email: string,
  password: string
): boolean => constantTimeEqual(config.email.trim().toLocaleLowerCase("en-US"), email.trim().toLocaleLowerCase("en-US"))
  && constantTimeEqual(config.password, password);

export const createTemporaryBrandingDemoToken = (
  config: TemporaryBrandingDemoConfig,
  nowSeconds = Math.floor(systemClock.now() / 1000)
): string => {
  const payload = Buffer.from(JSON.stringify({
    email: config.email.trim().toLocaleLowerCase("en-US"),
    workspaceId: config.workspaceId,
    issuedAt: nowSeconds,
    expiresAt: nowSeconds + sessionLifetimeSeconds
  })).toString("base64url");
  const signature = createHmac("sha256", config.sessionSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
};

export const readTemporaryBrandingDemoToken = (
  token: string,
  sessionSecret: string,
  nowSeconds = Math.floor(systemClock.now() / 1000)
): TemporaryBrandingDemoPrincipal | null => {
  const [payload, suppliedSignature, ...extraParts] = token.split(".");
  if (!payload || !suppliedSignature || extraParts.length > 0) return null;
  const expectedSignature = createHmac("sha256", sessionSecret).update(payload).digest("base64url");
  if (!constantTimeEqual(suppliedSignature, expectedSignature)) return null;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof parsed !== "object" || parsed === null) return null;
    const claims = parsed as Record<string, unknown>;
    if (typeof claims.email !== "string" || typeof claims.workspaceId !== "string") return null;
    if (claims.email !== claims.email.trim().toLocaleLowerCase("en-US")) return null;
    if (typeof claims.expiresAt !== "number" || claims.expiresAt <= nowSeconds) return null;
    if (typeof claims.issuedAt !== "number" || claims.issuedAt > nowSeconds + 60) return null;
    return Object.freeze({ email: claims.email, workspaceId: claims.workspaceId });
  } catch {
    return null;
  }
};

export const TEMPORARY_BRANDING_DEMO_SESSION_SECONDS = sessionLifetimeSeconds;
