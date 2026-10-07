import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkspaceCreation } from "../../features/workspace/components/workspace-creation";

void test("workspace creation presents a labeled name field and retry/status region", () => {
  const markup = renderToStaticMarkup(createElement(WorkspaceCreation, { organizationName: "Design" }));

  assert.match(markup, /<label[^>]+for="workspace-name"/);
  assert.match(markup, /id="workspace-name"/);
  assert.match(markup, /Create workspace/);
  assert.match(markup, /aria-live="polite"/);
});
