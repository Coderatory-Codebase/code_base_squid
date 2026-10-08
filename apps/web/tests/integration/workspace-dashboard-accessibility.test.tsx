import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import axe from "axe-core";
import { JSDOM } from "jsdom";
import { InviteMemberForm } from "../../features/organizations/invite-member-form.js";

test("team invitation controls have named native inputs and keyboard-operable actions", () => {
  const markup = renderToStaticMarkup(<InviteMemberForm organizationId="000000000000000000000071" />);
  assert.match(markup, /<label[^>]*for="invite-email"[^>]*>[\s\S]*Email address/);
  assert.match(markup, /id="invite-email"[^>]*required=""[^>]*type="email"[^>]*name="email"/);
  assert.match(markup, /<label[^>]*for="invite-role"[^>]*>[\s\S]*Role/);
  assert.match(markup, /<button[^>]*type="submit"[^>]*>Create invite link/);
  assert.doesNotMatch(markup, /tabindex=/i);
});

test("axe-core reports no WCAG A/AA violations on the team invitation surface", async () => {
  const formMarkup = renderToStaticMarkup(<InviteMemberForm organizationId="000000000000000000000071" />);
  const dom = new JSDOM(
    `<html lang="en"><head><title>Workspace dashboard</title></head><body><main><h1>Workspace dashboard</h1>${formMarkup}</main></body></html>`,
    { url: "https://app.example.test/workspace/dashboard", runScripts: "outside-only" }
  );
  const axeWindow = dom.window as unknown as typeof dom.window & { axe: typeof axe };
  axeWindow.eval(axe.source);
  // jsdom has no rendered styles or canvas support, so contrast needs a real browser check.
  const results = await axeWindow.axe.run(axeWindow.document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    rules: { "color-contrast": { enabled: false } }
  });
  assert.equal(results.violations.length, 0, JSON.stringify(results.violations.map(({ id, impact }) => ({ id, impact }))));
  dom.window.close();
});
