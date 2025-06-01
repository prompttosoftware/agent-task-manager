import { loadDatabase, saveDatabase, DB_FILE_PATH } from './database';
import * as fs from 'fs/promises';
import * as path from 'path';
import { DbSchema } from '../models'; // Assuming DbSchema is defined in ../models

// Mock the 'fs/promises' module
jest.mock('fs/promises');

const mockReadFile = fs.readFile as jest.Mock;
const mockWriteFile = fs.writeFile as jest.Mock;
const mockAccess = fs.access as jest.Mock;
const mockMkdir = fs.mkdir as jest.Mock;

const defaultDb: DbSchema = { issues: [], issueKeyCounter: 0 };
const testDb: DbSchema = {
  issues: [
    {
      key: 'ISSUE-1',
      summary: 'Test Issue',
      description: 'This is a test issue.',
      status: 'Open',
      type: 'Task',
      priority: 'Medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [],
      subtasks: [],
      parentKey: null,
      labels: [],
      assignee: null,
    },
  ],
  issueKeyCounter: 1,
};

describe('database', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default mock behavior to simulate successful file operations
    mockAccess.mockResolvedValue(undefined); // File exists by default
    mockReadFile.mockResolvedValue(JSON.stringify(defaultDb)); // Contains default data by default
    mockWriteFile.mockResolvedValue(undefined); // Writing succeeds by default
    mockMkdir.mockResolvedValue(undefined); // Directory creation succeeds by default
  });

  describe('saveDatabase', () => {
    it('should save the database to the specified file path', async () => {
      await saveDatabase(testDb);

      const expectedJson = JSON.stringify(testDb, null, 2);

      expect(mockWriteFile).toHaveBeenCalledWith(DB_FILE_PATH, expectedJson, 'utf8');
      expect(mockMkdir).toHaveBeenCalledWith(path.dirname(DB_FILE_PATH), { recursive: true });
    });

    it('should create the directory if it does not exist', async () => {
      // No need to specifically mock mkdir to fail, as the default mock success
      // means we just need to check if it was called. The recursive option
      // handles the non-existence scenario internally within fs.mkdir.
      await saveDatabase(testDb);

      expect(mockMkdir).toHaveBeenCalledWith(path.dirname(DB_FILE_PATH), { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledTimes(1); // Ensure writeFile is also called
    });

    it('should handle errors during writing', async () => {
      const writeError = new Error('Failed to write');
      mockWriteFile.mockRejectedValue(writeError);

      await expect(saveDatabase(testDb)).rejects.toThrow('Failed to write');

      expect(mockMkdir).toHaveBeenCalledTimes(1); // mkdir should still be attempted
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during directory creation', async () => {
      const mkdirError = new Error('Failed to create directory');
      mockMkdir.mockRejectedValue(mkdirError);

      await expect(saveDatabase(testDb)).rejects.toThrow('Failed to create directory');

      expect(mockMkdir).toHaveBeenCalledTimes(1);
      expect(mockWriteFile).not.toHaveBeenCalled(); // writeFile should not be called if mkdir fails
    });
  });

  describe('loadDatabase', () => {
    it('should load the database from the file if it exists and is valid', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify(testDb));

      const db = await loadDatabase();

      expect(mockAccess).toHaveBeenCalledWith(DB_FILE_PATH, fs.constants.F_OK);
      expect(mockReadFile).toHaveBeenCalledWith(DB_FILE_PATH, 'utf8');
      expect(db).toEqual(testDb);
      // Ensure default database saving logic was NOT called
      expect(mockMkdir).not.toHaveBeenCalled();
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('should return default database if the file does not exist', async () => {
      // Simulate file not found error (ENOENT) from fs.access
      const error = new Error('File not found');
      (error as any).code = 'ENOENT';
      mockAccess.mockRejectedValue(error);

      const db = await loadDatabase();

      expect(mockAccess).toHaveBeenCalledWith(DB_FILE_PATH, fs.constants.F_OK);
      expect(mockReadFile).not.toHaveBeenCalled(); // readFile should not be called if access fails
      expect(db).toEqual(defaultDb);
      // Ensure default database was saved
      expect(mockMkdir).toHaveBeenCalledWith(path.dirname(DB_FILE_PATH), { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledWith(DB_FILE_PATH, JSON.stringify(defaultDb, null, 2), 'utf8');
    });

    it('should return default database if the file contains invalid JSON', async () => {
      mockReadFile.mockResolvedValue('{ invalid json ');

      const db = await loadDatabase();

      expect(mockAccess).toHaveBeenCalledWith(DB_FILE_PATH, fs.constants.F_OK);
      expect(mockReadFile).toHaveBeenCalledWith(DB_FILE_PATH, 'utf8');
      expect(db).toEqual(defaultDb);
      // Ensure default database was saved
      expect(mockMkdir).toHaveBeenCalledWith(path.dirname(DB_FILE_PATH), { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledWith(DB_FILE_PATH, JSON.stringify(defaultDb, null, 2), 'utf8');
    });

    it('should handle other errors during file access gracefully by returning and saving default', async () => {
      // Simulate a different error from fs.access
      const error = new Error('Permission denied');
      (error as any).code = 'EACCES';
      mockAccess.mockRejectedValue(error);

      const db = await loadDatabase();

      expect(mockAccess).toHaveBeenCalledWith(DB_FILE_PATH, fs.constants.F_OK);
      expect(mockReadFile).not.toHaveBeenCalled(); // readFile should not be called
      expect(db).toEqual(defaultDb);
      // Ensure default database was saved
      expect(mockMkdir).toHaveBeenCalledWith(path.dirname(DB_FILE_PATH), { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledWith(DB_FILE_PATH, JSON.stringify(defaultDb, null, 2), 'utf8');
    });

    it('should handle errors during file reading gracefully by returning and saving default', async () => {
      const readError = new Error('Failed to read');
      mockReadFile.mockRejectedValue(readError);

      const db = await loadDatabase();

      expect(mockAccess).toHaveBeenCalledWith(DB_FILE_PATH, fs.constants.F_OK);
      expect(mockReadFile).toHaveBeenCalledWith(DB_FILE_PATH, 'utf8');
      expect(db).toEqual(defaultDb);
      // Ensure default database was saved
      expect(mockMkdir).toHaveBeenCalledWith(path.dirname(DB_FILE_PATH), { recursive: true });
      expect(mockWriteFile).toHaveBeenCalledWith(DB_FILE_PATH, JSON.stringify(defaultDb, null, 2), 'utf8');
    });

    it('should handle errors when saving the default database if original load failed', async () => {
      // Simulate original load failure (e.g., file not found)
      const accessError = new Error('File not found');
      (accessError as any).code = 'ENOENT';
      mockAccess.mockRejectedValue(accessError);

      // Simulate error when loadDatabase tries to save the default
      const writeError = new Error('Failed to save default');
      mockWriteFile.mockRejectedValue(writeError);

      // The error from saving the default should be thrown
      await expect(loadDatabase()).rejects.toThrow('Failed to save default');

      expect(mockAccess).toHaveBeenCalledWith(DB_FILE_PATH, fs.constants.F_OK);
      expect(mockReadFile).not.toHaveBeenCalled(); // Read never happens
      expect(mockMkdir).toHaveBeenCalledWith(path.dirname(DB_FILE_PATH), { recursive: true }); // Mkdir happens before save
      expect(mockWriteFile).toHaveBeenCalledWith(DB_FILE_PATH, JSON.stringify(defaultDb, null, 2), 'utf8'); // Write is attempted
    });
  });
});
