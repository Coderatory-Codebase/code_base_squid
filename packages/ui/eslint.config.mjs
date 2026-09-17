import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname }
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error"
    }
  },
  {
    ...tseslint.configs.disableTypeChecked,
    files: ["src/primitives/**/*.tsx", "src/hooks/**/*.tsx"],
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      "@typescript-eslint/no-explicit-any": "error"
    }
  }
);
