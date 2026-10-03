import test from "node:test";
import assert from "node:assert/strict";
import { ZodError } from "zod";
import { createApiConfig, readApiEnvironment } from "../config/index.js";

void test("derives API configuration from validated environment input", () => {
  const environment = readApiEnvironment({
    NODE_ENV: "production",
    API_HOST: "0.0.0.0",
    API_PORT: "8080",
    WEB_ORIGIN: "https://example.test",
    LOG_LEVEL: "warn"
  });
  assert.deepEqual(createApiConfig(environment), {
    environment: "production",
    host: "0.0.0.0",
    port: 8080,
    webOrigin: "https://example.test",
    logLevel: "warn"
  });
});

void test("rejects invalid server environment input", () => {
  assert.throws(() => readApiEnvironment({ API_PORT: "70000" }));
});

void test("requires runtime values from the environment", () => {
  assert.throws(() => readApiEnvironment({}), ZodError);
});

void test("accepts a configured OIDC provider and secure callback configuration", () => {
  const required = {
    NODE_ENV: "test",
    API_HOST: "127.0.0.1",
    API_PORT: "4000",
    WEB_ORIGIN: "http://localhost:3000",
    LOG_LEVEL: "silent"
  };
  const singleProvider = {
    ...required,
    GOOGLE_OIDC_CLIENT_ID: "google-client",
    GOOGLE_OIDC_CLIENT_SECRET: "google-secret",
    OIDC_CALLBACK_BASE_URL: "http://localhost:4000",
    OIDC_FLOW_COOKIE_KEY: Buffer.alloc(32, 4).toString("base64url")
  };

  const googleOnly = createApiConfig(readApiEnvironment(singleProvider));
  assert.deepEqual(Object.keys(googleOnly.oidc?.providers ?? {}), ["google"]);

  const environment = readApiEnvironment({
    ...singleProvider,
    MICROSOFT_OIDC_ISSUER: "https://login.microsoftonline.com/tenant/v2.0",
    MICROSOFT_OIDC_CLIENT_ID: "microsoft-client",
    MICROSOFT_OIDC_CLIENT_SECRET: "microsoft-secret"
  });
  const config = createApiConfig(environment);

  assert.deepEqual(Object.keys(config.oidc?.providers ?? {}).sort(), ["google", "microsoft"]);
});
