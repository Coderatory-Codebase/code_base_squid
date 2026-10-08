import { createNextConfig } from "@workspace/eslint-config/next";
import { noRawDateRules } from "@workspace/eslint-config/no-raw-date";

export default createNextConfig({
  tsconfigRootDir: import.meta.dirname,
  rules: noRawDateRules
});
