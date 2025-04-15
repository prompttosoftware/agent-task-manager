// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended', // Recommended ESLint rules
    'plugin:@typescript-eslint/recommended', // Recommended rules for TypeScript
    'prettier', // Enables Prettier rules
    'plugin:prettier/recommended', // Enables Prettier as an ESLint rule
  ],
  plugins: [
    '@typescript-eslint', // Enables TypeScript-specific linting rules
    'prettier', // Integrates Prettier with ESLint
  ],
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    project: './tsconfig.json', // Specify the location of the tsconfig.json
  },
  rules: {
    // Add your custom rules or overrides here
    'prettier/prettier': 'warn', // Use Prettier to check for formatting errors
    '@typescript-eslint/explicit-function-return-type': 'off', // Example: Disable requiring explicit return types
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/'
  ],
  settings: {
    // You can add settings here if needed, for example, for import resolution
  },
};
