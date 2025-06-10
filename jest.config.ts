import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/src/**/*.test.(ts|tsx|js|jsx)', '**/__tests__/**/*.(ts|tsx|js|jsx)'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json', // Assuming your tsconfig is in the root
      },
    ],
  },
  collectCoverage: false, // Consider enabling for coverage reports
  coverageDirectory: 'coverage',
  // Add any other Jest configurations here that are specific to your project
};

export default config;
