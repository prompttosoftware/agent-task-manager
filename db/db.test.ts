import * as fs from 'fs/promises';
import * as path from 'path';
import os from 'os';

// Define the temporary test directory and file name relative to this test file's location.
// Using a directory name starting with '.' makes it hidden on most systems.
const testDataDirName = '.data-test-jest';
const testFileName = 'db.json'; // Use the same filename as production for realism

// Calculate the full path for the test directory and file.
// __dirname in a Jest test file is the directory containing the test file.
// For this file (`db/db.test.ts`), `__dirname` is `.../project-root/db`.
const tempTestDirPath = path.join(__dirname, testDataDirName);
const testDbFilePath = path.join(tempTestDirPath, testFileName);

// Mock the 'path' module BEFORE importing db.ts.
// This ensures that the path constants (DATA_DIR, DB_FILE_PATH)
// within the db.ts module are set using the mocked path.join.
jest.mock('path', () => {
  const originalPath = jest.requireActual('path');
  return {
    ...originalPath,
    // Intercept path.join calls made by db.ts and redirect them to our test path.
    // The original db.ts path construction is:
    // DATA_DIR = path.join(__dirname, '../../.data');
    // DB_FILE_PATH = path.join(DATA_DIR, 'db.json');
    // We need to make the final calculated path equal to testDbFilePath.
    // A simple way is to make path.join return testDbFilePath whenever it's called.
    // This assumes path.join is only used for this purpose in db.ts, which it appears to be.
    join: jest.fn(() => testDbFilePath),
  };
});

// NOW import the functions - they will use the mocked path.join
import { loadDatabase, saveDatabase } from './db';
import { DbSchema } from './DbSchema'; // Used for type hints

// Note: The actual DbSchema interface is defined in db/db.ts and also imported here via DbSchema.ts.
// For test data, we'll use a minimal structure compatible with DbSchema using `as any`
// as the full Issue interface is not strictly needed for these structural tests.

