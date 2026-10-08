import assert from "node:assert/strict";
import test from "node:test";
import { getDisplayNameValidationMessage } from "../../features/identity/display-name-validation.js";

test("display names allow 1 through 80 trimmed characters", () => {
  assert.equal(getDisplayNameValidationMessage(" Lena "), null);
  assert.equal(getDisplayNameValidationMessage("x"), null);
  assert.equal(getDisplayNameValidationMessage("x".repeat(80)), null);
});

test("display names explain empty and overlong values", () => {
  assert.equal(getDisplayNameValidationMessage("   "), "Enter a display name.");
  assert.equal(getDisplayNameValidationMessage("x".repeat(81)), "Use 80 characters or fewer.");
});
