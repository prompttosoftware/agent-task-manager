const js = require('@eslint/js');
const tsEslintPlugin = require('@typescript-eslint/eslint-plugin');
const tsEslintParser = require('@typescript-eslint/parser');

module.exports = [
  // Base ESLint rules for JavaScript files (if any)
  {
    files: ["**/*.js"], // Apply to all .js files
    ...js.configs.recommended, // Include basic recommended JS rules
    languageOptions: {
       globals: {
         node: true, // Add Node.js globals
         es2021: true, // Add ES2021 globals
       }
    }
  },
  // Configuration for TypeScript files
  {
    files: ["**/*.ts", "**/*.tsx"], // Target all .ts and .tsx files
    plugins: {
      '@typescript-eslint': tsEslintPlugin, // Explicitly define the TypeScript plugin
    },
    languageOptions: {
      parser: tsEslintParser, // Use the TypeScript parser
      parserOptions: {
        ecmaVersion: 2021, // Specify ECMAScript version
        sourceType: 'module', // Use ES modules
        project: './tsconfig.json', // Path to your tsconfig.json (required for type-checking rules)
        tsconfigRootDir: __dirname, // Root directory for resolving the project path
      },
      globals: {
        node: true, // Add Node.js globals
        es2021: true, // Add ES2021 globals
        // Consider adding testing globals here if tests are in src/
        // jest: true, // Example: If you use Jest
      }
    },
    rules: {
      // Include rules from the recommended TypeScript configs by spreading their 'rules' property
      ...tsEslintPlugin.configs.recommended.rules, // Rules that don't require type information
      ...tsEslintPlugin.configs["recommended-requiring-type-checking"].rules, // Rules that require type information

      // Add any project-specific rule overrides or custom rules here.
      // Example overrides:
      // '@typescript-eslint/no-explicit-any': 'warn', // Allow 'any' but warn
      // 'no-console': 'warn', // Warn about console.log
      // 'indent': ['error', 2], // Example: enforce 2-space indentation
    },
  },
  // Add more config objects for other specific needs (e.g., test files, specific directories)
];
