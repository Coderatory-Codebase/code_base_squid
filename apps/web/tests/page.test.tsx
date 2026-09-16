import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import HomePage from "../app/page";

test("renders the workspace bootstrap", () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000";
  const markup = renderToStaticMarkup(<HomePage />);
  assert.match(markup, /The application foundation is running/);
  assert.match(markup, /http:\/\/localhost:4000/);
  assert.match(markup, /API health/);
  assert.match(markup, /data-slot="button"/);
});
