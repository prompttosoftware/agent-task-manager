|-
import { loadDatabase, saveDatabase, DB_FILE_PATH, DbSchema } from './persistence';
import fs from 'fs/promises';
import path from 'path';

describe('persistence', {
  retries: 2
}, () => {
  beforeEach(async () => {
    // Ensure the test file doesn't exist before each test
    try {
      await fs.unlink(DB_FILE_PATH);
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        // Ignore "file not found" errors; re-throw others
        throw error;
      }
    }
    // Clean up .data directory
    const dirPath = path.dirname(DB_FILE_PATH);
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
        if ((error as any).code !== 'ENOENT') {
            throw error;
        }
    }
  });

  it('should load and initialize database if file does not exist', async () => {
    const db = await loadDatabase();
    expect(db).toEqual({ issues: [], issueKeyCounter: 0 });
  });

  it('should save and load database correctly', async () => {
    const initialData: DbSchema = { issues: [{ key: 'ATM-1', summary: 'Test issue' }], issueKeyCounter: 1 };
    await saveDatabase(initialData);
    const loadedData = await loadDatabase();
    expect(loadedData).toEqual(initialData);
  });

  it('should create the .data directory if it does not exist', async () => {
    // Ensure the .data directory does not exist
    const dirPath = path.dirname(DB_FILE_PATH);
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
          throw error;
      }
    }

    await loadDatabase();
    try {
        await fs.access(dirPath);
    } catch (error) {
        fail(".data directory was not created");
    }
  });
});
