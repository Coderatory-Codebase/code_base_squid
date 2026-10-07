import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { z } from "zod";
import type { IdentityProvider } from "../identity/public.js";
import type { OidcFlowContext } from "./shared/index.js";

export const OIDC_FLOW_COOKIE_NAME = "squid_oidc_flow";
export const OIDC_FLOW_COOKIE_TTL_SECONDS = 10 * 60;

const flowPayloadSchema = z.object({
  provider: z.enum(["google", "microsoft"]),
  state: z.string().min(16),
  nonce: z.string().min(16),
  codeVerifier: z.string().min(43),
  expiresAt: z.number().int()
});

const additionalData = Buffer.from("squid-oidc-flow-v1", "utf8");

export type OidcFlowCookie = Readonly<{
  seal: (context: OidcFlowContext) => string;
  open: (value: string | undefined, provider: IdentityProvider) => OidcFlowContext | null;
}>;

export type OidcFlowCookieDependencies = Readonly<{
  encryptionKey: Uint8Array;
  now?: () => number;
}>;

export const createOidcFlowCookie = ({ encryptionKey, now = Date.now }: OidcFlowCookieDependencies): OidcFlowCookie => {
  if (encryptionKey.byteLength !== 32) throw new Error("OIDC flow cookie encryption key must be exactly 32 bytes.");
  const key = Buffer.from(encryptionKey);

  return Object.freeze({
    seal: (context) => {
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      cipher.setAAD(additionalData);
      const payload = Buffer.from(JSON.stringify({
        ...context,
        expiresAt: now() + OIDC_FLOW_COOKIE_TTL_SECONDS * 1_000
      }), "utf8");
      const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
      const tag = cipher.getAuthTag();
      return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
    },
    open: (value, provider) => {
      if (!value) return null;
      const parts = value.split(".");
      if (parts.length !== 3) return null;

      try {
        const [encodedIv, encodedTag, encodedCiphertext] = parts;
        if (!encodedIv || !encodedTag || !encodedCiphertext) return null;
        const iv = Buffer.from(encodedIv, "base64url");
        const tag = Buffer.from(encodedTag, "base64url");
        const ciphertext = Buffer.from(encodedCiphertext, "base64url");
        if (iv.length !== 12 || tag.length !== 16 || ciphertext.length === 0) return null;

        const decipher = createDecipheriv("aes-256-gcm", key, iv);
        decipher.setAAD(additionalData);
        decipher.setAuthTag(tag);
        const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
        const payload = flowPayloadSchema.safeParse(JSON.parse(plaintext) as unknown);
        if (!payload.success || payload.data.provider !== provider || payload.data.expiresAt <= now()) return null;

        return {
          provider: payload.data.provider,
          state: payload.data.state,
          nonce: payload.data.nonce,
          codeVerifier: payload.data.codeVerifier
        };
      } catch {
        return null;
      }
    }
  });
};
