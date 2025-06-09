module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json', // Path to your tsconfig.json
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is last!
    'prettier/@typescript-eslint' // Uses eslint-config-prettier to disable ESLint rules from `@typescript-eslint/eslint-plugin` that would conflict with prettier
  ],
  rules: {
    // Add custom rules here or override the recommended ones.
    'no-unused-vars': 'off', // Disable the base rule, since the typescript one is more robust
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warn about unused variables, but allow for variables starting with an underscore
    '@typescript-eslint/explicit-function-return-type': 'off', // Optional: Consider enabling if you want to enforce explicit return types
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Optional: Consider enabling if you want to enforce explicit return types on module boundaries
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'no-console': 'warn', // Warn about console.log/warn/error calls
    'no-debugger': 'warn', // Warn about debugger statements
    'object-shorthand': 'warn', // Enforce shorthand syntax for object properties
    'prefer-const': 'warn',
    'sort-imports': ['warn', {
        ignoreCase: true,
        ignoreDeclarationSort: true, // Ignore `import` declarations
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
    }],
    'import/order': 'off',  // This rule might conflict with sort-imports, if you use it, configure it appropriately
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  env: {
    node: true,
    browser: true,
    es2020: true,
  },
};
