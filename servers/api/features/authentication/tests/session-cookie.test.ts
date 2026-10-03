import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { createSessionCookieResolver, SESSION_COOKIE_NAME } from "../session-cookie.js";

void test("session cookie resolver hashes the opaque token and queries active unexpired sessions", async () => {
  const token = "a".repeat(43);
  const expectedHash = createHash("sha256").update(token).digest("hex");
  const now = new Date("2026-10-01T12:00:00.000Z");
  let receivedHash = "";
  let receivedTime: Date | undefined;
  const resolveSession = createSessionCookieResolver({
    sessions: {
      findAndTouchActiveByTokenHash: (tokenHash, currentTime) => {
        receivedHash = tokenHash;
        receivedTime = currentTime;
        return Promise.resolve({ sessionId: "session-1", userId: "user-1" });
      }
    },
    now: () => now
  });

  assert.deepEqual(await resolveSession(`${SESSION_COOKIE_NAME}=${token}`), {
    sessionId: "session-1",
    userId: "user-1"
  });
  assert.equal(receivedHash, expectedHash);
  assert.equal(receivedTime, now);
});

void test("session cookie resolver rejects absent, malformed, or duplicate cookies", async () => {
  let lookupCount = 0;
  const resolveSession = createSessionCookieResolver({
    sessions: {
      findAndTouchActiveByTokenHash: () => {
        lookupCount += 1;
        return Promise.resolve(null);
      }
    }
  });

  assert.equal(await resolveSession(undefined), null);
  assert.equal(await resolveSession(`${SESSION_COOKIE_NAME}=short`), null);
  assert.equal(await resolveSession(`${SESSION_COOKIE_NAME}=${"a".repeat(43)}; ${SESSION_COOKIE_NAME}=${"b".repeat(43)}`), null);
  assert.equal(lookupCount, 0);
});
