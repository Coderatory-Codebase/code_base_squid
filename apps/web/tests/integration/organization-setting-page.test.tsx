import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import axe from "axe-core";
import { JSDOM } from "jsdom";
import {
  createOrganizationSettingsRequest,
  createOrganizationSettingsQuery,
  type OrganizationSettings
} from "../../lib/api/organization-settings";
import {
  EmptyState,
  ErrorState,
  OrganizationSettingsList
} from "../../app/(app)/workspace/organization-setting/components";

const organizationSettings: OrganizationSettings = Object.freeze({
  name: "Acme Design",
  timeZone: Object.freeze({ value: "Europe/London", source: "owner" }),
  weekStart: Object.freeze({ value: "Monday", source: "default" }),
  dateFormat: Object.freeze({ value: "DD/MM/YYYY", source: "default" }),
  workspaceSetupRule: Object.freeze({ value: "any member", source: "owner" })
});

void test("organization settings query reads from the API gateway and returns parsed settings", async () => {
  let requestedUrl = "";
  const query = createOrganizationSettingsQuery(async (url) => {
    requestedUrl = url;
    return { settings: [organizationSettings] };
  });

  const result = await query("https://api.example.test");

  assert.equal(requestedUrl, "https://api.example.test/workspace/organization-settings");
  assert.equal(result[0]?.timeZone.value, "Europe/London");
  assert.equal(result[0]?.timeZone.source, "owner");
});

void test("organization settings request forwards the server session without caching", async () => {
  let requestedUrl = "";
  let requestInit: RequestInit | undefined;
  const request = createOrganizationSettingsRequest("server-session-token", async (input, init) => {
    requestedUrl = String(input);
    requestInit = init;
    return new Response(JSON.stringify({ settings: [organizationSettings] }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  });

  const result = await request("https://api.example.test/workspace/organization-settings");

  assert.equal(requestedUrl, "https://api.example.test/workspace/organization-settings");
  assert.equal(new Headers(requestInit?.headers).get("authorization"), "Bearer server-session-token");
  assert.equal(requestInit?.cache, "no-store");
  assert.equal(result.settings[0]?.timeZone.value, "Europe/London");
});

void test("organization settings view renders values and their source labels", () => {
  const markup = renderToStaticMarkup(<OrganizationSettingsList settings={[organizationSettings]} />);

  assert.match(markup, /Europe\/London/);
  assert.match(markup, /Acme Design/);
  assert.match(markup, /Set by the owner/);
  assert.match(markup, /Set by default/);
  assert.match(markup, /Only the organization owner can change these settings\./);
  assert.doesNotMatch(markup, /<(?:input|button|form)\b/u);
});

void test("an owner row exposes its named settings editor", () => {
  const ownerSettings: OrganizationSettings = {
    ...organizationSettings,
    organizationId: "0000000000000000000000a1",
    name: "Owned organization",
    version: 1,
    canUpdate: true
  };
  const markup = renderToStaticMarkup(
    <OrganizationSettingsList
      settings={[ownerSettings]}
      updateSettings={async () => ({ status: "failure", message: "Not submitted in this render test." })}
    />
  );

  assert.match(markup, /Owned organization/u);
  assert.match(markup, /<input[^>]*id="timezone-0000000000000000000000a1"/u);
  assert.match(markup, /<select[^>]*id="week-start-0000000000000000000000a1"/u);
  assert.match(markup, /<select[^>]*id="date-format-0000000000000000000000a1"/u);
  assert.match(markup, /<select[^>]*id="setup-rule-0000000000000000000000a1"/u);
  assert.match(markup, /Save settings/u);
});

void test("empty organization settings state offers the organization setup action", () => {
  const markup = renderToStaticMarkup(<EmptyState />);

  assert.match(markup, /No organization settings found/);
  assert.match(markup, /Set up an organization/);
  assert.match(markup, /href="\/workspace\/organization\/new"/);
  assert.equal((markup.match(/<a\b/g) ?? []).length, 1);
});

void test("organization settings error explains the failure and provides a retry", () => {
  const markup = renderToStaticMarkup(<ErrorState error={new Error("Unable to load organization settings (503). ")} />);

  assert.match(markup, /Could not load organization settings/);
  assert.match(markup, /503/);
  assert.match(markup, /Refreshing the page retries the server request/);
  assert.match(markup, /href="\/workspace\/organization-setting"/);
  assert.equal((markup.match(/<a\b/g) ?? []).length, 1);
});

void test("organization settings content and actions expose accessible semantics and keyboard focus", async () => {
  const markup = [
    "<html lang=\"en\"><head><title>Organization settings</title></head><body><main>",
    "<h1>Organization settings</h1>",
    renderToStaticMarkup(<OrganizationSettingsList settings={[organizationSettings]} />),
    renderToStaticMarkup(<EmptyState />),
    renderToStaticMarkup(<ErrorState error={new Error("Settings service unavailable.")} />),
    "</main></body></html>"
  ].join("");
  const dom = new JSDOM(markup, { url: "https://app.example.test/workspace/organization-setting", runScripts: "outside-only" });
  const document = dom.window.document;
  const settingsNotice = document.querySelector("p");
  assert.equal(settingsNotice?.textContent?.trim(), "Only the organization owner can change these settings.");
  assert.equal(settingsNotice?.getAttribute("role"), null, "static explanatory text should use native paragraph semantics");

  const links = [...document.querySelectorAll("a")];
  assert.deepEqual(links.map((link) => link.textContent?.trim()), ["Set up an organization", "Retry"]);
  for (const link of links) {
    assert.ok(link.getAttribute("href"), "actions should use native links with destinations");
    assert.equal(link.hasAttribute("tabindex"), false, "native links should retain their normal keyboard order");
    link.focus();
    assert.equal(document.activeElement, link, `${link.textContent?.trim()} should accept keyboard focus`);
  }

  const axeWindow = dom.window as unknown as typeof dom.window & { axe: typeof axe };
  axeWindow.eval(axe.source);
  // jsdom has no rendered styles, so color contrast needs a real browser check.
  const results = await axeWindow.axe.run(document, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    rules: { "color-contrast": { enabled: false } }
  });
  assert.equal(results.violations.length, 0, JSON.stringify(results.violations.map(({ id, impact }) => ({ id, impact }))));
  dom.window.close();
});
