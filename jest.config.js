// jest.config.js
/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.(ts|tsx|js)'],
  transform: {
    '^.+\.ts$': 'ts-jest'
  }
};

module.exports = config;