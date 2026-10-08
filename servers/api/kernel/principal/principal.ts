import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../../constants/index.js";
import { createApplicationError } from "../../errors/index.js";

export const PRINCIPAL_CACHE_TTL_SECONDS = 60;
const ACTIVE = "ACTIVE";

/** The only principal shape a request may become: all fields, never partial. */
export type ResolvedPrincipal = Readonly<{
  userId: string;
  orgId: string;
  workspaceId: string;
  role: string;
  guest: boolean;
  membershipStatus: string;
  workspaceStatus: string;
  orgStatus: string;
}>;

/** What Identity.principalFor answers for a session. */
export type SessionIdentity = Readonly<{
  userId: string;
  status: string;
  expiresAt: Date;
}>;

/** What Workspace.membershipOf answers, completed with workspace and organization status. */
export type Membership = Readonly<{
  orgId: string;
  role: string;
  guest: boolean;
  membershipStatus: string;
  workspaceStatus: string;
  orgStatus: string;
}>;

/** Port implemented by Identity. null means no such session. */
export type IdentityPort = Readonly<{
  principalFor: (sessionId: string) => Promise<SessionIdentity | null>;
}>;

/** Port implemented by Workspace. null means the user is not a member of the workspace. */
export type WorkspacePort = Readonly<{
  membershipOf: (input: { userId: string; workspaceId: string }) => Promise<Membership | null>;
}>;

/** Port implemented by the Redis integration. */
export type PrincipalCache = Readonly<{
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: ResolvedPrincipal, ttlSeconds: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
}>;

export type PrincipalLogger = Readonly<{
  warn: (message: string, meta?: Readonly<Record<string, unknown>>) => void;
}>;

export type PrincipalRequest = Readonly<{ sessionId: string; workspaceId: string }>;

export type PrincipalResolver = Readonly<{
  resolve: (request: PrincipalRequest) => Promise<ResolvedPrincipal>;
}>;

type PrincipalKey = Readonly<{ userId: string; workspaceId: string }>;

export const principalCacheKey = ({ userId, workspaceId }: PrincipalKey): string =>
  `principal:${encodeURIComponent(userId)}:${encodeURIComponent(workspaceId)}`;

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null;

const isText = (value: unknown): value is string => typeof value === "string" && value.length > 0;

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

const isSessionIdentity = (value: unknown): value is SessionIdentity =>
  isRecord(value) && isText(value["userId"]) && isText(value["status"]) && isValidDate(value["expiresAt"]);

const isMembership = (value: unknown): value is Membership =>
  isRecord(value) &&
  isText(value["orgId"]) &&
  isText(value["role"]) &&
  typeof value["guest"] === "boolean" &&
  isText(value["membershipStatus"]) &&
  isText(value["workspaceStatus"]) &&
  isText(value["orgStatus"]);

const isResolvedPrincipal = (value: unknown): value is ResolvedPrincipal =>
  isRecord(value) && isText(value["userId"]) && isText(value["workspaceId"]) && isMembership(value);

/** The repo's error boundary recognises plain application-error objects, not Error instances. */
const fail = (error: ReturnType<typeof createApplicationError>): never => {
  throw error;
};

const unauthenticated = (): never =>
  fail(
    createApplicationError({
      code: ERROR_CODES.unauthenticated,
      message: ERROR_MESSAGES.unauthenticated,
      status: HTTP_STATUS.unauthorized    })
  );

const forbidden = (): never =>
  fail(
    createApplicationError({
      code: ERROR_CODES.forbidden,
      message: ERROR_MESSAGES.forbidden,
      status: HTTP_STATUS.forbidden
    })
  );

/** An input could not answer: retryable, and never turned into a principal. */
const unavailable = (): never =>
  fail(
    createApplicationError({
      code: ERROR_CODES.principalUnavailable,
      message: ERROR_MESSAGES.principalUnavailable,
      status: HTTP_STATUS.serviceUnavailable,
      details: { retryable: true }
    })
  );

