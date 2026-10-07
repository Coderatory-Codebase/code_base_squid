import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { UserSessionsManager } from "../../features/identity/components/user-sessions-manager";

const router: AppRouterInstance = {
  back: () => undefined,
  forward: () => undefined,
  refresh: () => undefined,
  push: () => undefined,
  replace: () => undefined,
  prefetch: () => undefined,
  bfcacheId: "sessions-test"
};

test("session manager identifies each sign-out action and marks the current device", () => {
  const markup = renderToStaticMarkup(
    <AppRouterContext.Provider value={router}>
      <UserSessionsManager initialSessions={[
        { sessionId: "chrome", device: "Chrome on Windows", lastUsedAt: "2026-10-01T11:00:00.000Z", isCurrent: true },
        { sessionId: "safari", device: "Safari on iPhone", lastUsedAt: "2026-10-01T12:00:00.000Z", isCurrent: false }
      ]} />
    </AppRouterContext.Provider>
  );

  assert.match(markup, /aria-label="Sign out Chrome on Windows"/);
  assert.match(markup, /aria-label="Sign out Safari on iPhone"/);
  assert.match(markup, /This device/);
  assert.match(markup, /aria-live="polite"/);
});
