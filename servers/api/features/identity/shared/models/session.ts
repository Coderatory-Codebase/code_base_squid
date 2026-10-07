export const SESSION_COLLECTION = "sessions";
export const SESSION_LIFETIME_MS = 14 * 24 * 60 * 60 * 1_000;

export type SessionRecord = Readonly<{
  sessionId: string;
  tokenHash: string;
  userId: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  lastUsedAt: Date;
  expiresAt: Date;
  device: string;
}>;

export type ActiveSession = Readonly<{
  sessionId: string;
  userId: string;
}>;

export type UserSession = Readonly<{
  sessionId: string;
  userId: string;
  device: string;
  lastUsedAt: Date;
  expiresAt: Date;
}>;
