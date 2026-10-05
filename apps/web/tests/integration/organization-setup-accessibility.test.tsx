import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { OrganizationSetupForm } from "../../features/organizations/organization-setup-form.js";

const renderForm = (error?: string): string => renderToStaticMarkup(
  <OrganizationSetupForm action={async () => undefined} error={error} />
);

test("organization setup controls have keyboard-operable native semantics and accessible names", () => {
  const markup = renderForm();

  assert.match(markup, /<form[^>]*>/);
  assert.match(markup, /<label[^>]*for="name"[^>]*>Organization name<input[^>]*id="name"[^>]*required(?:="")?[^>]*name="name"/);
  assert.match(markup, /<button[^>]*type="submit"[^>]*>Create organization<\/button>/);
  assert.match(markup, /<a[^>]*href="\/workspace\/organization"[^>]*>Cancel<\/a>/);
  assert.doesNotMatch(markup, /tabindex=|aria-hidden="true"/);
});
test("organization setup errors are announced through a polite live region", () => {
  const markup = renderForm("name");

  assert.match(markup, /<p[^>]*aria-live="polite"[^>]*>Enter an organization name\.<\/p>/);
});
