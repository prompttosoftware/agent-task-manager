const tsconfig = require('./tsconfig.json');
const tsconfigPaths = require('tsconfig-paths');

tsconfigPaths.register({
  baseUrl: './',
  paths: tsconfig.compilerOptions.paths,
});

process.env.NODE_ENV = 'test';
console.log("Setting NODE_ENV to test in jest.setup.ts");

import app from './src/app';
import { AppDataSource } from '@/data-source';
import { jest } from '@jest/globals';

import { seedDatabase } from './src/db/seed';

beforeAll(async () => {
  console.log("Initializing AppDataSource...");
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log("Running migrations...");
    await AppDataSource.runMigrations();
    console.log("Seeding database...");
    await seedDatabase();
    console.log("Synchronizing database schema...");
    await AppDataSource.synchronize();
  }
});

afterAll(async () => {
  console.log("Destroying AppDataSource...");
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
});
