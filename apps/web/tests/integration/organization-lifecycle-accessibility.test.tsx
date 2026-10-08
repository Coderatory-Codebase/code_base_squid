import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { OrganizationLifecycleControls } from "../../features/organizations/organization-lifecycle-controls.js";

const active = { status: "active" as const, version: 0, archivedAt: null };

test("owner lifecycle controls are keyboard-operable with state announcements", () => {
  const markup = renderToStaticMarkup(<OrganizationLifecycleControls
    canManage
    initialLifecycle={active}
    organizationId="000000000000000000000071"
  />);
  assert.match(markup, /<h2[^>]*>Organization status<\/h2>/);
  assert.match(markup, /<button[^>]*type="button"[^>]*>Archive organization<\/button>/);
  assert.match(markup, /aria-live="polite"[^>]*role="status"/);
  assert.doesNotMatch(markup, /Soft-delete organization/);
});

test("non-owner viewers receive no lifecycle mutation controls", () => {
  const markup = renderToStaticMarkup(<OrganizationLifecycleControls
    canManage={false}
    initialLifecycle={{ status: "archived", version: 1, archivedAt: "2026-10-07T12:00:00.000Z" }}
    organizationId="000000000000000000000071"
  />);
  assert.match(markup, /Archived organizations stay readable/);
  assert.doesNotMatch(markup, /<button/);
});

test("soft-deleted organizations expose terminal status without invalid restore actions", () => {
  const markup = renderToStaticMarkup(<OrganizationLifecycleControls
    canManage
    initialLifecycle={{ status: "deleted", version: 2, archivedAt: "2026-10-07T12:00:00.000Z" }}
    organizationId="000000000000000000000071"
  />);
  assert.match(markup, /soft-deleted and no longer appears in organization lists/);
  assert.doesNotMatch(markup, /<button/);
});
