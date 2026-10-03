import type { IdentityProvider } from "./oidc.js";

export const USER_COLLECTION = "users";

export type IdentityUserRecord = Readonly<{
  userId: string;
  email: string;
  name: string;
  provider: IdentityProvider;
  subject: string;
  status: "ACTIVE" | "CLOSED";
  closedAt: Date | null;
}>;