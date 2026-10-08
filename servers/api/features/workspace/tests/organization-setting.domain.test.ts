import assert from "node:assert/strict";
import test from "node:test";
import { resolveOrganizationSetting } from "../domain/organization-setting.js";

void test("organization setting rule applies defaults to a legacy null settings value", () => {
  assert.deepEqual(resolveOrganizationSetting(null), {
    ok: true,
    value: {
      timeZone: { value: "UTC", source: "default" },
      weekStart: { value: "Monday", source: "default" },
      dateFormat: { value: "DD/MM/YYYY", source: "default" },
      workspaceSetupRule: { value: "any member", source: "default" }
    }
  });
});

void test("organization setting rule supplies explicit defaults when the organization has no overrides", () => {
  assert.deepEqual(resolveOrganizationSetting({}), {
    ok: true,
    value: {
      timeZone: { value: "UTC", source: "default" },
      weekStart: { value: "Monday", source: "default" },
      dateFormat: { value: "DD/MM/YYYY", source: "default" },
      workspaceSetupRule: { value: "any member", source: "default" }
    }
  });
});

void test("organization setting rule preserves valid organization overrides", () => {
  assert.deepEqual(resolveOrganizationSetting({
    timeZone: "Asia/Karachi",
    weekStart: "Sunday",
    dateFormat: "YYYY-MM-DD",
    workspaceSetupRule: "owner only"
  }), {
    ok: true,
    value: {
      timeZone: { value: "Asia/Karachi", source: "owner" },
      weekStart: { value: "Sunday", source: "owner" },
      dateFormat: { value: "YYYY-MM-DD", source: "owner" },
      workspaceSetupRule: { value: "owner only", source: "owner" }
    }
  });
});

void test("organization setting rule returns a typed failure for an invalid time zone", () => {
  assert.deepEqual(resolveOrganizationSetting({ timeZone: "Not/A_Time_Zone" }), {
    ok: false,
    error: { code: "invalid_value", field: "timeZone" }
  });
});

void test("organization setting rule returns a typed failure for an invalid week start", () => {
  assert.deepEqual(resolveOrganizationSetting({ weekStart: "Tuesday" }), {
    ok: false,
    error: { code: "invalid_value", field: "weekStart" }
  });
});

void test("organization setting rule returns a typed failure for an invalid date format", () => {
  assert.deepEqual(resolveOrganizationSetting({ dateFormat: "YYYY/MM/DD" }), {
    ok: false,
    error: { code: "invalid_value", field: "dateFormat" }
  });
});

void test("organization setting rule returns a typed failure for an invalid workspace setup rule", () => {
  assert.deepEqual(resolveOrganizationSetting({ workspaceSetupRule: "admins only" }), {
    ok: false,
    error: { code: "invalid_value", field: "workspaceSetupRule" }
  });
});
