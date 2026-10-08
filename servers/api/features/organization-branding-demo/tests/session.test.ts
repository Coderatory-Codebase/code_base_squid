import assert from "node:assert/strict";
import test from "node:test";
import {
  createTemporaryBrandingDemoToken,
  credentialsMatch,
  readTemporaryBrandingDemoToken
} from "../session.js";

const config = Object.freeze({
  email: "demo@example.local",
  password: "local-demo-password-123",
  workspaceId: "workspace-demo",
  sessionSecret: "local-only-random-secret-with-at-least-32-characters"
});

void test("temporary demo credentials compare email without case sensitivity and password exactly", () => {
  assert.equal(credentialsMatch(config, "DEMO@example.local", config.password), true);
  assert.equal(credentialsMatch(config, config.email, "wrong-password-123456"), false);
});

void test("temporary demo token carries the configured workspace and expires", () => {
  const token = createTemporaryBrandingDemoToken(config, 1000);
  assert.deepEqual(readTemporaryBrandingDemoToken(token, config.sessionSecret, 1001), {
    email: config.email,
    workspaceId: config.workspaceId
  });
  assert.equal(readTemporaryBrandingDemoToken(token, config.sessionSecret, 1000 + 14_400), null);
  assert.equal(readTemporaryBrandingDemoToken(`${token}x`, config.sessionSecret, 1001), null);
  assert.equal(readTemporaryBrandingDemoToken(token, "another-secret-with-at-least-32-characters", 1001), null);
});
