import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  createCredentialsRateLimit,
  createProfileRateLimit,
} from "../../../src/domains/auth/auth.rate-limit.js";

// Isolated from auth.routes.test.ts deliberately: that suite shares one
// long-lived app across many register/login calls (more than the
// production limit) and the real router skips rate limiting under
// NODE_ENV=test for exactly that reason (see auth.routes.ts). This test
// exercises each limiter factory's actual behavior directly, with its
// own small limit and its own counter store, isolated from both
// concerns.
function buildTestApp(factory: typeof createCredentialsRateLimit, limit: number) {
  const app = express();
  app.use(factory({ limit }));
  app.get("/probe", (_req, res) => res.status(200).json({ ok: true }));
  return app;
}

describe.each([
  ["createCredentialsRateLimit", createCredentialsRateLimit],
  ["createProfileRateLimit", createProfileRateLimit],
] as const)("%s", (_name, factory) => {
  it("allows requests under the limit", async () => {
    const app = buildTestApp(factory, 3);
    for (let i = 0; i < 3; i++) {
      const res = await request(app).get("/probe");
      expect(res.status).toBe(200);
    }
  });

  it("rejects requests once the limit is exceeded, with the expected error shape", async () => {
    const app = buildTestApp(factory, 3);
    for (let i = 0; i < 3; i++) {
      await request(app).get("/probe");
    }
    const res = await request(app).get("/probe");
    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      error: { message: "Too many requests. Please try again later.", code: "RATE_LIMITED" },
    });
  });
});
