import { Router, type CookieOptions, type Response } from "express";
import { ZodError } from "zod";
import { env, isProduction } from "../../config/env.js";
import {
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
  InvalidCredentialsError,
  registerUser,
  signAccessToken,
  signRefreshToken,
  toAuthUser,
  updateDisplayName,
  verifyCredentials,
  verifyRefreshToken,
} from "./auth.service.js";
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

export const authRouter: Router = Router();

authRouter.post("/register", credentialsRateLimit, async (req, res) => {
  try {
    const { email, password } = registerRequestSchema.parse(req.body);
    const user = await registerUser(email, password);
    const accessToken = signAccessToken(user.id as string);
    const refreshToken = signRefreshToken(user.id as string);
    setSessionCookies(res, accessToken, refreshToken);
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
    const accessToken = signAccessToken(user.id as string);
    const refreshToken = signRefreshToken(user.id as string);
    setSessionCookies(res, accessToken, refreshToken);
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

authRouter.post("/logout", (_req, res) => {
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

authRouter.post("/refresh", refreshRateLimit, async (req, res) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) {
    sendUnauthenticated(res);
    return;
  }
  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      sendUnauthenticated(res);
      return;
    }
    const accessToken = signAccessToken(user.id as string);
    const refreshToken = signRefreshToken(user.id as string);
    setSessionCookies(res, accessToken, refreshToken);
    res.status(200).json({ user: toAuthUser(user) });
  } catch {
    sendUnauthenticated(res);
  }
});
