import { createHash } from "node:crypto";
import type { ActiveSession, SessionQueryPort } from "../identity/public.js";

export const SESSION_COOKIE_NAME = "squid_session";

type SessionCookieResolverDependencies = Readonly<{ sessions: SessionQueryPort; now?: () => Date }>;

const getSessionToken = (cookieHeader: string | undefined): string | null => {
  if (!cookieHeader) return null;

  const values = cookieHeader.split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (values.length !== 1) return null;

  const token = values[0]?.slice(SESSION_COOKIE_NAME.length + 1);
  return token && /^[A-Za-z0-9_-]{32,256}$/.test(token) ? token : null;
};

export const createSessionCookieResolver = ({
  sessions,
  now = () => new Date()
}: SessionCookieResolverDependencies): ((cookieHeader: string | undefined) => Promise<ActiveSession | null>) =>
  async (cookieHeader) => {
    const token = getSessionToken(cookieHeader);
    if (!token) return null;
    const tokenHash = createHash("sha256").update(token).digest("hex");
    return sessions.findAndTouchActiveByTokenHash(tokenHash, now());
  };
