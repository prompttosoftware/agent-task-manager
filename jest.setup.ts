process.env.NODE_ENV = 'test';
console.log("Setting NODE_ENV to test in jest.setup.ts");

import app from './src/app';
import { AppDataSource } from './src/db/data-source';
import { jest } from '@jest/globals';

beforeAll(async () => {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
});

afterAll(async () => {
  await AppDataSource.destroy();
});
