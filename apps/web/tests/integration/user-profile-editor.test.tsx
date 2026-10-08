import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { UserProfileEditor } from "../../features/identity/components/user-profile-editor";

const router: AppRouterInstance = {
  back: () => undefined,
  forward: () => undefined,
  refresh: () => undefined,
  push: () => undefined,
  replace: () => undefined,
  prefetch: () => undefined,
  bfcacheId: "profile-test"
};

test("profile editor exposes provider email as labeled read-only information", () => {
  const markup = renderToStaticMarkup(
    <AppRouterContext.Provider value={router}>
      <UserProfileEditor email="lena@example.test" name="Lena Park" version={0} />
    </AppRouterContext.Provider>
  );

  assert.match(markup, /<label[^>]*for="email-address"[^>]*>Email address/);
  assert.match(markup, /<input[^>]*id="email-address"[^>]*readOnly=""[^>]*type="email"[^>]*value="lena@example\.test"/);
  assert.match(markup, /Email is managed by Google or Microsoft and cannot be changed here\./);
  assert.match(markup, /aria-live="polite"/);
});
