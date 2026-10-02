import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import type { ApiOrganizationProfileResponse } from "@workspace/types";
import { OrganizationProfilePage, OrganizationSignInRequired, loadOrganizationProfile } from "../../features/organization-profile";

const profile: ApiOrganizationProfileResponse = {
  id: "organization-1",
  name: "Example Organization",
  ownerId: "owner-1",
  createdAt: "2025-01-15T12:00:00.000Z",
  state: { kind: "DELETION_SCHEDULED", effectiveOn: "2025-03-15T12:00:00.000Z" }
};

void test("loads profile data from the API without caching or browser-side retries", async () => {
  let requestedUrl = "";
  let requestOptions: RequestInit | undefined;
  const result = await loadOrganizationProfile({
    apiBaseUrl: "https://api.example.test/",
    organizationId: "organization-1",
    fetcher: async (input, init) => {
      requestedUrl = String(input);
      requestOptions = init;
      return Response.json(profile);
    }
  });

  assert.equal(requestedUrl, "https://api.example.test/workspace/organization-profile/organization-1");
  assert.deepEqual(requestOptions, { cache: "no-store" });
  assert.deepEqual(result, { kind: "profile", profile });
});

void test("maps 401 to sign-in required without retry UI", async () => {
  const result = await loadOrganizationProfile({
    apiBaseUrl: "https://api.example.test",
    organizationId: "organization-1",
    fetcher: async () => new Response(null, { status: 401 })
  });

  assert.deepEqual(result, { kind: "unauthorized" });
  const markup = renderToStaticMarkup(<OrganizationSignInRequired />);
  assert.match(markup, /Sign in required/);
  assert.doesNotMatch(markup, /Retry/);
});

void test("maps 404 to not-found without distinguishing unavailable organizations", async () => {
  const result = await loadOrganizationProfile({
    apiBaseUrl: "https://api.example.test",
    organizationId: "malformed-id",
    fetcher: async () => new Response(null, { status: 404 })
  });

  assert.equal(result, null);
});

void test("propagates 503 and network failures to the route error boundary", async () => {
  await assert.rejects(
    loadOrganizationProfile({
      apiBaseUrl: "https://api.example.test",
      organizationId: "organization-1",
      fetcher: async () => new Response(null, { status: 503 })
    }),
    /status 503/
  );

  const networkError = new Error("network unavailable");
  await assert.rejects(
    loadOrganizationProfile({
      apiBaseUrl: "https://api.example.test",
      organizationId: "organization-1",
      fetcher: async () => { throw networkError; }
    }),
    networkError
  );
});

void test("renders profile name, owner ID, setup date, and deletion status", () => {
  const markup = renderToStaticMarkup(<OrganizationProfilePage profile={profile} />);
  assert.match(markup, /Example Organization/);
  assert.match(markup, /owner-1/);
  assert.match(markup, /January 15, 2025/);
  assert.match(markup, /Deletion scheduled/);
  assert.doesNotMatch(markup, /owner display name/i);
});

void test("renders active and archived organization states", () => {
  const activeMarkup = renderToStaticMarkup(
    <OrganizationProfilePage profile={{ ...profile, state: { kind: "ACTIVE" } }} />
  );
  const archivedMarkup = renderToStaticMarkup(
    <OrganizationProfilePage profile={{ ...profile, state: { kind: "ARCHIVED" } }} />
  );

  assert.match(activeMarkup, />Active</);
  assert.match(archivedMarkup, />Archived</);
});
