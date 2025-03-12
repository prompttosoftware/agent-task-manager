// jest.config.js
/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest', // Use the default ts-jest preset
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverage: false
};

module.exports = config