import test from "node:test";
import assert from "node:assert/strict";
import { Linter } from "eslint";
import tseslint from "typescript-eslint";
import { noRawDateRules } from "../no-raw-date.mjs";

const linter = new Linter();

const config = [
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module"
    },
    rules: noRawDateRules
  }
];

const lint = (code, filename = "test.ts") => linter.verify(code, config, { filename });

void test("forbids Date.now()", () => {
  const messages = lint("const time = Date.now();");
  assert.equal(messages.length, 1);
  assert.equal(messages[0]?.ruleId, "no-restricted-syntax");
});

void test("forbids new Date()", () => {
  const messages = lint("const now = new Date();");
  assert.equal(messages.length, 1);
  assert.equal(messages[0]?.ruleId, "no-restricted-syntax");
});

void test("allows new Date(value) with an explicit time", () => {
  const messages = lint("const now = new Date(1700000000000);");
  assert.deepEqual(messages, []);
});

void test("forbids calling Date() without new", () => {
  const messages = lint("const now = Date();");
  assert.equal(messages.length, 1);
  assert.equal(messages[0]?.ruleId, "no-restricted-syntax");
});

void test("reports every violation in a file with multiple offenses", () => {
  const messages = lint("const a = Date.now();\nconst b = new Date();\nconst c = Date();");
  assert.equal(messages.length, 3);
});

void test("allows reading time through an injected kernel Clock", () => {
  const messages = lint(`
    import type { Clock } from "@workspace/kernel";
    const readTime = (clock: Clock): number => clock.now();
  `);
  assert.deepEqual(messages, []);
});

void test("does not flag unrelated identifiers or properties named Date", () => {
  const messages = lint(`
    type Options = { Date: number };
    const value = (options: Options) => options.Date;
    class Foo { Date = 1; }
    const namespaced = new Foo.Date();
  `);
  assert.deepEqual(messages, []);
});

void test("applies inside .tsx module code too", () => {
  const messages = lint("const now = Date.now();", "component.tsx");
  assert.equal(messages.length, 1);
});
