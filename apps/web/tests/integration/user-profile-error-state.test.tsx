import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { UserProfileErrorState } from "../../features/identity/components/user-profile-error-state";

test("shows a retry action for a failure that may be temporary", () => {
  const markup = renderToStaticMarkup(
    <UserProfileErrorState message="The profile service could not be reached." retryable />
  );

  assert.match(markup, /The profile service could not be reached\./);
  assert.match(markup, /Retry profile load/);
  assert.match(markup, /href="\/identity\/user-profile"/);
});

test("explains a non-retryable failure without showing a retry action", () => {
  const markup = renderToStaticMarkup(
    <UserProfileErrorState message="Your account has no active workspace." retryable={false} />
  );

  assert.match(markup, /Your account has no active workspace\./);
  assert.doesNotMatch(markup, /Retry profile load/);
  assert.doesNotMatch(markup, /href="\/identity\/user-profile"/);
});
