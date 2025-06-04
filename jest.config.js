/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // Use ts-jest preset for ES modules (ESM) projects.
  // This preset configures ts-jest to work with ESM syntax and automatically
  // sets testEnvironment to 'node'.
  preset: 'ts-jest/presets/default-esm',

  // Specify the test environment.
  // 'node' environment is suitable for testing Node.js applications and libraries.
  testEnvironment: 'node',

  // Define the patterns Jest uses to detect test files.
  // This includes files ending with .spec.ts, .test.ts, .spec.js, .test.js,
  // and files within __tests__ directories. Supports both TypeScript and JavaScript.
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],

  // An array of file extensions your modules use.
  // Jest will look for these extensions in the order listed when resolving modules.
  // Includes common extensions for TypeScript, JavaScript, JSX, JSON, Node.js built-ins, and ESM/CJS specifics.
  moduleFileExtensions: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
    'node',
    'mjs', // Explicitly include .mjs for ESM
    'cjs'  // Explicitly include .cjs for CommonJS (if needed)
  ],

  // Configuration for ts-jest to handle ESM.
  // This 'transform' property is typically set by the 'default-esm' preset,
  // but it's included here for clarity or potential overrides.
  transform: {
    '^.+\\.m?[jt]sx?$': [
      'ts-jest', {
        // ts-jest options
        useESM: true, // Ensure ts-jest uses ESM
        // tsconfig: 'tsconfig.json', // Specify your tsconfig
      }
    ]
  },

  // Optional: Configure module name mapping for paths/aliases defined in tsconfig.json
  // If you use 'paths' in your tsconfig.json, you might need to configure moduleNameMapper
  // here as well, although ts-jest can often handle this based on your tsconfig.json.
  // Example:
  // moduleNameMapper: {
  //   '^@/(.*)$': '<rootDir>/src/$1',
  // },

  // You can add other Jest configurations here as needed,
  // e.g., coverage reporting, global mocks, setup files, etc.
  // collectCoverage: true,
  // coverageDirectory: 'coverage',
};
