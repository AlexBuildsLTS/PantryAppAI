/**
 * @file eslint.config.js
 * @description Standardized linting for AAA+ Enterprise Tier.
 */
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".expo/**",
      "expo-env.d.ts",
      "**/*.config.js",
    ],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]);