// jest.config.js
/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest/presets/default',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  collectCoverage: false
};

module.exports = config