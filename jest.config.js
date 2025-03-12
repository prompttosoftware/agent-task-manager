// jest.config.js
/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['<rootDir>/tests/**/*.test.(ts|tsx|js)'],
  transformIgnorePatterns: ["/node_modules/", "\\.js$"],
  collectCoverage: false,
};

module.exports = config