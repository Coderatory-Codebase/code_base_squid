import rateLimit, { type Options } from "express-rate-limit";

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

const rateLimitedResponse = {
  error: { message: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
};

const defaults: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitedResponse,
};

// Factories, not module-level singletons — each caller gets its own
// counter store. createApp() (and therefore every real request path)
// still gets one long-lived instance per process; tests can create a
// small, independent instance instead of sharing state with (or
// polluting) the full integration suite's request count.

// Strict: the credential-stuffing/brute-force targets.
export function createCredentialsRateLimit(overrides: Partial<Options> = {}) {
  return rateLimit({ windowMs: FIFTEEN_MINUTES_MS, limit: 10, ...defaults, ...overrides });
}

// Looser: still unauthenticated-input-bearing, lower abuse value.
export function createRefreshRateLimit(overrides: Partial<Options> = {}) {
  return rateLimit({ windowMs: FIFTEEN_MINUTES_MS, limit: 30, ...defaults, ...overrides });
}
