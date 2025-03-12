// jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleNameMapper: {
    '^(\\.\\.?\\/.*)\\js$': '$1'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/tests/**/*.test.(ts|js)'],
  roots: ['<rootDir>/tests'],
  // Add this line if you have any source code in the src directory
  // and want Jest to consider those files for coverage
  collectCoverageFrom: ["src/**/*.{ts,tsx}"],
};
