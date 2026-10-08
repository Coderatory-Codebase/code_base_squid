import { createHash } from "node:crypto";
import type { UserCreatedV1 } from "@workspace/types";
import type { VerifiedIdentity } from "../shared/models/oidc.js";
import type { IdentityUserRecord } from "../shared/models/user.js";
import { SESSION_LIFETIME_MS } from "../shared/models/session.js";
import type {
  IdentitySessionInsert,
  IdentityUserBootstrapPort,
  IdentityUserBootstrapResult,
  IdentityUserTransaction
} from "../shared/ports/user-bootstrap.port.js";

type IdentitySignInDependencies = Readonly<{
  createId: () => string;
  createSessionToken: () => string;
  now: () => Date;
  deviceLabel: string;
}>;

const toSessionInsert = (
  userId: string,
  token: string,
  sessionId: string,
  now: Date,
  device: string
): IdentitySessionInsert => ({
  sessionId,
  tokenHash: createHash("sha256").update(token).digest("hex"),
  userId,
  status: "ACTIVE",
  lastUsedAt: now,
  expiresAt: new Date(now.getTime() + SESSION_LIFETIME_MS),
  device
});

export const createIdentityUserBootstrap = ({
  createId,
  createSessionToken,
  now,
  deviceLabel
}: IdentitySignInDependencies): IdentityUserBootstrapPort => ({
  createUser: async (transaction: IdentityUserTransaction, identity: VerifiedIdentity): Promise<IdentityUserBootstrapResult> => {
    const existing = await transaction.findUserByProviderSubject(identity.provider, identity.subject);
    if (existing?.status === "CLOSED") return { kind: "account-closed" };

    const timestamp = now();
    const user: IdentityUserRecord = existing ?? {
      userId: createId(),
      email: identity.email,
      name: identity.displayName,
      provider: identity.provider,
      subject: identity.subject,
      status: "ACTIVE",
      closedAt: null
    };
    const sessionToken = createSessionToken();
    const sessionId = createId();

    if (!existing) {
      await transaction.insertUser(user);
      const event: UserCreatedV1 = {
        type: "UserCreated",
        version: 1,
        eventId: createId(),
        occurredAt: timestamp.toISOString(),
        payload: {
          userId: user.userId,
          provider: user.provider,
          subject: user.subject,
          email: user.email,
          name: user.name
        }
      };
      await transaction.appendUserCreated(event);
    }

    await transaction.insertSession(toSessionInsert(user.userId, sessionToken, sessionId, timestamp, deviceLabel));
    return { kind: existing ? "existing" : "created", user, sessionToken };
  }
});
