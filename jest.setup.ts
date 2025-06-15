// Register ts-node immediately
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
  },
});

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
  try {
    await AppDataSource.initialize();
    console.log('AppDataSource initialized successfully!');

    console.log('Truncating tables...');
    const entities = AppDataSource.entityMetadatas;

    for (const entity of entities) {
      const repository = AppDataSource.getRepository(entity.name);
      await repository.query(`DELETE FROM "${entity.tableName}";`);
    }

    // console.log('Synchronizing database schema...');
    // await AppDataSource.synchronize();

    console.log('Running migrations...');
    await AppDataSource.runMigrations();

    console.log('Seeding database...');
    await seedDatabase();
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error initializing AppDataSource:', error);
    throw error; // Re-throw the error to fail the tests
  }
});

afterAll(async () => {
  console.log('Destroying AppDataSource...');
  try {
    await AppDataSource.destroy();
    console.log('AppDataSource destroyed successfully!');
  } catch (error) {
    console.error('Error destroying AppDataSource:', error);
  }
});
