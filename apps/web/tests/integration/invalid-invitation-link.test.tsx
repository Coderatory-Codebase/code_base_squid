import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { InvalidInvitationLink } from "../../features/user-invitation-acceptance";

void test("invalid, expired, used, revoked, and unknown invitation links use one safe message", () => {
  const markup = renderToStaticMarkup(<InvalidInvitationLink />);
  assert.match(markup, /Invitation unavailable/);
  assert.match(markup, /This invitation is no longer valid\. Ask the person who sent it for a new one\./);
  assert.doesNotMatch(markup, /expired|revoked|accepted|unknown/i);
});
