import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Custom rules to manage strictness
  {
    rules: {
      // Downgrade to warning - these are valid concerns but shouldn't block the build
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      // Allow require() for dynamic/lazy imports in lib files
      "@typescript-eslint/no-require-imports": "warn",
      // React Compiler / React 19 strict mode warnings - address in future refactoring
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Custom ignores to prevent crashes on large files:
    ".venv/**",
    "node_modules/**",
    // Standalone utility scripts (use CommonJS require)
    "scripts/**",
  ]),
]);

export default eslintConfig;

