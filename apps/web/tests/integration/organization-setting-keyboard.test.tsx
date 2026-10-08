import test from "node:test";
import assert from "node:assert/strict";
import { act } from "react";
import { JSDOM } from "jsdom";
import type { OrganizationSettings } from "../../lib/api/organization-settings";
import type { OrganizationSettingUpdateActionResult } from "../../app/(app)/workspace/_actions/organization-setting.action";
import { OrganizationSettingsEditor } from "../../app/(app)/workspace/organization-setting/organization-settings-editor";

const organization: OrganizationSettings = {
  organizationId: "000000000000000000000001",
  name: "Acme Design",
  version: 1,
  canUpdate: true,
  timeZone: { value: "Europe/London", source: "owner" },
  weekStart: { value: "Monday", source: "default" },
  dateFormat: { value: "DD/MM/YYYY", source: "default" },
  workspaceSetupRule: { value: "any member", source: "default" }
};

void test("organization settings editor is keyboard-focusable and announces a server Conflict", async (context) => {
  const dom = new JSDOM("<!doctype html><html><body><main id='root'></main></body></html>", {
    url: "https://app.example.test/workspace/organization-setting"
  });
  for (const [name, value] of Object.entries({
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
    FormData: dom.window.FormData,
    IS_REACT_ACT_ENVIRONMENT: true
  })) {
    Object.defineProperty(globalThis, name, { configurable: true, value });
  }
  const { createRoot } = await import("react-dom/client");
  const container = dom.window.document.getElementById("root");
  assert.ok(container);
  const root = createRoot(container);
  context.after(async () => {
    await act(async () => root.unmount());
    dom.window.close();
  });

  const submissions: unknown[] = [];
  const updateSettings = async (input: unknown): Promise<OrganizationSettingUpdateActionResult> => {
    submissions.push(input);
    if (submissions.length > 1) {
      if (submissions.length === 2) {
        return { status: "failure", message: "The organization settings could not be updated. Try again." };
      }
      return {
        status: "updated",
        version: 3,
        settings: {
          timeZone: { value: "Europe/Paris", source: "owner" },
          weekStart: { value: "Sunday", source: "owner" },
          dateFormat: { value: "YYYY-MM-DD", source: "owner" },
          workspaceSetupRule: { value: "owner only", source: "owner" }
        }
      };
    }
    return {
      status: "conflict",
      current: {
        version: 2,
        settings: {
          timeZone: { value: "Europe/Berlin", source: "owner" },
          weekStart: { value: "Sunday", source: "owner" },
          dateFormat: { value: "YYYY-MM-DD", source: "owner" },
          workspaceSetupRule: { value: "owner only", source: "owner" }
        }
      }
    };
  };

  await act(async () => {
    root.render(<OrganizationSettingsEditor organization={organization} updateSettings={updateSettings} />);
  });

  const initialFocusOrder = [...container.querySelectorAll<HTMLElement>("input, select, button:not(:disabled)")];
  assert.deepEqual(initialFocusOrder.map(({ tagName, textContent }) =>
    tagName.toLowerCase() === "button" ? textContent?.trim() : tagName.toLowerCase()
  ), ["input", "select", "select", "select"]);
  const ringClasses = [
    "focus-visible:ring-2",
    "focus-visible:ring-ring",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-offset-background",
    "dark:focus-visible:ring-sky-300",
    "dark:focus-visible:ring-offset-slate-950"
  ];
  for (const control of initialFocusOrder) {
    control.focus();
    assert.equal(dom.window.document.activeElement, control, `${control.tagName} accepts keyboard focus in natural tab order`);
    assert.equal(control.hasAttribute("tabindex"), false, "native focus order is preserved");
    for (const className of ringClasses) assert.ok(control.classList.contains(className), `${control.tagName} has theme-token focus styling`);
  }
  const controlLabels = [...container.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input, select")]
    .map((control) => control.labels?.[0]?.textContent?.trim() ?? "");
  assert.ok(controlLabels[0]?.startsWith("Time zone"));
  assert.ok(controlLabels[1]?.startsWith("Week starts"));
  assert.ok(controlLabels[2]?.startsWith("Date format"));
  assert.ok(controlLabels[3]?.startsWith("Workspace setup rule"));
  dom.window.document.documentElement.classList.add("dark");
  for (const control of initialFocusOrder) {
    for (const className of ringClasses) assert.ok(control.classList.contains(className), `${control.tagName} retains focus styling in dark theme`);
  }
  dom.window.document.documentElement.classList.remove("dark");

  const timezone = container.querySelector<HTMLInputElement>("input");
  const save = [...container.querySelectorAll("button")].find((button) => button.textContent?.includes("Save settings"));
  assert.ok(timezone);
  assert.ok(save);
  assert.equal(timezone.labels?.[0]?.textContent?.trim(), "Time zone");
  assert.equal(timezone.required, true, "validation is identified by a label and required semantics, not color alone");
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")?.set;
    assert.ok(setter);
    setter.call(timezone, "Europe/Paris");
    timezone.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    timezone.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  });
  const changedFocusOrder = [...container.querySelectorAll<HTMLElement>("input, select, button:not(:disabled)")];
  assert.deepEqual(changedFocusOrder.map(({ tagName }) => tagName.toLowerCase()), ["input", "select", "select", "select", "button"]);
  for (const control of changedFocusOrder) {
    control.focus();
    assert.equal(dom.window.document.activeElement, control, `${control.tagName} accepts keyboard focus after editing`);
    for (const className of ringClasses) assert.ok(control.classList.contains(className), `${control.tagName} has a visible focus ring`);
  }
  await act(async () => {
    save.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  assert.equal(submissions.length, 1);
  assert.match(JSON.stringify(submissions[0]), /Europe\/Paris/u);
  assert.match(JSON.stringify(submissions[0]), /"expectedVersion":1/u);
  const conflict = container.querySelector<HTMLElement>("[role='alert']");
  assert.ok(conflict);
  assert.equal(conflict.getAttribute("role"), "alert");
  assert.match(conflict.textContent ?? "", /Settings changed on the server/u);
  assert.match(conflict.textContent ?? "", /Europe\/Berlin/u);
  const status = container.querySelector<HTMLElement>("[role='status'][aria-live='polite']");
  assert.ok(status);
  assert.match(status.textContent ?? "", /changed while you were editing/u);

  const conflictButtons = [...conflict.querySelectorAll<HTMLButtonElement>("button")];
  assert.deepEqual(conflictButtons.map(({ textContent }) => textContent?.trim()), [
    "Use current settings",
    "Apply my changes to current version"
  ]);
  for (const button of conflictButtons) {
    button.focus();
    assert.equal(dom.window.document.activeElement, button, `${button.textContent?.trim()} is keyboard-focusable`);
    for (const className of ringClasses) assert.ok(button.classList.contains(className), "conflict actions have visible focus styling");
  }

  const retry = conflictButtons.find((button) => button.textContent?.includes("Apply my changes"));
  assert.ok(retry);
  await act(async () => {
    retry.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  assert.equal(submissions.length, 2);
  assert.equal(status.textContent?.trim(), "The organization settings could not be updated. Try again.");
  assert.equal(container.querySelector("[role='alert']"), null, "the stale conflict panel clears after the retry failure");
  assert.equal(container.querySelector("[aria-live='polite']")?.textContent?.trim(),
    "Changes are saved only after you select Save settings.", "the optimistic preview rolls back to the last confirmed state");
  assert.equal(timezone.value, "Europe/Paris", "the owner's unsaved draft remains available after rollback");

  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")?.set;
    assert.ok(setter);
    setter.call(timezone, "Europe/Berlin");
    timezone.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    timezone.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  });
  const form = container.querySelector("form");
  assert.ok(form);
  await act(async () => {
    form.requestSubmit(save);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  assert.equal(submissions.length, 3);
  assert.equal(container.querySelector("[role='status']")?.textContent?.trim(), "Organization settings saved.");
  assert.equal(container.querySelector("[role='status']")?.getAttribute("aria-live"), "polite");
});
