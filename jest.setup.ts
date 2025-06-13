const tsconfig = require('./tsconfig.json');
const tsconfigPaths = require('tsconfig-paths');

tsconfigPaths.register({
  baseUrl: './',
  paths: tsconfig.compilerOptions.paths,
});

console.log('Setting NODE_ENV to test in jest.setup.ts');
process.env.NODE_ENV = 'test';

import { AppDataSource } from './src/data-source';
import { seedDatabase } from './src/db/seed';

beforeAll(async () => {
  console.log('Initializing AppDataSource...');
  await AppDataSource.initialize();

  console.log('Running migrations...');
  await AppDataSource.runMigrations();

  console.log('Seeding database...');
  await seedDatabase();
  console.log('Database seeded successfully!');

  console.log('Synchronizing database schema...');
  await AppDataSource.synchronize();
});

afterAll(async () => {
  console.log('Destroying AppDataSource...');
  await AppDataSource.destroy();
});
