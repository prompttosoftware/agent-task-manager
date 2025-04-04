module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from @typescript-eslint/eslint-plugin
    'prettier', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors.
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and displays prettier errors as ESLint errors. Make sure this is the last in the extends array.
  ],
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    project: ['./tsconfig.json'], // Specify the root directory for tsconfig.json
  },
  plugins: [
    '@typescript-eslint', // Allows for using ESLint rules with TypeScript
    'prettier', // Enables eslint-plugin-prettier
  ],
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. "@typescript-eslint/explicit-function-return-type": "off",
    'prettier/prettier': 'error', // Use prettier to format the code
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.eslintrc.js',
  ],
  settings: {
    // Add any settings here if needed
  },
};
