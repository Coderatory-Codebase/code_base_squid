import test, { type TestContext } from "node:test";
import assert from "node:assert/strict";
import type { Logger } from "@workspace/logging";
import { createApp, createServer } from "../bootstrap/index.js";
import type { ApiConfig } from "../types/index.js";
import type { AuthService } from "../features/auth/index.js";
import type { OrganizationGateway } from "../features/workspace/index.js";
import type { Principal } from "../types/index.js";

const config: ApiConfig = {
  environment: "test", host: "127.0.0.1", port: 0,
  webOrigin: "http://localhost:3000", logLevel: "silent"
};
const logger: Logger = { info: () => undefined, warn: () => undefined, error: () => undefined };
const principal: Principal = { userId: "member-1", workspaceIds: ["workspace-1"] };

void test("sign-in session authenticates organization queries and sign-out revokes access", async (context: TestContext) => {
  let activeToken = "preview-session-token-0123456789012345678901234567890123";
  const authService: AuthService = {
    signIn: () => Promise.resolve({ token: activeToken, expiresAt: new Date(Date.now() + 60_000) }),
    resolvePrincipal: (token) => Promise.resolve(token === activeToken ? principal : null),
    signOut: (token) => {
      if (token === activeToken) activeToken = "";
      return Promise.resolve();
    }
  };
  const gateway: OrganizationGateway = {
    listOrganizationsForPrincipal: (receivedPrincipal) => {
      assert.deepEqual(receivedPrincipal, principal);
      return Promise.resolve([]);
    },
    createOrganizationForPrincipal: () => Promise.reject(new Error("Not used")),
    upsertPreviewOrganization: () => Promise.resolve()
  };
  const server = createServer({ app: createApp({ config, logger, authService, organizationGateway: gateway }), config, logger });
  await server.start();
  context.after(async () => { await server.stop(); });
  const address = server.raw.address();
  assert.ok(address && typeof address === "object");
  const baseUrl = `http://127.0.0.1:${String(address.port)}`;

  const signInResponse = await fetch(`${baseUrl}/auth/sign-in`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "member@example.test", password: "preview-password" })
  });
  assert.equal(signInResponse.status, 200);
  const session = await signInResponse.json() as { token: string };

  const organizationResponse = await fetch(`${baseUrl}/organizations`, {
    headers: { authorization: `Bearer ${session.token}` }
  });
  assert.equal(organizationResponse.status, 200);
  assert.deepEqual(await organizationResponse.json(), []);

  const signOutResponse = await fetch(`${baseUrl}/auth/sign-out`, {
    method: "POST", headers: { authorization: `Bearer ${session.token}` }
  });
  assert.equal(signOutResponse.status, 204);
  const revokedResponse = await fetch(`${baseUrl}/organizations`, {
    headers: { authorization: `Bearer ${session.token}` }
  });
  assert.equal(revokedResponse.status, 401);
});
