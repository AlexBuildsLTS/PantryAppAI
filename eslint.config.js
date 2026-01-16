// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

// Additional plugins and configs for better TypeScript and React support
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = defineConfig([
  // Base Expo configuration
  expoConfig,

  // Global ignore patterns for better performance and to avoid linting unnecessary files
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      ".expo/**",
      "expo-env.d.ts",
      "**/*.config.js",
      "**/*.config.ts",
    ],
  },

  // Configuration for JavaScript and TypeScript files
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      // Enable recommended rules for TypeScript
      ...typescriptEslint.configs.recommended.rules,
      // Additional custom rules for better code quality
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn', // Warn instead of error for existing code
      '@typescript-eslint/explicit-function-return-type': 'off', // Can be too strict for React components
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Specific configuration for React Native files if needed
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Disable console statements in production code
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    },
  },
]);

// Error handling: Validate required dependencies at runtime
try {
  require.resolve('eslint-config-expo/flat');
  require.resolve('@typescript-eslint/eslint-plugin');
  require.resolve('@typescript-eslint/parser');
} catch (error) {
  console.error('Missing required ESLint dependencies. Please install them:');
  console.error('npm install --save-dev eslint-config-expo @typescript-eslint/eslint-plugin @typescript-eslint/parser');
  process.exit(1);
}
