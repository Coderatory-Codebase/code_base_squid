import assert from "node:assert/strict";
import test from "node:test";
import type { Configuration } from "openid-client";
import { createOidcProvider } from "./openid-connect.js";

const providerConfigurations = {
  google: {
    issuer: new URL("https://accounts.google.com"),
    clientId: "google-client",
    clientSecret: "google-secret"
  },
  microsoft: {
    issuer: new URL("https://login.microsoftonline.com/tenant/v2.0"),
    clientId: "microsoft-client",
    clientSecret: "microsoft-secret"
  }
} as const;

void test("OIDC adapter uses authorization code, PKCE, state, nonce, and verified claims", async () => {
  const configuration = {} as Configuration;
  let authorizationParameters: Record<string, string> | URLSearchParams | undefined;
  let grantChecks: unknown;
  let discoveryCount = 0;
  const provider = createOidcProvider({
    providers: providerConfigurations,
    client: {
      discovery: () => {
        discoveryCount += 1;
        return Promise.resolve(configuration);
      },
      randomPKCECodeVerifier: () => "pkce-verifier",
      calculatePKCECodeChallenge: (verifier) => Promise.resolve(`challenge:${verifier}`),
      randomState: () => "oauth-state",
      randomNonce: () => "oidc-nonce",
      buildAuthorizationUrl: (_configuration, parameters) => {
        authorizationParameters = parameters;
        return new URL("https://accounts.google.com/authorize");
      },
      authorizationCodeGrant: (_configuration, _callbackUrl, checks) => {
        grantChecks = checks;
        return Promise.resolve({
          claims: () => ({
            sub: "g-1001",
            email: "lena@acme.test",
            email_verified: true,
            name: "Lena Park"
          })
        });
      }
    }
  });

  const attempt = await provider.createAuthorizationRequest("google", "https://api.test/identity/callback/google");
  assert.equal(attempt.kind, "ready");
  const result = await provider.verifyCallback(
    "google",
    "https://api.test/identity/callback/google?code=verified-code&state=oauth-state",
    "https://api.test/identity/callback/google",
    attempt.context
  );

  assert.equal(discoveryCount, 1);
  assert.equal(attempt.authorizationUrl, "https://accounts.google.com/authorize");
  assert.deepEqual(authorizationParameters, {
    redirect_uri: "https://api.test/identity/callback/google",
    scope: "openid email profile",
    response_type: "code",
    code_challenge: "challenge:pkce-verifier",
    code_challenge_method: "S256",
    state: "oauth-state",
    nonce: "oidc-nonce"
  });
  assert.deepEqual(grantChecks, {
    expectedState: "oauth-state",
    expectedNonce: "oidc-nonce",
    pkceCodeVerifier: "pkce-verifier"
  });
  assert.deepEqual(result, {
    kind: "verified",
    identity: {
      provider: "google",
      subject: "g-1001",
      email: "lena@acme.test",
      displayName: "Lena Park"
    }
  });
});

void test("OIDC adapter rejects unverified email claims", async () => {
  const provider = createOidcProvider({
    providers: providerConfigurations,
    client: {
      discovery: () => Promise.resolve({} as Configuration),
      randomPKCECodeVerifier: () => "pkce-verifier",
      calculatePKCECodeChallenge: () => Promise.resolve("challenge"),
      randomState: () => "oauth-state",
      randomNonce: () => "oidc-nonce",
      buildAuthorizationUrl: () => new URL("https://accounts.google.com/authorize"),
      authorizationCodeGrant: () => Promise.resolve({
        claims: () => ({
          sub: "g-1001",
          email: "lena@acme.test",
          email_verified: false,
          name: "Lena Park"
        })
      })
    }
  });
  const attempt = await provider.createAuthorizationRequest("google", "https://api.test/callback");
  assert.equal(attempt.kind, "ready");

  assert.deepEqual(
    await provider.verifyCallback("google", "https://api.test/callback?code=x&state=oauth-state", "https://api.test/callback", attempt.context),
    { kind: "invalid-sign-in" }
  );
});
