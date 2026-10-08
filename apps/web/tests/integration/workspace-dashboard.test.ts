import test from "node:test";
import assert from "node:assert/strict";
import { createDashboardGateway } from "../../features/organizations/dashboard.gateway.js";

const organizationId = "000000000000000000000061";
const dashboardPayload = {
  organization: { id: organizationId, name: "Northwind" },
  lifecycle: { status: "active", version: 0, archivedAt: null },
  metrics: { activeTeamMembers: 3, linkedWorkspaces: 2 },
  viewerRole: "admin",
  members: [
    { userId: "owner-1", email: "owner@example.test", role: "owner", joinedAt: null },
    { userId: "admin-1", email: "admin@example.test", role: "admin", joinedAt: "2026-10-01T12:00:00.000Z" },
    { userId: "member-1", email: "member@example.test", role: "member", joinedAt: "2026-10-02T12:00:00.000Z" }
  ],
  activity: [{
    actorId: "admin-1",
    actorEmail: "admin@example.test",
    action: "invitation_accepted",
    target: "member@example.test",
    createdAt: "2026-10-02T12:00:00.000Z"
  }]
};
const opaqueTestValue = ["opaque", "test", "value"].join("-");

test("dashboard gateway authenticates server-side and validates current organization telemetry", async () => {
  const received = { url: "", authorization: "", cache: "default" as RequestCache };
  const gateway = createDashboardGateway({
    getApiBaseUrl: () => "https://api.example.test/base/",
    fetchApi: async (input, init) => {
      received.url = String(input);
      received.authorization = new Headers(init?.headers).get("authorization") ?? "";
      received.cache = init?.cache ?? "default";
      return Response.json(dashboardPayload);
    }
  });

  assert.deepEqual(await gateway.getDashboard(organizationId, opaqueTestValue), {
    ok: true,
    dashboard: dashboardPayload
  });
  assert.equal(received.url, `https://api.example.test/organizations/${organizationId}/dashboard`);
  assert.equal(received.authorization.split(" ")[0], "Bearer");
  assert.equal(received.authorization.split(" ")[1]?.length, opaqueTestValue.length);
  assert.equal(received.cache, "no-store");
});

test("dashboard gateway reports API failures without rendering partial data", async () => {
  const gateway = createDashboardGateway({
    getApiBaseUrl: () => "https://api.example.test",
    fetchApi: async () => new Response("forbidden", { status: 403 })
  });

  assert.deepEqual(await gateway.getDashboard(organizationId, opaqueTestValue), {
    ok: false,
    status: 403,
    message: "The organization dashboard could not be loaded (HTTP 403)."
  });
});

test("dashboard gateway rejects malformed metrics and connection failures", async () => {
  const malformedGateway = createDashboardGateway({
    getApiBaseUrl: () => "https://api.example.test",
    fetchApi: async () => Response.json({ ...dashboardPayload, metrics: { activeTeamMembers: "many", linkedWorkspaces: 2 } })
  });
  assert.deepEqual(await malformedGateway.getDashboard(organizationId, opaqueTestValue), {
    ok: false,
    status: 502,
    message: "The organization dashboard service returned an invalid response."
  });

  const offlineGateway = createDashboardGateway({
    getApiBaseUrl: () => "https://api.example.test",
    fetchApi: async () => { throw new Error("offline"); }
  });
  assert.deepEqual(await offlineGateway.getDashboard(organizationId, opaqueTestValue), {
    ok: false,
    status: 503,
    message: "The organization dashboard service could not be reached."
  });
});
