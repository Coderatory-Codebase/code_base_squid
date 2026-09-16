import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import HomePage from "../app/page";

test("renders the workspace bootstrap", () => {
  const markup = renderToStaticMarkup(<HomePage />);
  assert.match(markup, /The application foundation is running/);
  assert.match(markup, /http:\/\/localhost:4000/);
});
