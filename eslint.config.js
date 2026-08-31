// @ts-check
import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettierConfig from "eslint-config-prettier";

export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/*.d.ts", "**/coverage/**", "**/.next/**"],
  },
  js.configs.recommended,
  {
    // Node-executed repository tooling (git hooks, validation scripts) —
    // not application source, but real JS this repository runs directly.
    files: ["tooling/scripts/**/*.mjs", "tooling/git-hooks/*"],
    languageOptions: {
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },
  {
    // servers/* — Node.js runtime source.
    files: ["servers/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
  },
  {
    // apps/* — browser + Next.js server-runtime source.
    files: ["apps/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        fetch: "readonly",
        window: "readonly",
        document: "readonly",
        HTMLFormElement: "readonly",
      },
    },
  },
  prettierConfig,
];
