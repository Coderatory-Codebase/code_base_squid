import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Principal } from "../../../types/index.js";
import { createApplicationError } from "../../../errors/index.js";
import { ERROR_CODES, HTTP_STATUS } from "../../../constants/index.js";
import { createAuthGateway, type AuthGateway } from "../db/auth.gateway.js";

const scrypt = promisify(scryptCallback);
const sessionLifetimeMs = 8 * 60 * 60 * 1000;
const keyLength = 64;

const deriveKey = async (password: string, salt: string): Promise<Buffer> =>
  await scrypt(password, salt, keyLength) as Buffer;

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString("hex");
  const key = await deriveKey(password, salt);
  return `scrypt$${salt}$${key.toString("hex")}`;
};

const dummyPasswordHash = hashPassword("workspace-auth-dummy-password");

const verifyPassword = async (password: string, passwordHash: string): Promise<boolean> => {
  const [algorithm, salt, expectedHex] = passwordHash.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHex || !/^[a-f0-9]{128}$/i.test(expectedHex)) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = await deriveKey(password, salt);
  return timingSafeEqual(actual, expected);
};

const hashToken = (token: string): string => createHash("sha256").update(token).digest("hex");

export type AuthService = Readonly<{
  signIn: (email: string, password: string) => Promise<Readonly<{ token: string; expiresAt: Date }>>;
  resolvePrincipal: (token: string | null) => Promise<Principal | null>;
  signOut: (token: string | null) => Promise<void>;
}>;

export const createAuthService = (gateway: AuthGateway = createAuthGateway()): AuthService => ({
  signIn: async (email, password) => {
    const user = await gateway.findUserByEmail(email.trim().toLowerCase());
    const passwordMatches = await verifyPassword(password, user ? user.passwordHash : await dummyPasswordHash);
    if (!user || !passwordMatches) {
      throw createApplicationError({
        code: ERROR_CODES.unauthorized,
        message: "Email or password is incorrect.",
        status: HTTP_STATUS.unauthorized
      }) as Error;
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + sessionLifetimeMs);
    await gateway.createSession({ sessionId: randomBytes(16).toString("hex"), tokenHash: hashToken(token), userId: user.id, expiresAt });
    return { token, expiresAt };
  },
  resolvePrincipal: async (token) => {
    if (!token) return null;
    const session = await gateway.findActiveSession(hashToken(token), new Date());
    if (!session) return null;
    const user = await gateway.findUserById(session.userId);
    return user ? { userId: user.id, workspaceIds: user.workspaceIds } : null;
  },
  signOut: async (token) => {
    if (token) await gateway.deleteSession(hashToken(token));
  }
});
