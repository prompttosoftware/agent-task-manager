// src/dataStore.test.ts

const mockFsPromises = {
  access: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  constants: {
    F_OK: 0,
  },
};
jest.mock('fs/promises', () => mockFsPromises);

import { loadDatabase, saveDatabase } from './dataStore';
import * as path from 'path';
import * as os from 'os';
import { DbSchema } from '../models';

// Determine the exact file path and directory path used by the dataStore functions
// This should match the constant defined in src/dataStore.ts
// In a real project, you might export this constant from dataStore.ts for easier testing.
// NOTE: Ensure this matches the actual path used in dataStore.ts
const DB_FILE_PATH_FOR_TEST = '/usr/src/agent-task-manager/.data/db.json';
const DB_DIR_PATH_FOR_TEST = path.dirname(DB_FILE_PATH_FOR_TEST);

describe('DataStore', () => {
  let mockFileContent: string | null = null;
  let fileExists: boolean = false;

  beforeEach(() => {
    // Reset mock state before each test
    mockFileContent = null;
    fileExists = false;
    jest.clearAllMocks();

    // Mock fs.promises.access
    mockFsPromises.access.mockImplementation((filePath, mode) => {
      if (filePath === DB_FILE_PATH_FOR_TEST && mode === mockFsPromises.constants.F_OK) {
        if (fileExists) {
          return Promise.resolve(); // Simulate file exists
        } else {
          const error = new Error('Mock: File not found');
          (error as any).code = 'ENOENT'; // Simulate file not found error
          return Promise.reject(error);
        }
      }
      // Reject for any other unexpected access call
      return Promise.reject(new Error(`Mock: Unexpected access to ${filePath}`));
    });

    // Mock fs.promises.readFile
    mockFsPromises.readFile.mockImplementation((filePath, encoding) => {
      if (filePath === DB_FILE_PATH_FOR_TEST && encoding === 'utf8') {
        if (fileExists && mockFileContent !== null) {
          return Promise.resolve(mockFileContent); // Simulate reading file content
        } else {
          // If file doesn't exist or content is null when it should exist, reject
          const error = new Error('Mock: Cannot read from non-existent or empty file');
          (error as any).code = 'ENOENT'; // Use ENOENT or another code depending on scenario being tested
          return Promise.reject(error);
        }
      }
      // Reject for any other unexpected readFile call
      return Promise.reject(new Error(`Mock: Unexpected readFile from ${filePath} with encoding ${encoding}`));
    });

    // Mock fs.promises.writeFile
    mockFsPromises.writeFile.mockImplementation((filePath, data, encoding) => {
      if (filePath === DB_FILE_PATH_FOR_TEST && encoding === 'utf8') {
        mockFileContent = data as string; // Simulate writing file content
        fileExists = true; // Simulate file now exists after writing
        return Promise.resolve();
      }
      // Reject for any other unexpected writeFile call
      return Promise.reject(new Error(`Mock: Unexpected writeFile to ${filePath} with encoding ${encoding}`));
    });

     // Mock fs.promises.mkdir
     mockFsPromises.mkdir.mockImplementation((dirPath, options) => {
       if (dirPath === DB_DIR_PATH_FOR_TEST && options?.recursive === true) {
           // Simulate directory creation
           return Promise.resolve();
       }
       // Reject for any other unexpected mkdir call
       return Promise.reject(new Error(`Mock: Unexpected mkdir to ${dirPath}`));
     });
  });

  test('loadDatabase should create directory and file with default data if file does not exist', async () => {
    // Simulate file not existing
    fileExists = false;
    mockFileContent = null;

    const defaultData: DbSchema = { issues: [], issueKeyCounter: 0 };
    const expectedSavedData = JSON.stringify(defaultData, null, 2);

    const loadedData = await loadDatabase();

    // Verify access was called to check for existence
    expect(mockFsPromises.access).toHaveBeenCalledTimes(1);
    expect(mockFsPromises.access).toHaveBeenCalledWith(DB_FILE_PATH_FOR_TEST, mockFsPromises.constants.F_OK);

    // Verify readFile was NOT called as the file didn't exist
    expect(mockFsPromises.readFile).not.toHaveBeenCalled();

    // Verify mkdir was called to create the directory
    expect(mockFsPromises.mkdir).toHaveBeenCalledTimes(1);
    expect(mockFsPromises.mkdir).toHaveBeenCalledWith(DB_DIR_PATH_FOR_TEST, { recursive: true });

    // Verify mkdir was called to ensure the directory exists before writing
    expect(mockFsPromises.mkdir).toHaveBeenCalledTimes(1);
    expect(mockFsPromises.mkdir).toHaveBeenCalledWith(DB_DIR_PATH_FOR_TEST, { recursive: true });

    // Verify writeFile was called to save the default data
    expect(mockFsPromises.writeFile).toHaveBeenCalledTimes(1);
    expect(mockFsPromises.writeFile).toHaveBeenCalledWith(DB_FILE_PATH_FOR_TEST, expectedSavedData, 'utf8');

    // Verify loadDatabase returned the default data
    expect(loadedData).toEqual(defaultData);

    // Verify the mock state reflects the file being written
    expect(mockFileContent).toBe(expectedSavedData);
    expect(fileExists).toBe(true);
  });

  test('loadDatabase should load data correctly when file exists and contains valid JSON', async () => {
    // Simulate file existing with valid JSON content
    const mockExistingData = {
      issues: [{ id: 'ISSUE-1', key: 'ISSUE-1', issueType: 'Task', summary: 'Test issue', status: 'Todo', createdAt: '2023-01-01T00:00:00.000Z', updatedAt: '2023-01-01T00:00:00.000Z' }],
      issueKeyCounter: 1,
    };
    mockFileContent = JSON.stringify(mockExistingData);
    fileExists = true;

    const loadedData = await loadDatabase();

    // Verify access was called to check for existence
    expect(mockFsPromises.access).toHaveBeenCalledTimes(1);
    expect(mockFsPromises.access).toHaveBeenCalledWith(DB_FILE_PATH_FOR_TEST, mockFsPromises.constants.F_OK);

    // Verify readFile was called to read the content
    expect(mockFsPromises.readFile).toHaveBeenCalledTimes(1);
    expect(mockFsPromises.readFile).toHaveBeenCalledWith(DB_FILE_PATH_FOR_TEST, 'utf8');

    // Verify writeFile was NOT called as the file was valid
    expect(mockFsPromises.writeFile).not.toHaveBeenCalled();

    // Verify mkdir was NOT called
    expect(mockFsPromises.mkdir).not.toHaveBeenCalled();

    // Verify loadDatabase returned the parsed data
    expect(loadedData).toEqual(mockExistingData);

    // Verify the mock state is unchanged (as no write occurred)
    expect(mockFileContent).toBe(JSON.stringify(mockExistingData));
    expect(fileExists).toBe(true);
  });

  test('saveDatabase should save the provided data to the file', async () => {
    // Simulate initial state (doesn't strictly matter for save, but good practice)
    fileExists = false;
    mockFileContent = null;

    const dataToSave = {
      issues: [
        { id: 'ISSUE-A', key: 'ISSUE-A', issueType: 'Task', summary: 'First issue', status: 'Todo', createdAt: '2023-01-01T00:00:00.000Z', updatedAt: '2023-01-01T00:00:00.000Z', parentIssueKey: undefined } as any,
      ],
      issueKeyCounter: 10,
    };
    const expectedSavedJson = JSON.stringify(dataToSave, null, 2);

    await saveDatabase(dataToSave as any);

    // Verify writeFile was called with the data and correct path/encoding
    expect(mockFsPromises.writeFile).toHaveBeenCalledTimes(1);
    expect(mockFsPromises.writeFile).toHaveBeenCalledWith(DB_FILE_PATH_FOR_TEST, expectedSavedJson, 'utf8');

    // Verify other fs functions were NOT called by saveDatabase
    // Verify mkdir was called to ensure the directory exists
    expect(mockFsPromises.mkdir).toHaveBeenCalledTimes(1);
    expect(mockFsPromises.mkdir).toHaveBeenCalledWith(DB_DIR_PATH_FOR_TEST, { recursive: true });

    // Verify other fs functions were NOT called by saveDatabase (except mkdir and writeFile)
    expect(mockFsPromises.access).not.toHaveBeenCalled();
    expect(mockFsPromises.readFile).not.toHaveBeenCalled();

    // Verify the mock state reflects the file being written
    expect(mockFileContent).toBe(expectedSavedJson);
    expect(fileExists).toBe(true);
  });

  test('loadDatabase should initialize with default data if file exists but contains invalid JSON', async () => {
    // Simulate file existing with invalid JSON content
    mockFileContent = '{ "issues": [ {"id": "ISSUE-1"} ], "issueKeyCounter": 1, '; // Invalid JSON string
    fileExists = true;

    const defaultData = { issues: [], issueKeyCounter: 0 };
    const expectedSavedData = JSON.stringify(defaultData, null, 2);

    const loadedData = await loadDatabase();

    // Verify access was called
    expect(mockFsPromises.access).toHaveBeenCalledTimes(1);
    expect(mockFsPromises.access).toHaveBeenCalledWith(DB_FILE_PATH_FOR_TEST, mockFsPromises.constants.F_OK);

    // Verify readFile was called
    expect(mockFsPromises.readFile).toHaveBeenCalledTimes(1);
    expect(mockFsPromises.readFile).toHaveBeenCalledWith(DB_FILE_PATH_FOR_TEST, 'utf8');

    // Verify writeFile was called to save the default data
    expect(mockFsPromises.writeFile).toHaveBeenCalledTimes(1);
    expect(mockFsPromises.writeFile).toHaveBeenCalledWith(DB_FILE_PATH_FOR_TEST, expectedSavedData, 'utf8');

    // Verify loadDatabase returned the default data
    expect(loadedData).toEqual(defaultData);

    // Verify the mock state reflects the default data being written (overwriting invalid JSON)
    expect(mockFileContent).toBe(expectedSavedData);
    expect(fileExists).toBe(true);
  });

    test('loadDatabase should initialize with default data if readFile throws an error (not ENOENT)', async () => {
    // Simulate file existing
    fileExists = true;
    mockFileContent = 'Some content'; // Content doesn't matter if readFile fails

    // Simulate readFile throwing a different error (e.g., permissions)
    const readFileError = new Error('Mock: Permission denied');
    (readFileError as any).code = 'EACCES'; // Example: Access denied error code
    mockFsPromises.readFile.mockRejectedValueOnce(readFileError);

    const defaultData = { issues: [], issueKeyCounter: 0 };
    const expectedSavedData = JSON.stringify(defaultData, null, 2);

    const loadedData = await loadDatabase();

    // Verify access was called
    expect(mockFsPromises.access).toHaveBeenCalledTimes(1);
    expect(mockFsPromises.access).toHaveBeenCalledWith(DB_FILE_PATH_FOR_TEST, mockFsPromises.constants.F_OK);

    // Verify readFile was called and failed
    expect(mockFsPromises.readFile).toHaveBeenCalledTimes(1);
    expect(mockFsPromises.readFile).toHaveBeenCalledWith(DB_FILE_PATH_FOR_TEST, 'utf8');

    // Verify mkdir was called to ensure the directory exists before writing
    expect(mockFsPromises.mkdir).toHaveBeenCalledTimes(1);
    expect(mockFsPromises.mkdir).toHaveBeenCalledWith(DB_DIR_PATH_FOR_TEST, { recursive: true });

    // Verify writeFile was called to save the default data
    expect(mockFsPromises.writeFile).toHaveBeenCalledTimes(1);
    expect(mockFsPromises.writeFile).toHaveBeenCalledWith(DB_FILE_PATH_FOR_TEST, expectedSavedData, 'utf8');

    // Verify loadDatabase returned the default data
    expect(loadedData).toEqual(defaultData);

    // Verify the mock state reflects the default data being written
    expect(mockFileContent).toBe(expectedSavedData);
    expect(fileExists).toBe(true);
  });
});
