import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../../src/app.js";
import { createNote, updateOwnedNote } from "../../../src/domains/notes/notes.service.js";
import { registerUser } from "../../../src/domains/auth/auth.service.js";

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

const credentials = { email: "notes-owner@example.com", password: "correct-horse" };

async function registerAndGetCookies(
  overrides: Partial<typeof credentials> = {},
): Promise<{ cookies: string[]; userId: string }> {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ ...credentials, ...overrides });
  return { cookies: res.headers["set-cookie"], userId: res.body.user.id as string };
}

describe("POST /api/notes", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).post("/api/notes").send({ title: "Groceries" });
    expect(res.status).toBe(401);
  });

  it("creates a note with a title and optional body", async () => {
    const { cookies } = await registerAndGetCookies();
    const res = await request(app)
      .post("/api/notes")
      .set("Cookie", cookies)
      .send({ title: "Groceries", body: "Milk, eggs" });
    expect(res.status).toBe(201);
    expect(res.body.note.title).toBe("Groceries");
    expect(res.body.note.body).toBe("Milk, eggs");
    expect(res.body.note.id).toBeDefined();
  });

  it("creates a note with no body", async () => {
    const { cookies } = await registerAndGetCookies();
    const res = await request(app).post("/api/notes").set("Cookie", cookies).send({
      title: "Just a title",
    });
    expect(res.status).toBe(201);
    expect(res.body.note.body).toBe("");
  });

  it("rejects an empty title", async () => {
    const { cookies } = await registerAndGetCookies();
    const res = await request(app).post("/api/notes").set("Cookie", cookies).send({ title: "   " });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_INPUT");
  });

  it("rejects a title over the length limit", async () => {
    const { cookies } = await registerAndGetCookies();
    const res = await request(app)
      .post("/api/notes")
      .set("Cookie", cookies)
      .send({ title: "x".repeat(201) });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/notes", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).get("/api/notes");
    expect(res.status).toBe(401);
  });

  it("lists only the caller's own notes, newest first", async () => {
    const { cookies, userId } = await registerAndGetCookies();
    const { userId: otherUserId } = await registerAndGetCookies({
      email: "someone-else@example.com",
    });
    await createNote(userId, "First", undefined);
    await createNote(userId, "Second", undefined);
    await createNote(otherUserId, "Not mine", undefined);

    const res = await request(app).get("/api/notes").set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.notes).toHaveLength(2);
    expect(res.body.notes[0].title).toBe("Second");
    expect(res.body.notes[1].title).toBe("First");
  });

  it("returns an empty list for a user with no notes", async () => {
    const { cookies } = await registerAndGetCookies();
    const res = await request(app).get("/api/notes").set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.notes).toEqual([]);
  });
});

describe("GET /api/notes/:id", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).get("/api/notes/000000000000000000000000");
    expect(res.status).toBe(401);
  });

  it("returns a note the caller owns", async () => {
    const { cookies, userId } = await registerAndGetCookies();
    const note = await createNote(userId, "Mine", "Body text");
    const res = await request(app)
      .get(`/api/notes/${note.id as string}`)
      .set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.note.title).toBe("Mine");
  });

  it("returns 404, not another user's data, for a note that does not belong to the caller", async () => {
    const { cookies } = await registerAndGetCookies();
    const { userId: otherUserId } = await registerAndGetCookies({
      email: "someone-else@example.com",
    });
    const otherNote = await createNote(otherUserId, "Not mine", undefined);

    const res = await request(app)
      .get(`/api/notes/${otherNote.id as string}`)
      .set("Cookie", cookies);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOTE_NOT_FOUND");
  });
});

describe("PATCH /api/notes/:id", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app)
      .patch("/api/notes/000000000000000000000000")
      .send({ title: "New" });
    expect(res.status).toBe(401);
  });

  it("updates a note's title and body", async () => {
    const { cookies, userId } = await registerAndGetCookies();
    const note = await createNote(userId, "Original", "Original body");
    const res = await request(app)
      .patch(`/api/notes/${note.id as string}`)
      .set("Cookie", cookies)
      .send({ title: "Updated", body: "Updated body" });
    expect(res.status).toBe(200);
    expect(res.body.note.title).toBe("Updated");
    expect(res.body.note.body).toBe("Updated body");
  });

  it("updates only the provided field", async () => {
    const { cookies, userId } = await registerAndGetCookies();
    const note = await createNote(userId, "Original", "Original body");
    const res = await request(app)
      .patch(`/api/notes/${note.id as string}`)
      .set("Cookie", cookies)
      .send({ title: "Updated title only" });
    expect(res.status).toBe(200);
    expect(res.body.note.title).toBe("Updated title only");
    expect(res.body.note.body).toBe("Original body");
  });

  it("rejects an update with neither title nor body", async () => {
    const { cookies, userId } = await registerAndGetCookies();
    const note = await createNote(userId, "Original", undefined);
    const res = await request(app)
      .patch(`/api/notes/${note.id as string}`)
      .set("Cookie", cookies)
      .send({});
    expect(res.status).toBe(400);
  });

  it("returns 404, not another user's data, when updating a note that does not belong to the caller", async () => {
    const { cookies } = await registerAndGetCookies();
    const { userId: otherUserId } = await registerAndGetCookies({
      email: "someone-else@example.com",
    });
    const otherNote = await createNote(otherUserId, "Not mine", undefined);

    const res = await request(app)
      .patch(`/api/notes/${otherNote.id as string}`)
      .set("Cookie", cookies)
      .send({ title: "Hijacked" });
    expect(res.status).toBe(404);
  });

  it("enforces the title length limit at the persistence layer too, not only via the route's zod schema", async () => {
    // Defense in depth (TRACE-009/010 precedent): a call that bypasses
    // the route's validation entirely must still be rejected by the
    // model's own constraints (requires updateOwnedNote to pass
    // runValidators).
    const user = await registerUser("direct-service@example.com", "correct-horse");
    const note = await createNote(user.id as string, "Original", undefined);
    await expect(
      updateOwnedNote(note.id as string, user.id as string, { title: "x".repeat(201) }),
    ).rejects.toThrow();
  });
});

describe("DELETE /api/notes/:id", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await request(app).delete("/api/notes/000000000000000000000000");
    expect(res.status).toBe(401);
  });

  it("deletes a note the caller owns", async () => {
    const { cookies, userId } = await registerAndGetCookies();
    const note = await createNote(userId, "Delete me", undefined);
    const deleteRes = await request(app)
      .delete(`/api/notes/${note.id as string}`)
      .set("Cookie", cookies);
    expect(deleteRes.status).toBe(204);

    const getRes = await request(app)
      .get(`/api/notes/${note.id as string}`)
      .set("Cookie", cookies);
    expect(getRes.status).toBe(404);
  });

  it("returns 404, not another user's data, when deleting a note that does not belong to the caller", async () => {
    const { cookies } = await registerAndGetCookies();
    const { cookies: otherCookies, userId: otherUserId } = await registerAndGetCookies({
      email: "someone-else@example.com",
    });
    const otherNote = await createNote(otherUserId, "Not mine", undefined);

    const res = await request(app)
      .delete(`/api/notes/${otherNote.id as string}`)
      .set("Cookie", cookies);
    expect(res.status).toBe(404);

    // The note was never actually deleted — its real owner can still see it.
    const stillThere = await request(app)
      .get(`/api/notes/${otherNote.id as string}`)
      .set("Cookie", otherCookies);
    expect(stillThere.status).toBe(200);
  });
});
