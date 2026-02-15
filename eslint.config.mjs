import { defineConfig, globalIgnores } from "eslint/config";
import nextjs from "@next/eslint-plugin-next";

const eslintConfig = defineConfig([
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    ".git/**",
  ]),
  {
    plugins: {
      "@next/next": nextjs,
    },
    rules: {
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;