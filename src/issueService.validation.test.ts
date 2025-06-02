import { createIssue } from '../src/issueService';
import { loadDatabase, saveDatabase } from '../src/database/database';
import { DbSchema } from '../src/models';
import { IssueCreationError } from '../src/utils/errorHandling'; // Corrected import path

// Mock the database module to control database interactions
jest.mock('../src/database/database');

const mockLoadDatabase = loadDatabase as jest.Mock;
const mockSaveDatabase = saveDatabase as jest.Mock;

describe('issueService - Input Validation', () => {
  const initialDb: DbSchema = {
    issues: [],
    issueKeyCounter: 0,
  };

  let savedDbState: DbSchema | null = null;
  let mockDate: Date;

  beforeEach(() => {
    // Reset mocks and mock data before each test
    mockLoadDatabase.mockClear();
    mockSaveDatabase.mockClear();
    savedDbState = null;

    // Mock loadDatabase to return a copy of the initial state
    mockLoadDatabase.mockResolvedValue(JSON.parse(JSON.stringify(initialDb))); // Deep copy

    // Mock saveDatabase to capture the state it was called with
    mockSaveDatabase.mockImplementation(async (db: DbSchema) => {
      savedDbState = db; // Capture the state
      return Promise.resolve();
    });

    // Mock Date to get predictable timestamps
    mockDate = new Date('2023-10-27T10:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  });

  afterEach(() => {
    // Restore Date mock
    jest.restoreAllMocks();
  });

  it('should throw IssueCreationError with MISSING_TITLE code if title is missing', async () => {
    const input = {
      // title is missing
      description: '...',
    };

    // Use a single try/catch block for all assertions on the thrown error
    try {
      await createIssue(input as any);
      // If we reach here, the promise didn't reject, which is an error
      fail('createIssue should have thrown an error');
    } catch (error: any) {
      expect(error).toBeInstanceOf(IssueCreationError);
      expect(error.message).toBe('Issue title is required.');
      expect(error.errorCode).toBe('MISSING_TITLE');
      expect(error.statusCode).toBe(400);
    }

    expect(mockLoadDatabase).not.toHaveBeenCalled(); // Validation happens before loading
    expect(mockSaveDatabase).not.toHaveBeenCalled(); // Save should not be called
  });

  it('should throw IssueCreationError with MISSING_TITLE code if title is empty', async () => {
    const input = {
      title: '', // empty title
      description: '...',
    };

    // Use a single try/catch block for all assertions on the thrown error
    try {
      await createIssue(input);
      fail('createIssue should have thrown an error');
    } catch (error: any) {
      expect(error).toBeInstanceOf(IssueCreationError);
      expect(error.message).toBe('Issue title is required.');
      expect(error.errorCode).toBe('MISSING_TITLE');
      expect(error.statusCode).toBe(400);
    }

    expect(mockLoadDatabase).not.toHaveBeenCalled(); // Validation happens before loading
    expect(mockSaveDatabase).not.toHaveBeenCalled(); // Save should not be called
  });

  it('should throw IssueCreationError with MISSING_TITLE code if title is only whitespace', async () => {
    const input = {
      title: '   ', // whitespace title
      description: '...',
    };

    // Use a single try/catch block for all assertions on the thrown error
    try {
      await createIssue(input);
      fail('createIssue should have thrown an error');
    } catch (error: any) {
      expect(error).toBeInstanceOf(IssueCreationError);
      expect(error.message).toBe('Issue title is required.');
      expect(error.errorCode).toBe('MISSING_TITLE');
      expect(error.statusCode).toBe(400);
    }

    expect(mockLoadDatabase).not.toHaveBeenCalled(); // Validation happens before loading
    expect(mockSaveDatabase).not.toHaveBeenCalled(); // Save should not be called
  });

  it('should throw IssueCreationError with INVALID_PARENT_KEY code if Subtask is created without parentKey', async () => {
    const input = {
      title: 'Subtask without parent',
      issueTypeName: 'Subtask',
      description: '...',
      // parentKey is missing
    };

    // Use a single try/catch block for all assertions on the thrown error
    try {
      await createIssue(input);
      fail('createIssue should have thrown an error');
    } catch (error: any) {
      expect(error).toBeInstanceOf(IssueCreationError);
      expect(error.message).toBe('Subtask creation requires a parentKey.');
      expect(error.errorCode).toBe('INVALID_PARENT_KEY'); // Corrected errorCode expectation
      expect(error.statusCode).toBe(400);
    }

    // Load happens *before* parent validation for Subtasks, so loadDatabase should be called once.
    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).not.toHaveBeenCalled(); // Save should not be called
  });
});