const guarded = async (work: () => Promise<unknown>): Promise<unknown> => {
  try {
    return await work();
  } catch {
    return unavailable();
  }
};

const describeError = (error: unknown): string => (error instanceof Error ? error.message : String(error));

export const createPrincipalResolver = ({
  identity,
  workspace,
  cache,
  logger,
  now
}: {
  readonly identity: IdentityPort;
  readonly workspace: WorkspacePort;
  readonly cache: PrincipalCache;
  readonly logger: PrincipalLogger;
  readonly now: () => Date;
}): PrincipalResolver => {
  // A cache problem never denies a request and never allows one: fall back to the source.
  const readCache = async (key: string): Promise<ResolvedPrincipal | null> => {
    try {
      const cached: unknown = await cache.get(key);
      return isResolvedPrincipal(cached) ? cached : null;
    } catch (error) {
      logger.warn("Principal cache read failed; resolving from source.", { error: describeError(error) });
      return null;
    }
  };

  const writeCache = async (key: string, principal: ResolvedPrincipal): Promise<void> => {
    try {
      await cache.set(key, principal, PRINCIPAL_CACHE_TTL_SECONDS);
    } catch (error) {
      logger.warn("Principal cache write failed.", { error: describeError(error) });
    }
  };

  const resolve = async (request: PrincipalRequest): Promise<ResolvedPrincipal> => {
    if (!isText(request.sessionId)) return unauthenticated();
    if (!isText(request.workspaceId)) return forbidden();

    // The session is checked on every request, even when the principal itself is cached.
    const session: unknown = await guarded(() => identity.principalFor(request.sessionId));
    if (session === null) return unauthenticated();
    if (!isSessionIdentity(session)) return unavailable();
    if (session.status !== ACTIVE || session.expiresAt.getTime() <= now().getTime()) {
      return unauthenticated();
    }

    const key = principalCacheKey({ userId: session.userId, workspaceId: request.workspaceId });
    const cached = await readCache(key);
    if (
      cached &&
      cached.userId === session.userId &&
      cached.workspaceId === request.workspaceId &&
      cached.membershipStatus === ACTIVE
    ) {
      return cached;
    }

    const membership: unknown = await guarded(() =>
      workspace.membershipOf({ userId: session.userId, workspaceId: request.workspaceId })
    );
    if (membership === null) return forbidden();
    if (!isMembership(membership)) return unavailable();
    if (membership.membershipStatus !== ACTIVE) {
      return forbidden();
    }

    const principal: ResolvedPrincipal = Object.freeze({
      userId: session.userId,
      orgId: membership.orgId,
      workspaceId: request.workspaceId,
      role: membership.role,
      guest: membership.guest,
      membershipStatus: membership.membershipStatus,
      workspaceStatus: membership.workspaceStatus,
      orgStatus: membership.orgStatus
    });
    await writeCache(key, principal);
    return principal;
  };

  return Object.freeze({ resolve });
};

/**
 * Invalidates cached principals only AFTER the change has committed.
 * If the commit throws, nothing is invalidated. If a delete fails, the entry still
 * expires with its TTL (at most 60 s) and the failure is logged.
 */
export const createPrincipalInvalidator = ({
  cache,
  logger
}: {
  readonly cache: PrincipalCache;
  readonly logger: PrincipalLogger;
}) => {
  const deleteQuietly = async (key: PrincipalKey): Promise<void> => {
    try {
      await cache.delete(principalCacheKey(key));
    } catch (error) {
      logger.warn("Principal cache invalidation failed; entry expires with its TTL.", {
        error: describeError(error)
      });
    }
  };

  const invalidateAfterCommit = async <T>(
    keys: ReadonlyArray<PrincipalKey>,
    commit: () => Promise<T>
  ): Promise<T> => {
    const result = await commit();
    await Promise.all(keys.map((key) => deleteQuietly(key)));
    return result;
  };

  return Object.freeze({ invalidateAfterCommit });
};
