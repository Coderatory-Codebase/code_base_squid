import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { OrganizationBrandingView } from "../../features/organization-branding";

void test("T2: the empty state explains that no organization matched and offers a reload action", () => {
  const markup = renderToStaticMarkup(<OrganizationBrandingView data={{ kind: "empty" }} organizationId="org-missing" />);
  assert.match(markup, /No organization found\./);
  assert.match(markup, /There is no organization available for this selection\./);
  assert.match(markup, /Reload organization list/);
  assert.match(markup, /href="\/workspace\/organization-branding"/);
});

void test("T2: the unavailable state says what failed and offers a retry", () => {
  const markup = renderToStaticMarkup(<OrganizationBrandingView data={{ kind: "unavailable" }} organizationId="org-acme" />);
  assert.match(markup, /We couldn’t load this workspace\./);
  assert.match(markup, /organization branding service did not respond/i);
  assert.match(markup, /Try again/);
  assert.match(markup, /href="\/workspace\/organization-branding\?organizationId=org-acme"/);
});

