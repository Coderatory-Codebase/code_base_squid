import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../../src/app.js";

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
});
