import { Router, type CookieOptions } from "express";
import { ZodError } from "zod";
import { isProduction } from "../../config/env.js";
import { loginRequestSchema, registerRequestSchema } from "./auth.contracts.js";
import { requireAuth } from "./auth.middleware.js";
import {
  EmailAlreadyRegisteredError,
  InvalidCredentialsError,
  registerUser,
  signAccessToken,
  signRefreshToken,
  toAuthUser,
  verifyCredentials,
  verifyRefreshToken,
} from "./auth.service.js";
import { User } from "./user.model.js";

const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  path: "/",
};

function setSessionCookies(
  res: import("express").Response,
  accessToken: string,
  refreshToken: string,
): void {
  res.cookie("accessToken", accessToken, {
    ...baseCookieOptions,
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
  });
  res.cookie("refreshToken", refreshToken, {
    ...baseCookieOptions,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

function clearSessionCookies(res: import("express").Response): void {
  res.clearCookie("accessToken", baseCookieOptions);
  res.clearCookie("refreshToken", baseCookieOptions);
}

export const authRouter: Router = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { email, password } = registerRequestSchema.parse(req.body);
    const user = await registerUser(email, password);
    const accessToken = signAccessToken(user.id as string);
    const refreshToken = signRefreshToken(user.id as string);
    setSessionCookies(res, accessToken, refreshToken);
    res.status(201).json({ user: toAuthUser(user) });
  } catch (err) {
    if (err instanceof ZodError) {
      res
        .status(400)
        .json({ error: { message: "Invalid registration data.", code: "INVALID_INPUT" } });
      return;
    }
    if (err instanceof EmailAlreadyRegisteredError) {
      res.status(409).json({ error: { message: err.message, code: "EMAIL_TAKEN" } });
      return;
    }
    throw err;
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = loginRequestSchema.parse(req.body);
    const user = await verifyCredentials(email, password);
    const accessToken = signAccessToken(user.id as string);
    const refreshToken = signRefreshToken(user.id as string);
    setSessionCookies(res, accessToken, refreshToken);
    res.status(200).json({ user: toAuthUser(user) });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: { message: "Invalid login data.", code: "INVALID_INPUT" } });
      return;
    }
    if (err instanceof InvalidCredentialsError) {
      res.status(401).json({ error: { message: err.message, code: "INVALID_CREDENTIALS" } });
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
    clearSessionCookies(res);
    res.status(401).json({ error: { message: "Not authenticated.", code: "UNAUTHENTICATED" } });
    return;
  }
  res.status(200).json({ user: toAuthUser(user) });
});

authRouter.post("/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken as string | undefined;
  if (!token) {
    res.status(401).json({ error: { message: "Not authenticated.", code: "UNAUTHENTICATED" } });
    return;
  }
  try {
    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);
    if (!user) {
      clearSessionCookies(res);
      res.status(401).json({ error: { message: "Not authenticated.", code: "UNAUTHENTICATED" } });
      return;
    }
    const accessToken = signAccessToken(user.id as string);
    const refreshToken = signRefreshToken(user.id as string);
    setSessionCookies(res, accessToken, refreshToken);
    res.status(200).json({ user: toAuthUser(user) });
  } catch {
    clearSessionCookies(res);
    res.status(401).json({ error: { message: "Not authenticated.", code: "UNAUTHENTICATED" } });
  }
});
