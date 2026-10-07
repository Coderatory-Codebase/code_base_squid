import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { OrganizationSetupForm } from "../../features/organizations/organization-setup-form.js";
import { organizationNameSchema } from "../../features/organizations/organization-setup.validation.js";
import { initialOrganizationSetupState } from "../../features/organizations/organization-setup.state.js";

const renderForm = (error?: string): string => renderToStaticMarkup(
  <OrganizationSetupForm
    action={async () => initialOrganizationSetupState}
    initialState={error ? { status: "invalid", message: error === "name" ? "Enter an organization name." : error } : initialOrganizationSetupState}
  />
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
  assert.match(markup, /aria-invalid="true"/);
  assert.match(markup, /aria-describedby="organization-setup-feedback"/);
});

test("organization name validation trims input and explains empty and overlong names", () => {
  assert.equal(organizationNameSchema.safeParse("  Acme Design  ").success, true);
  assert.equal(organizationNameSchema.safeParse("").success, false);
  const tooLong = organizationNameSchema.safeParse("a".repeat(81));
  assert.equal(tooLong.success, false);
  if (!tooLong.success) assert.equal(tooLong.error.issues[0]?.message, "Organization names must be 80 characters or fewer.");
});
