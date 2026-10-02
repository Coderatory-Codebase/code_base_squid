import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  createInvitationListQuery,
  type InvitationListItem
} from "../../lib/api/user-invitation";
import {
  EmptyState,
  ErrorState,
  InvitationCard
} from "../../app/(app)/identity/user-invitation/components";

test("server invitation query maps the API response without client-side state", async () => {
  let requestedUrl = "";
  const query = createInvitationListQuery(async (url) => {
    requestedUrl = url;
    return {
      invitations: [{
        id: "invitation-1",
        email: "omar@acme.test",
        role: "member",
        expiresAt: "2030-01-08T00:00:00.000Z"
      }]
    };
  });

  const invitations = await query("https://api.example.test");

  assert.equal(requestedUrl, "https://api.example.test/identity/user-invitations");
  assert.equal(invitations[0]?.email, "omar@acme.test");
  assert.ok(invitations[0]?.expiresAt instanceof Date);
});

test("invitation UI renders its pending, empty, and error states", () => {
  const invitation: InvitationListItem = Object.freeze({
    id: "invitation-1",
    email: "omar@acme.test",
    role: "member",
    expiresAt: new Date("2030-01-08T00:00:00.000Z")
  });

  assert.match(renderToStaticMarkup(<InvitationCard invitation={invitation} />), /omar@acme\.test/);
  assert.match(renderToStaticMarkup(<EmptyState />), /No pending invitations/);
  assert.match(renderToStaticMarkup(<ErrorState error={new Error("Network unavailable")} />), /Network unavailable/);
});
