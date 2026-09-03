import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../../src/app.js";
import { registerUser, updateDisplayName } from "../../../src/domains/auth/auth.service.js";

let mongo: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 120_000); // first run downloads the mongod binary (~700MB); cached after

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key]?.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const credentials = { email: "person@example.com", password: "correct-horse" };

describe("POST /api/auth/register", () => {
  it("creates an account with a valid email and password", async () => {
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects duplicate email registration", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const res = await request(app).post("/api/auth/register").send(credentials);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  it("rejects an invalid email/password shape", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "short" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with correct credentials", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const res = await request(app).post("/api/auth/login").send(credentials);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
  });

  it("rejects incorrect credentials with a generic error", async () => {
    await request(app).post("/api/auth/register").send(credentials);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "wrong-password" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});

describe("GET /api/auth/me", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user for an authenticated request", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    const cookies = registerRes.headers["set-cookie"];
    const res = await request(app).get("/api/auth/me").set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
  });

  it("has a null displayName until it is set", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    expect(registerRes.body.user.displayName).toBeNull();
  });
});

describe("PATCH /api/auth/me", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).patch("/api/auth/me").send({ displayName: "Nobody" });
    expect(res.status).toBe(401);
  });

  it("updates the display name for an authenticated request", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    const cookies = registerRes.headers["set-cookie"];
    const res = await request(app)
      .patch("/api/auth/me")
      .set("Cookie", cookies)
      .send({ displayName: "Ada Lovelace" });
    expect(res.status).toBe(200);
    expect(res.body.user.displayName).toBe("Ada Lovelace");

    const meRes = await request(app).get("/api/auth/me").set("Cookie", cookies);
    expect(meRes.body.user.displayName).toBe("Ada Lovelace");
  });

  it("rejects an empty display name", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    const cookies = registerRes.headers["set-cookie"];
    const res = await request(app)
      .patch("/api/auth/me")
      .set("Cookie", cookies)
      .send({ displayName: "" });
    expect(res.status).toBe(400);
  });

  it("enforces the display-name length limit at the persistence layer too, not only via the route's zod schema", async () => {
    // Defense in depth (TRACE-009/010): a call that bypasses the route's
    // validation entirely must still be rejected by the model's own
    // constraints (requires updateDisplayName to pass runValidators).
    const user = await registerUser("direct-service@example.com", "correct-horse");
    await expect(updateDisplayName(user.id as string, "x".repeat(61))).rejects.toThrow();
  });
});

describe("POST /api/auth/logout", () => {
  it("clears the session so a subsequent /me is rejected", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    const cookies = registerRes.headers["set-cookie"];
    const logoutRes = await request(app).post("/api/auth/logout").set("Cookie", cookies);
    expect(logoutRes.status).toBe(204);
    const clearedCookies = logoutRes.headers["set-cookie"];
    const meRes = await request(app).get("/api/auth/me").set("Cookie", clearedCookies);
    expect(meRes.status).toBe(401);
  });
});