describe('Database Operations', () => {
  // Ensure the temporary test directory exists before all tests.
  // This directory will contain the test database file.
  beforeAll(async () => {
    // console.log(`Creating test directory: ${tempTestDirPath}`); // Optional logging for debugging
    await fs.mkdir(tempTestDirPath, { recursive: true });
  });

  // Clean up the temporary test directory after all tests are complete.
  afterAll(async () => {
    // console.log(`Cleaning up test directory: ${tempTestDirPath}`); // Optional logging for debugging
    // Use force: true to handle cases where directory might not be empty due to test failures
    await fs.rm(tempTestDirPath, { recursive: true, force: true });
  });

  // Clean up the specific test database file before each test.
  // This ensures that each test starts with a clean slate regarding the file's existence and content.
  beforeEach(async () => {
    try {
      // Attempt to delete the file if it exists
      // console.log(`Cleaning up test file: ${testDbFilePath}`); // Optional logging for debugging
      await fs.unlink(testDbFilePath);
    } catch (error: any) {
      // Ignore 'file not found' errors (ENOENT), re-throw others.
      // If the file doesn't exist, that's fine for tests expecting no file.
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  });

  // --- Test Scenarios ---

  // 1. The database file is created if it doesn't exist.
  test('loadDatabase creates file and returns default state if file does not exist', async () => {
    // Arrange: File does not exist (ensured by beforeEach hook).

    // Act: Load the database. This should trigger file creation.
    const db = await loadDatabase();

    // Assert:
    // Check that the function returned the default database state.
    expect(db).toEqual({ issues: [], issueKeyCounter: 0 });

    // Check that the database file was actually created in the correct test location.
    await expect(fs.stat(testDbFilePath)).resolves.toBeDefined();

    // Check that the content of the created file is the stringified default state.
    const fileContent = await fs.readFile(testDbFilePath, 'utf8');
    expect(JSON.parse(fileContent)).toEqual({ issues: [], issueKeyCounter: 0 });
  });

  // 2. The database is loaded correctly.
  test('loadDatabase loads existing valid data correctly', async () => {
    // Arrange: Create a database file with some valid data in the test location.
    const existingData: DbSchema = {
      issues: [{ id: 1, title: 'Test Issue 1' } as any, { id: 2, title: 'Test Issue 2' } as any], // Use 'as any' for minimal Issue structure compatibility
      issueKeyCounter: 10,
    };
    await fs.writeFile(testDbFilePath, JSON.stringify(existingData, null, 2), 'utf8');

    // Act: Load the database.
    const db = await loadDatabase();

    // Assert: Check that the loaded data matches the existing data.
    expect(db).toEqual(existingData);
  });

  // 3. Empty or invalid files are handled gracefully.

  test('loadDatabase handles empty file by returning default state and overwriting file', async () => {
    // Arrange: Create an empty file in the test location.
    await fs.writeFile(testDbFilePath, '', 'utf8');

    // Act: Load the database.
    const db = await loadDatabase();

    // Assert:
    // Check that the function returned the default database state.
    expect(db).toEqual({ issues: [], issueKeyCounter: 0 });

    // Check that the file content was overwritten with the default state.
    const fileContent = await fs.readFile(testDbFilePath, 'utf8');
    expect(JSON.parse(fileContent)).toEqual({ issues: [], issueKeyCounter: 0 });
  });

  test('loadDatabase handles invalid JSON file by returning default state and overwriting file', async () => {
    // Arrange: Create a file with invalid JSON content in the test location.
    await fs.writeFile(testDbFilePath, '{ "issues": [', 'utf8'); // Incomplete JSON string

    // Act: Load the database.
    const db = await loadDatabase();

    // Assert:
    // Check that the function returned the default database state.
    expect(db).toEqual({ issues: [], issueKeyCounter: 0 });

    // Check that the file content was overwritten with the default state.
    const fileContent = await fs.readFile(testDbFilePath, 'utf8');
    expect(JSON.parse(fileContent)).toEqual({ issues: [], issueKeyCounter: 0 });
  });

  test('loadDatabase handles file with valid JSON but invalid structure by returning default state and overwriting file', async () => {
    // Arrange: Create a file with valid JSON but a structure that does not match DbSchema.
    const invalidStructureData = { issues: 'this is not an array', issueKeyCounter: 'this is not a number', extraField: true };
    await fs.writeFile(testDbFilePath, JSON.stringify(invalidStructureData), 'utf8');

    // Act: Load the database.
    const db = await loadDatabase();

    // Assert:
    // Check that the function returned the default database state.
    expect(db).toEqual({ issues: [], issueKeyCounter: 0 });

    // Check that the file content was overwritten with the default state.
    const fileContent = await fs.readFile(testDbFilePath, 'utf8');
    expect(JSON.parse(fileContent)).toEqual({ issues: [], issueKeyCounter: 0 });
  });

  // Test error handling during load (e.g., directory creation fails).
  test('loadDatabase throws error if directory creation fails', async () => {
    // Arrange: Temporarily mock fs.mkdir to simulate an error during directory creation.
    const simulatedError = new Error('Simulated mkdir error');
    const mockMkdir = jest.spyOn(fs, 'mkdir').mockRejectedValue(simulatedError);

    // Act & Assert: Expect the load operation to reject with the simulated error.
    await expect(loadDatabase()).rejects.toThrow('Simulated mkdir error');

    // Restore the original fs.mkdir function after the test.
    mockMkdir.mockRestore();
  });

   // Test error handling during load (e.g., unexpected file read error).
   test('loadDatabase throws unexpected error during file read', async () => {
      // Arrange: Ensure file exists (so readFile is called), then temporarily mock fs.readFile to simulate an unexpected error.
      await fs.writeFile(testDbFilePath, JSON.stringify({ issues: [], issueKeyCounter: 0 }), 'utf8');
      const simulatedError = new Error('Simulated read error');
      const mockReadFile = jest.spyOn(fs, 'readFile').mockRejectedValue(simulatedError);

      // Act & Assert: Expect the load operation to reject with the simulated error.
      // Note: ENOENT and SyntaxError are handled internally, but other errors should be re-thrown.
      await expect(loadDatabase()).rejects.toThrow('Simulated read error');

      // Restore the original fs.readFile function after the test.
      mockReadFile.mockRestore();
   });


  // 4. Data is saved to the database correctly.

  test('saveDatabase creates file and saves data correctly if file does not exist', async () => {
    // Arrange: File does not exist (ensured by beforeEach hook).
    const dataToSave: DbSchema = {
      issues: [{ id: 100, title: 'New Issue to Save' } as any, { id: 101, title: 'Another' } as any],
      issueKeyCounter: 500,
    };

    // Act: Save the data. This should create the file.
    await saveDatabase(dataToSave);

    // Assert:
    // Check that the database file was created in the correct test location.
    await expect(fs.stat(testDbFilePath)).resolves.toBeDefined();

    // Check that the content of the created file is the stringified saved data.
    const fileContent = await fs.readFile(testDbFilePath, 'utf8');
    expect(JSON.parse(fileContent)).toEqual(dataToSave);
  });

  test('saveDatabase overwrites existing file with new data correctly', async () => {
    // Arrange: Create an existing file with some old data.
    const oldData: DbSchema = {
      issues: [{ id: 1, title: 'Old Issue' } as any],
      issueKeyCounter: 1,
    };
    await fs.writeFile(testDbFilePath, JSON.stringify(oldData), 'utf8');

    const newData: DbSchema = {
      issues: [{ id: 200, title: 'Updated Issue' }, { id: 201, title: 'Another Issue' }] as any,
      issueKeyCounter: 600,
    };

    // Act: Save the new data. This should overwrite the existing file.
    await saveDatabase(newData);

    // Assert: Check that the file content was updated with the new data.
    const fileContent = await fs.readFile(testDbFilePath, 'utf8');
    expect(JSON.parse(fileContent)).toEqual(newData);
  });

   // Test error handling during save (e.g., directory creation fails).
   test('saveDatabase throws error if directory creation fails', async () => {
     // Arrange: Temporarily mock fs.mkdir to simulate an error during directory creation.
     const simulatedError = new Error('Simulated mkdir error');
     const mockMkdir = jest.spyOn(fs, 'mkdir').mockRejectedValue(simulatedError);
     const dataToSave: DbSchema = { issues: [], issueKeyCounter: 0 };

     // Act & Assert: Expect the save operation to reject with the simulated error.
     await expect(saveDatabase(dataToSave)).rejects.toThrow('Simulated mkdir error');

     // Restore the original fs.mkdir function after the test.
     mockMkdir.mockRestore();
   });

   // Test error handling during save (e.g., file writing fails).
   test('saveDatabase throws error if writing fails', async () => {
      // Arrange: Temporarily mock fs.writeFile to simulate an error during writing.
      const simulatedError = new Error('Simulated write error');
      const mockWriteFile = jest.spyOn(fs, 'writeFile').mockRejectedValue(simulatedError);
      const dataToSave: DbSchema = { issues: [], issueKeyCounter: 0 };

      // Act & Assert: Expect the save operation to reject with the simulated error.
      await expect(saveDatabase(dataToSave)).rejects.toThrow('Simulated write error');

      // Restore the original fs.writeFile function after the test.
      mockWriteFile.mockRestore();
   });

});
