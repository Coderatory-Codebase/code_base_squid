import { createNodeConfig } from "@workspace/eslint-config/node";
import { noRawDateRules } from "@workspace/eslint-config/no-raw-date";

export default createNodeConfig({
  tsconfigRootDir: import.meta.dirname,
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    ...noRawDateRules
  }
});
