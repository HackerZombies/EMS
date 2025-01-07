const globals = require("globals");
const pluginJs = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const parser = require("@typescript-eslint/parser");

/** @type {import('eslint').Linter.Config} */
module.exports = {
  // Specify the environments (e.g., browser, Node.js)
  env: {
    browser: true,
    es2021: true,
  },
  parser: parser, // Use TypeScript parser for TypeScript files
  parserOptions: {
    ecmaVersion: 2021, // Support modern ECMAScript features
    sourceType: "module", // Allow the use of imports
    ecmaFeatures: {
      jsx: true, // Enable JSX parsing if using React
    },
  },
  plugins: ["@typescript-eslint"], // Add TypeScript plugin
  extends: [
    "eslint:recommended", // ESLint recommended rules
    "plugin:@typescript-eslint/recommended", // TypeScript ESLint recommended rules
  ],
  rules: {
    // Add or override any rules here
    "no-unused-vars": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
  },
  globals: {
    ...globals.browser, // Include global browser variables
  },
};
