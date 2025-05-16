// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'], // Jest will look for tests and source files in the src directory
  // The ts-jest preset usually handles the transformation of .ts/.tsx files correctly.
  // It also respects the "module" and other relevant settings in your tsconfig.json.
  // The default testMatch pattern should find *.test.ts files within the specified roots.
};
