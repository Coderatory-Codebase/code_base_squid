import assert from "node:assert/strict";
import test from "node:test";
import { createPrincipalResolver } from "../principal.js";

void test("principal cache avoids repeat membership reads, expires at 60 seconds, and can be invalidated", async () => {
  let currentTime = 1_000;
  let sessionActive = true;
  let membershipReads = 0;
  const resolver = createPrincipalResolver({
    now: () => currentTime,
    resolveSession: () => Promise.resolve(sessionActive ? { sessionId: "session-1", userId: "user-1" } : null),
    memberships: {
      activeMembershipsFor: () => {
        membershipReads += 1;
        return Promise.resolve([{ workspaceId: "workspace-1" }]);
      }
    }
  });

  const first = await resolver.resolve("cookie");
  const warm = await resolver.resolve("cookie");
  assert.deepEqual(warm, first);
  assert.equal(membershipReads, 1);

  resolver.invalidateSession("session-1");
  await resolver.resolve("cookie");
  assert.equal(membershipReads, 2);

  currentTime += 60_000;
  await resolver.resolve("cookie");
  assert.equal(membershipReads, 3);

  sessionActive = false;
  assert.deepEqual(await resolver.resolve("cookie"), { kind: "unauthenticated" });
  assert.equal(membershipReads, 3);
});
