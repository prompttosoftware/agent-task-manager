import { createIssue } from './issueService';
import { loadDatabase, saveDatabase } from './database/database';
import { DbSchema, Task } from './models'; // Only need Task and base types for these tests

// Mock the database module to control database interactions
jest.mock('./database/database');

jest.mock('uuid', () => {
  const mockV4 = jest.fn(() => 'test-uuid');
  return {
    v4: mockV4,
  };
});

const mockLoadDatabaseFunction = loadDatabase as jest.Mock;
const mockSaveDatabaseFunction = saveDatabase as jest.Mock;

// This initialDb is the default state returned by mockLoadDatabase
const defaultInitialDb: DbSchema = {
  issues: [],
  issueKeyCounter: 1,
};

let savedDbState: DbSchema | null = null;
let mockDate: Date;
let mockUuidV4: jest.Mock;


beforeEach(() => {
  mockLoadDatabaseFunction.mockClear();
  mockSaveDatabaseFunction.mockClear();

  const mockedUuid = jest.requireMock('uuid');
  mockUuidV4 = mockedUuid.v4 as jest.Mock;
  mockUuidV4.mockClear();

  savedDbState = null;

  mockLoadDatabaseFunction.mockImplementation(async () => {
    return Promise.resolve(JSON.parse(JSON.stringify(defaultInitialDb)));
  });

  mockSaveDatabaseFunction.mockImplementation(async (db: DbSchema) => {
    savedDbState = db;
    return Promise.resolve();
  });

  mockDate = new Date('2023-10-27T10:00:00.000Z');
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('issueService - Create Operations - Default Behavior', () => {

  it('should create a Task issue with default status Todo and properties (summary, description)', async () => {
    const input = {
      title: 'Test Issue Title',
      description: 'This is a test description.',
      // issueTypeName is omitted, should default to Task
    };

    const createdIssue = await createIssue(input);

    // Verify database interactions
    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull(); // Ensure saveDatabase was called

    // Verify the saved database state
    // Using default initialDb (counter 1, issues [])
    expect(savedDbState!.issueKeyCounter).toBe(2); // Counter increments from initial 1 to 2
    expect(savedDbState!.issues.length).toBe(1); // Only the new issue
    // Find the newly created issue in the saved state
    const savedIssue = savedDbState!.issues.find(issue => issue.id === createdIssue.id);

    expect(savedIssue).toBeDefined(); // Ensure the new issue was added


    // Verify the returned issue object
    expect(createdIssue).toBeDefined();
    // Using default initialDb (counter 1), the first new key number is 1
    expect(createdIssue.key).toBe('TASK-1');
    // Check mapping of input.title to issue.summary
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    // Check default status for Task
    expect(createdIssue.status).toBe('Todo');
    // Check default issue type when not provided
    expect(createdIssue.issueType).toBe('Task');
    // Timestamps are checked in a separate file, but ensure they exist
    expect(createdIssue.createdAt).toBeDefined();
    expect(createdIssue.updatedAt).toBeDefined();
    expect(createdIssue.parentKey).toBeNull(); // Should be null if not provided

    // Verify the returned object matches the saved object (reference might differ, but properties should match)
    expect(createdIssue).toEqual(savedIssue);
  });

  it('should generate a unique id using uuidv4', async () => {
      const input = {
          title: 'UUID Test',
          description: 'Checking UUID',
      };

      const createdIssue = await createIssue(input);

      // Verify database interactions
      expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
      expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
      expect(savedDbState).not.toBeNull();

      // Verify the returned issue object
      expect(createdIssue.id).toBe('test-uuid'); // Check if the uuid mock is used
      expect(mockUuidV4).toHaveBeenCalledTimes(1); // Ensure uuidv4 was called

      // Verify the saved database state includes the issue with the correct id
      // Using default initialDb (issues [])
      expect(savedDbState!.issues.length).toBe(1); // Only the new issue
      // Find the newly created issue in the saved state
      const savedIssue = savedDbState!.issues.find(issue => issue.id === 'test-uuid');
      expect(savedIssue).toBeDefined();
      expect(savedIssue!.id).toBe('test-uuid');
      expect(createdIssue).toEqual(savedIssue); // Compare returned object to the one found in saved state
  });

});
