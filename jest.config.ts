import type { Config } from 'jest';
import * as tsconfig from './tsconfig.jest.json';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    "^.+\\.ts?$": ['ts-jest', { tsconfig: '<rootDir>/tsconfig.jest.json' }],
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default config;
