import js from "@eslint/js"
import tseslint from "@typescript-eslint/eslint-plugin"
import parser from "@typescript-eslint/parser"

export default [
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    languageOptions: { parser },
    plugins: { "@typescript-eslint": tseslint },
    rules: {
      ...js.configs.recommended.rules,
      // disable core rules that TypeScript itself already checks
      ...tseslint.configs["eslint-recommended"]?.overrides?.[0]?.rules,
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
]
