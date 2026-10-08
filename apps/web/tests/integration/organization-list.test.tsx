import test from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { renderToStaticMarkup } from "react-dom/server";
import { createOrganizationsGateway } from "../../features/organizations/organizations.gateway.js";
import { OrganizationResults } from "../../features/organizations/organization-results.js";

test("organization gateway requests the API server-side with the session token and parses results", async () => {
  let receivedUrl = "";
  let receivedAuthorization: string | null = null;
  let receivedCache: RequestCache | undefined;
  const gateway = createOrganizationsGateway({
    getApiBaseUrl: () => "https://api.example.test/base/",
    fetchApi: async (input, init) => {
      receivedUrl = String(input);
      receivedAuthorization = new Headers(init?.headers).get("authorization");
      receivedCache = init?.cache;
      return Response.json({ organizations: [{ id: "org-1", name: "Workspace organization", status: "active", archivedAt: null }], nextOffset: null });
    }
  });

  assert.deepEqual(await gateway.listOrganizations("session-token"), {
    ok: true,
    organizations: [{ id: "org-1", name: "Workspace organization", status: "active", archivedAt: null }],
    nextOffset: null
  });
  assert.equal(receivedUrl, "https://api.example.test/organizations");
  assert.equal(receivedAuthorization, "Bearer session-token");
  assert.equal(receivedCache, "no-store");
});

test("organization gateway reports API failures without returning partial results", async () => {
  const gateway = createOrganizationsGateway({
    getApiBaseUrl: () => "https://api.example.test",
    fetchApi: async () => new Response("unavailable", { status: 503 })
  });

  assert.deepEqual(await gateway.listOrganizations("session-token"), {
    ok: false,
    message: "The organization query failed (HTTP 503)."
  });
});

test("organization gateway rejects malformed API results", async () => {
  const gateway = createOrganizationsGateway({
    getApiBaseUrl: () => "https://api.example.test",
    fetchApi: async () => Response.json({ organizations: [{ id: "org-1", name: 42 }], nextOffset: null })
  });

  assert.deepEqual(await gateway.listOrganizations("session-token"), {
    ok: false,
    message: "The organization query returned an invalid response."
  });
});

test("organization gateway reports connection failures", async () => {
  const gateway = createOrganizationsGateway({
    getApiBaseUrl: () => "https://api.example.test",
    fetchApi: async () => { throw new Error("offline"); }
  });

  assert.deepEqual(await gateway.listOrganizations("session-token"), {
    ok: false,
    message: "The organization service could not be reached."
  });
});

test("empty organization state offers the setup action in the list surface", () => {
  const markup = renderToStaticMarkup(<OrganizationResults result={{ ok: true, organizations: [], nextOffset: null }} />);
  assert.match(markup, /You don’t belong to an organization yet/);
  assert.match(markup, /Set up an organization/);
  assert.match(markup, /href="\/workspace\/organization\/new"/);
});

test("organization query errors show a retry without rendering stale organizations", () => {
  const markup = renderToStaticMarkup(<OrganizationResults result={{ ok: false, message: "The query failed." }} />);
  assert.match(markup, /Organizations could not be loaded/);
  assert.match(markup, /The query failed/);
  assert.match(markup, /Try again/);
  assert.match(markup, /href="\/workspace\/organization"/);
  assert.doesNotMatch(markup, /aria-label="Organizations"/);
});

test("successful organization results preserve gateway order", () => {
  const markup = renderToStaticMarkup(<OrganizationResults result={{
    ok: true,
    organizations: [
      { id: "member", name: "Workspace organization", status: "active", archivedAt: null },
      { id: "owned", name: "Owned organization", status: "active", archivedAt: null }
    ],
    nextOffset: null
  }} />);
  assert.ok(markup.indexOf("Workspace organization") < markup.indexOf("Owned organization"));
});

test("archived dates render in a stable timezone", () => {
  const markup = renderToStaticMarkup(<OrganizationResults result={{
    ok: true,
    organizations: [{
      id: "archived",
      name: "Archived organization",
      status: "archived",
      archivedAt: "2026-10-07T22:30:00.000Z"
    }],
    nextOffset: null
  }} />);
  assert.match(markup, /Archived on Oct 7, 2026/);
});

test("50-organization server-rendered list stays within the rendering budget", () => {
  const result = {
    ok: true as const,
    organizations: Array.from({ length: 50 }, (_, index) => ({ id: `org-${String(index)}`, name: `Organization ${String(index)}`, status: "active" as const, archivedAt: null })),
    nextOffset: 50
  };
  const durations: number[] = [];
  for (let index = 0; index < 200; index += 1) {
    const startedAt = performance.now();
    const markup = renderToStaticMarkup(<OrganizationResults result={result} />);
    assert.match(markup, /Organization 49/);
    if (index === 0) assert.match(markup, /Load more organizations/);
    durations.push(performance.now() - startedAt);
  }
  durations.sort((left, right) => left - right);
  const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
  assert.ok(p95 !== undefined && p95 < 700, `first 50 organizations render p95 was ${String(p95)} ms.`);
});

test("organization gateway requests subsequent pages only through their validated offset", async () => {
  let requestedUrl = "";
  const gateway = createOrganizationsGateway({
    getApiBaseUrl: () => "https://api.example.test",
    fetchApi: async (input) => {
      requestedUrl = String(input);
      return Response.json({ organizations: [], nextOffset: null });
    }
  });
  const result = await gateway.listOrganizations("session-token", 50);
  assert.deepEqual(result, { ok: true, organizations: [], nextOffset: null });
  assert.equal(requestedUrl, "https://api.example.test/organizations?offset=50");
});

test("a terminal 50-organization page renders no request control for an empty second page", () => {
  const result = {
    ok: true as const,
    organizations: Array.from({ length: 50 }, (_, index) => ({ id: `org-${String(index)}`, name: `Organization ${String(index)}`, status: "active" as const, archivedAt: null })),
    nextOffset: null
  };
  const markup = renderToStaticMarkup(<OrganizationResults result={result} />);
  assert.match(markup, /Organization 49/);
  assert.doesNotMatch(markup, /Load more organizations/);
});
