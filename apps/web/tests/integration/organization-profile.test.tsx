import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import type { ApiOrganizationProfileResponse } from "@workspace/types";
import { OrganizationProfilePage, OrganizationSignInRequired, OrganizationProfileLoadError, OrganizationProfileUnavailable, loadOrganizationProfile } from "../../features/organization-profile";

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

void test("validates the workspace data shape before rendering the profile", async () => {
  const result = await loadOrganizationProfile({
    apiBaseUrl: "https://api.example.test",
    organizationId: "organization-1",
    fetcher: async () => Response.json({
      ...profile,
      workspaces: [{ id: "studio", name: "Studio", state: "ACTIVE", activeMemberCount: 12 }]
    })
  });

  assert.deepEqual(result, {
    kind: "profile",
    profile: {
      ...profile,
      workspaces: [{ id: "studio", name: "Studio", state: "ACTIVE", activeMemberCount: 12 }]
    }
  });

  const invalidResult = await loadOrganizationProfile({
    apiBaseUrl: "https://api.example.test",
    organizationId: "organization-1",
    fetcher: async () => Response.json({ ...profile, workspaces: [{ id: "studio", activeMemberCount: -1 }] })
  });
  assert.deepEqual(invalidResult, { kind: "error" });
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

void test("maps 503 and network failures to a retryable server-rendered error state", async () => {
  assert.deepEqual(await loadOrganizationProfile({
      apiBaseUrl: "https://api.example.test",
      organizationId: "organization-1",
      fetcher: async () => new Response(null, { status: 503 })
    }), { kind: "error" });

  const networkError = new Error("network unavailable");
  assert.deepEqual(await loadOrganizationProfile({
      apiBaseUrl: "https://api.example.test",
      organizationId: "organization-1",
      fetcher: async () => { throw networkError; }
    }), { kind: "error" });
  const errorMarkup = renderToStaticMarkup(<OrganizationProfileLoadError retryHref="/organizations/organization-1" />);
  assert.match(errorMarkup, /<p[^>]*aria-live="assertive"[^>]*role="alert"/);
  assert.match(errorMarkup, /aria-atomic="true"/);
  assert.match(errorMarkup, /profile service is unavailable/);
  assert.match(errorMarkup, /Retry/);
});

void test("renders profile name, owner ID, setup date, and deletion status", () => {
  const markup = renderToStaticMarkup(<OrganizationProfilePage profile={profile} retryHref="/organizations/organization-1" />);
  assert.match(markup, /Example Organization/);
  assert.match(markup, /owner-1/);
  assert.match(markup, /January 15, 2025/);
  assert.match(markup, /Deletion scheduled/);
  assert.doesNotMatch(markup, /owner display name/i);
});

void test("renders active and archived organization states", () => {
  const activeMarkup = renderToStaticMarkup(
    <OrganizationProfilePage profile={{ ...profile, state: { kind: "ACTIVE" } }} retryHref="/organizations/organization-1" />
  );
  const archivedMarkup = renderToStaticMarkup(
    <OrganizationProfilePage profile={{ ...profile, state: { kind: "ARCHIVED" } }} retryHref="/organizations/organization-1" />
  );

  assert.match(activeMarkup, />Active</);
  assert.match(archivedMarkup, />Archived</);
});

void test("renders workspace names, state and active-member counts in a read-only island", () => {
  const markup = renderToStaticMarkup(
    <OrganizationProfilePage
      profile={{
        ...profile,
        workspaces: [
          { id: "studio", name: "Studio", state: "ACTIVE", activeMemberCount: 12 },
          { id: "old-site", name: "Old site", state: "ARCHIVED", activeMemberCount: 10 }
        ]
      }}
      retryHref="/organizations/organization-1"
    />
  );

  assert.match(markup, /Organization workspaces/);
  assert.match(markup, /Studio/);
  assert.match(markup, /State: <\/span><span>Active/);
  assert.match(markup, /Active members: <\/span><span>12/);
  assert.match(markup, /Old site/);
  assert.match(markup, /State: <\/span><span>Archived/);
  assert.match(markup, /Active members: <\/span><span>10/);
  assert.doesNotMatch(markup, /<button|<input|<select/);
});

void test("renders empty and unavailable workspace states distinctly", () => {
  const emptyMarkup = renderToStaticMarkup(
    <OrganizationProfilePage profile={{ ...profile, workspaces: [] }} retryHref="/organizations/organization-1" />
  );
  const unavailableMarkup = renderToStaticMarkup(
    <OrganizationProfilePage profile={profile} retryHref="/organizations/organization-1" />
  );

  assert.match(emptyMarkup, /This organization has no workspaces yet/);
  assert.match(unavailableMarkup, /Workspace details are unavailable right now/);
  assert.match(unavailableMarkup, /href="\/organizations\/organization-1"/);
  assert.match(unavailableMarkup, /focus-visible:ring-2/);
  assert.match(unavailableMarkup, />Retry<\/a>/);
});

void test("renders owner display names and scheduled delection dates in the organization summary", () => {
  const markup = renderToStaticMarkup(
    <OrganizationProfilePage
      profile={{
        ...profile,
        ownerDisplayName: "Priya",
        state: { kind: "DELETION_SCHEDULED", effectiveOn: "2026-11-20T00:00:00.000Z" }
      }}
      retryHref="/organizations/organization-1"
    />
  );

  assert.match(markup, /Priya/);
  assert.match(markup, /Deletion scheduled — 20 Nov 2026/);
  assert.match(markup, /Example Organization/);
});

void test("AC-4 partial-state journey: an unavailable owner shows Retry without replacing the profile", () => {
  const markup = renderToStaticMarkup(
    <OrganizationProfilePage
      profile={{
        ...profile,
        ownerDisplayName: null,
        ownerUnavailable: true
      }}
      retryHref="/organizations/organization-1"
    />
  );

  assert.match(markup, /Owner: unavailable/);
  assert.match(markup, /<p[^>]*aria-live="polite"[^>]*role="status"[^>]*>Owner: unavailable</);
  assert.match(markup, /Retry/);
  assert.match(markup, /href="\/organizations\/organization-1"/);
  assert.match(markup, /Example Organization/);
  assert.doesNotMatch(markup, /Error page/i);
});

void test("renders a generic unavailable state without distinguishing forbidden from unknown", () => {
  const markup = renderToStaticMarkup(<OrganizationProfileUnavailable />);
  assert.match(markup, /<p[^>]*aria-live="polite"[^>]*role="status"/);
  assert.match(markup, /can’t be found or you don’t have access/);
  assert.match(markup, /Return to organizations/);
  assert.doesNotMatch(markup, /Example Organization|owner-1/);
});