describe("POST /api/auth/refresh", () => {
  it("issues a new access token given a valid refresh token", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    const cookies = registerRes.headers["set-cookie"];
    const res = await request(app).post("/api/auth/refresh").set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects a request with no refresh token", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
  });

  it("rejects a refresh token whose session has been revoked (logout), even though the JWT itself is still valid", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    const cookies = registerRes.headers["set-cookie"];
    await request(app).post("/api/auth/logout").set("Cookie", cookies);
    // The original refresh token is still cryptographically valid and
    // unexpired — ADR-014's whole point is that server-side session
    // deletion still rejects it.
    const res = await request(app).post("/api/auth/refresh").set("Cookie", cookies);
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/auth/password", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app)
      .patch("/api/auth/password")
      .send({ currentPassword: credentials.password, newPassword: "new-password-1" });
    expect(res.status).toBe(401);
  });

  it("changes the password given the correct current password", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    const cookies = registerRes.headers["set-cookie"];
    const res = await request(app)
      .patch("/api/auth/password")
      .set("Cookie", cookies)
      .send({ currentPassword: credentials.password, newPassword: "new-password-1" });
    expect(res.status).toBe(204);

    // Old password no longer works; new one does.
    const oldLogin = await request(app).post("/api/auth/login").send(credentials);
    expect(oldLogin.status).toBe(401);
    const newLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: credentials.email, password: "new-password-1" });
    expect(newLogin.status).toBe(200);
  });

  it("rejects an incorrect current password", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    const cookies = registerRes.headers["set-cookie"];
    const res = await request(app)
      .patch("/api/auth/password")
      .set("Cookie", cookies)
      .send({ currentPassword: "incorrect-pw", newPassword: "new-password-1" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INCORRECT_PASSWORD");
  });

  it("revokes every other session (secure default, ADR-014)", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    const deviceACookies = registerRes.headers["set-cookie"];
    const deviceBLogin = await request(app).post("/api/auth/login").send(credentials);
    const deviceBCookies = deviceBLogin.headers["set-cookie"];

    await request(app)
      .patch("/api/auth/password")
      .set("Cookie", deviceACookies)
      .send({ currentPassword: credentials.password, newPassword: "new-password-1" });

    // Device A (made the change) still works.
    const deviceAMe = await request(app).get("/api/auth/me").set("Cookie", deviceACookies);
    expect(deviceAMe.status).toBe(200);
    // Device B's refresh token was revoked.
    const deviceBRefresh = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", deviceBCookies);
    expect(deviceBRefresh.status).toBe(401);
  });
});

describe("GET /api/auth/sessions", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).get("/api/auth/sessions");
    expect(res.status).toBe(401);
  });

  it("lists the caller's own sessions and marks the current one", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    const cookies = registerRes.headers["set-cookie"];
    await request(app).post("/api/auth/login").send(credentials);

    const res = await request(app).get("/api/auth/sessions").set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.sessions).toHaveLength(2);
    expect(res.body.sessions.filter((s: { isCurrent: boolean }) => s.isCurrent)).toHaveLength(1);
  });
});

describe("DELETE /api/auth/sessions/:id", () => {
  it("rejects revoking a session that does not belong to the caller", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    const cookies = registerRes.headers["set-cookie"];
    const other = await request(app)
      .post("/api/auth/register")
      .send({ email: "someone-else@example.com", password: "correct-horse" });
    const otherSessions = await request(app)
      .get("/api/auth/sessions")
      .set("Cookie", other.headers["set-cookie"]);
    const otherSessionId = otherSessions.body.sessions[0].id;

    const res = await request(app)
      .delete(`/api/auth/sessions/${otherSessionId}`)
      .set("Cookie", cookies);
    expect(res.status).toBe(404);
  });

  it("revokes one of the caller's own sessions", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    const deviceACookies = registerRes.headers["set-cookie"];
    const deviceBLogin = await request(app).post("/api/auth/login").send(credentials);
    const deviceBCookies = deviceBLogin.headers["set-cookie"];

    const sessions = await request(app).get("/api/auth/sessions").set("Cookie", deviceACookies);
    const deviceBSession = sessions.body.sessions.find((s: { isCurrent: boolean }) => !s.isCurrent);

    const revokeRes = await request(app)
      .delete(`/api/auth/sessions/${deviceBSession.id}`)
      .set("Cookie", deviceACookies);
    expect(revokeRes.status).toBe(204);

    const deviceBRefresh = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", deviceBCookies);
    expect(deviceBRefresh.status).toBe(401);
  });
});

describe("POST /api/auth/sessions/revoke-others", () => {
  it("revokes every session except the caller's own", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(credentials);
    const deviceACookies = registerRes.headers["set-cookie"];
    const deviceBLogin = await request(app).post("/api/auth/login").send(credentials);
    const deviceBCookies = deviceBLogin.headers["set-cookie"];

    const res = await request(app)
      .post("/api/auth/sessions/revoke-others")
      .set("Cookie", deviceACookies);
    expect(res.status).toBe(204);

    const deviceAMe = await request(app).get("/api/auth/me").set("Cookie", deviceACookies);
    expect(deviceAMe.status).toBe(200);
    const deviceBRefresh = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", deviceBCookies);
    expect(deviceBRefresh.status).toBe(401);
  });
});
