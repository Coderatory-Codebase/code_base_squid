import { Router, type CookieOptions, type Response } from "express";
import { ZodError } from "zod";
import { env, isProduction } from "../../config/env.js";
import {
  changePasswordRequestSchema,
  loginRequestSchema,
  registerRequestSchema,
  updateProfileRequestSchema,
} from "./auth.contracts.js";
import { requireAuth } from "./auth.middleware.js";
import {
  createCredentialsRateLimit,
  createProfileRateLimit,
  createRefreshRateLimit,
} from "./auth.rate-limit.js";
import {
  EmailAlreadyRegisteredError,
  IncorrectPasswordError,
  InvalidCredentialsError,
  changePassword,
  registerUser,
  signAccessToken,
  signRefreshToken,
  toAuthUser,
  updateDisplayName,
  verifyAccessToken,
  verifyCredentials,
  verifyRefreshToken,
} from "./auth.service.js";
import {
  createSession,
  deleteOtherSessions,
  deleteSession,
  getOwnedSession,
  listSessions,
  touchSession,
} from "./session.service.js";
import { User } from "./user.model.js";

// Skipped under the repository's own automated test run (NODE_ENV=test,
// vitest's default) — the integration suite below intentionally makes
// more than the production limit's worth of register/login calls across
// its many unrelated assertions, sharing one long-lived app instance.
// The rate-limit middleware's actual 429 behavior is verified in
// isolation instead — see auth.rate-limit.test.ts.
const isTestRun = env.nodeEnv === "test";
const credentialsRateLimit = createCredentialsRateLimit({ skip: () => isTestRun });
const refreshRateLimit = createRefreshRateLimit({ skip: () => isTestRun });
const profileRateLimit = createProfileRateLimit({ skip: () => isTestRun });
const passwordChangeRateLimit = createCredentialsRateLimit({ skip: () => isTestRun });

const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
};

function setSessionCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
  });
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

function clearSessionCookies(res: Response): void {
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", baseCookieOptions);
}

// Shared response shapes — the same {error:{message,code}} pattern was
// duplicated across register/login/PATCH-me (invalid input) and
// GET-me/PATCH-me/refresh (unauthenticated) once three real routes each
// needed it (SPEC-008 -> "Reuse and generalization" extraction bar).
function sendError(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({ error: { message, code } });
}

function sendUnauthenticated(res: Response): void {
  clearSessionCookies(res);
  sendError(res, 401, "UNAUTHENTICATED", "Not authenticated.");
}

async function issueSession(
  res: Response,
  userId: string,
  userAgent: string | undefined,
): Promise<void> {
  const session = await createSession(userId, userAgent);
  const sessionId = session.id as string;
  const accessToken = signAccessToken(userId, sessionId);
  const refreshToken = signRefreshToken(userId, sessionId);
  setSessionCookies(res, accessToken, refreshToken);
}

export const authRouter: Router = Router();

authRouter.post("/register", credentialsRateLimit, async (req, res) => {
  try {
    const { email, password } = registerRequestSchema.parse(req.body);
    const user = await registerUser(email, password);
    await issueSession(res, user.id as string, req.headers["user-agent"]);
    res.status(201).json({ user: toAuthUser(user) });
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, "INVALID_INPUT", "Invalid registration data.");
      return;
    }
    if (err instanceof EmailAlreadyRegisteredError) {
      sendError(res, 409, "EMAIL_TAKEN", err.message);
      return;
    }
    throw err;
  }
});

authRouter.post("/login", credentialsRateLimit, async (req, res) => {
  try {
    const { email, password } = loginRequestSchema.parse(req.body);
    const user = await verifyCredentials(email, password);
    await issueSession(res, user.id as string, req.headers["user-agent"]);
    res.status(200).json({ user: toAuthUser(user) });
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, "INVALID_INPUT", "Invalid login data.");
      return;
    }
    if (err instanceof InvalidCredentialsError) {
      sendError(res, 401, "INVALID_CREDENTIALS", err.message);
      return;
    }
    throw err;
  }
});

authRouter.post("/logout", async (req, res) => {
  const token = req.cookies?.accessToken as string | undefined;
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      await deleteSession(payload.sid);
    } catch {
      // Invalid/expired access token — nothing server-side to revoke;
      // still clear cookies below so logout is always idempotent.
    }
  }
  clearSessionCookies(res);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    sendUnauthenticated(res);
    return;
  }
  res.status(200).json({ user: toAuthUser(user) });
});

authRouter.patch("/me", requireAuth, profileRateLimit, async (req, res) => {
  try {
    const { displayName } = updateProfileRequestSchema.parse(req.body);
    const user = await updateDisplayName(req.userId as string, displayName);
    if (!user) {
      sendUnauthenticated(res);
      return;
    }
    res.status(200).json({ user: toAuthUser(user) });
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, "INVALID_INPUT", "Invalid profile data.");
      return;
    }
    throw err;
  }
});

authRouter.patch("/password", requireAuth, passwordChangeRateLimit, async (req, res) => {
  try {
    const { currentPassword, newPassword } = changePasswordRequestSchema.parse(req.body);
    await changePassword(req.userId as string, currentPassword, newPassword);
    // Secure default (ADR-014): a password change revokes every other
    // session — only the session that made the change stays valid.
    await deleteOtherSessions(req.userId as string, req.sessionId as string);
    res.status(204).end();
  } catch (err) {
    if (err instanceof ZodError) {
      sendError(res, 400, "INVALID_INPUT", "Invalid password data.");
      return;
    }
    if (err instanceof IncorrectPasswordError) {
      sendError(res, 401, "INCORRECT_PASSWORD", err.message);
      return;
    }
    throw err;
  }
});

authRouter.get("/sessions", requireAuth, async (req, res) => {
  const sessions = await listSessions(req.userId as string, req.sessionId as string);
  res.status(200).json({ sessions });
});

authRouter.delete("/sessions/:id", requireAuth, async (req, res) => {
  const sessionIdParam = typeof req.params.id === "string" ? req.params.id : "";
  const session = await getOwnedSession(sessionIdParam, req.userId as string);
  if (!session) {
    sendError(res, 404, "SESSION_NOT_FOUND", "Session not found.");
    return;
  }
  await deleteSession(session.id as string);
  if ((session.id as string) === req.sessionId) {
    clearSessionCookies(res);
  }
  res.status(204).end();
});

authRouter.post("/sessions/revoke-others", requireAuth, async (req, res) => {
  await deleteOtherSessions(req.userId as string, req.sessionId as string);
  res.status(204).end();
});

authRouter.post("/refresh", refreshRateLimit, async (req, res) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) {
    sendUnauthenticated(res);
    return;
  }
  try {
    const payload = verifyRefreshToken(token);
    const [user, session] = await Promise.all([
      User.findById(payload.sub),
      touchSession(payload.sid),
    ]);
    if (!user || !session) {
      sendUnauthenticated(res);
      return;
    }
    const accessToken = signAccessToken(user.id as string, payload.sid);
    const refreshToken = signRefreshToken(user.id as string, payload.sid);
    setSessionCookies(res, accessToken, refreshToken);
    res.status(200).json({ user: toAuthUser(user) });
  } catch {
    sendUnauthenticated(res);
  }
});
