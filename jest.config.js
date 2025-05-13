/** @type {import('ts-jest').JestConfigTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Add moduleNameMapper for path resolution
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/dist/src/$1',
  }
};