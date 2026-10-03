import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import type { Logger } from "@workspace/logging";
import type { ApiErrorResponse } from "@workspace/types";
import type { UserProfileSignal } from "../index.js";
import { createErrorHandler } from "../../../middleware/index.js";
import { createUserProfileRoutes } from "../routes/user-profile.route.js";

const logger: Logger = {
  info: (): void => undefined,
  warn: (): void => undefined,
  error: (): void => undefined
};

const startServer = async (app: express.Express): Promise<{
  origin: string;
  close: () => Promise<void>;
}> => {
  const server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");

  return {
    origin: `http://127.0.0.1:${String(address.port)}`,
    close: () => new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    })
  };
};

void test("profile API resolves the cookie principal before calling the gateway", async (context) => {
  let receivedCookie: string | undefined;
  let receivedGatewayPrincipal: unknown;
  const profileSignals: UserProfileSignal[] = [];
  const app = express();
  app.use(createUserProfileRoutes({
    principalResolver: {
      resolve: (cookieHeader) => {
        receivedCookie = cookieHeader;
        return Promise.resolve({
          kind: "resolved",
          principal: { userId: "user-1", sessionId: "session-1", workspaceId: "workspace-1" }
        });
      }
    },
    gateway: {
      getUserProfile: (userId, principal) => {
        assert.equal(userId, "user-1");
        receivedGatewayPrincipal = principal;
        return Promise.resolve({ name: "Lena Park" });
      }
    },
    recordProfileSignal: (signal) => { profileSignals.push(signal); }
  }));
  app.use(createErrorHandler({ logger }));
  const server = await startServer(app);
  context.after(server.close);

  const response = await fetch(`${server.origin}/identity/user-profile`, {
    headers: { cookie: "squid_session=opaque-session-token" }
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { name: "Lena Park" });
  assert.equal(receivedCookie, "squid_session=opaque-session-token");
  assert.deepEqual(receivedGatewayPrincipal, {
    userId: "user-1",
    sessionId: "session-1",
    workspaceId: "workspace-1"
  });
  assert.equal(profileSignals.length, 1);
  assert.deepEqual(profileSignals[0] && {
    event: profileSignals[0].event,
    module: profileSignals[0].module,
    operation: profileSignals[0].operation,
    workspaceId: profileSignals[0].workspaceId,
    outcome: profileSignals[0].outcome
  }, {
    event: "identity.user_profile.gateway_query",
    module: "identity",
    operation: "user_profile.gateway_query",
    workspaceId: "workspace-1",
    outcome: "success"
  });
  assert.equal(typeof profileSignals[0]?.durationMs, "number");
});

void test("profile gateway failure emits an error signal with the resolved workspace label", async (context) => {
  const profileSignals: UserProfileSignal[] = [];
  const app = express();
  app.use(createUserProfileRoutes({
    principalResolver: {
      resolve: () => Promise.resolve({
        kind: "resolved",
        principal: { userId: "user-1", sessionId: "session-1", workspaceId: "workspace-1" }
      })
    },
    gateway: { getUserProfile: () => Promise.reject(new Error("profile gateway unavailable")) },
    recordProfileSignal: (signal) => { profileSignals.push(signal); }
  }));
  app.use(createErrorHandler({ logger }));
  const server = await startServer(app);
  context.after(server.close);

  const response = await fetch(`${server.origin}/identity/user-profile`, {
    headers: { cookie: "squid_session=opaque-session-token" }
  });

  assert.equal(response.status, 500);
  assert.equal(profileSignals.length, 1);
  assert.equal(profileSignals[0]?.module, "identity");
  assert.equal(profileSignals[0].workspaceId, "workspace-1");
  assert.equal(profileSignals[0].outcome, "error");
});

void test("profile API refuses unauthenticated requests before reading the gateway", async (context) => {
  let gatewayWasCalled = false;
  const app = express();
  app.use(createUserProfileRoutes({
    principalResolver: { resolve: () => Promise.resolve({ kind: "unauthenticated" }) },
    gateway: {
      getUserProfile: () => {
        gatewayWasCalled = true;
        return Promise.resolve({ name: "Should not be returned" });
      }
    }
  }));
  app.use(createErrorHandler({ logger }));
  const server = await startServer(app);
  context.after(server.close);

  const response = await fetch(`${server.origin}/identity/user-profile`);
  const body = await response.json() as ApiErrorResponse;

  assert.equal(response.status, 401);
  assert.equal(body.error.code, "unauthenticated");
  assert.equal(gatewayWasCalled, false);
});
