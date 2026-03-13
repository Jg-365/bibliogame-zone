import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // Enable unused-vars as a warning (not error) to surface dead code without breaking builds
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Disallow unsafe any casts
      "@typescript-eslint/no-explicit-any": "warn",

      // Prefer const assertions
      "prefer-const": "error",

      // No console.log in production code (use monitoring.ts instead)
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // Enforce consistent import ordering
      "no-duplicate-imports": "error",

      // A11y: interactive elements must be focusable
      "jsx-a11y/interactive-supports-focus": "warn",

      // A11y: images must have alt text
      "jsx-a11y/alt-text": "error",

      // A11y: anchors need discernible content
      "jsx-a11y/anchor-has-content": "error",
    },
  },
);
