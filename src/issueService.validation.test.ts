import { createIssue } from './issueService';
import { loadDatabase, saveDatabase } from './dataStore';
import { DbSchema } from './models';
import { IssueCreationError } from './utils/errorHandling';

// Mock the dataStore module to control database interactions
jest.mock('./dataStore');

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
    mockLoadDatabase.mockResolvedValue(JSON.parse(JSON.stringify(initialDb))); // Deep copy to avoid mutation issues

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

    await expect(createIssue(input as any)).rejects.toThrow(IssueCreationError); // Expect the specific error type
    await expect(createIssue(input as any)).rejects.toThrow('Issue title is required.'); // Expect the specific message

    try {
        await createIssue(input as any);
    } catch (error: any) {
        expect(error).toBeInstanceOf(IssueCreationError);
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

    await expect(createIssue(input)).rejects.toThrow(IssueCreationError); // Expect the specific error type
    await expect(createIssue(input)).rejects.toThrow('Issue title is required.'); // Expect the specific message

    try {
        await createIssue(input);
    } catch (error: any) {
        expect(error).toBeInstanceOf(IssueCreationError);
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

    await expect(createIssue(input)).rejects.toThrow(IssueCreationError); // Expect the specific error type
    await expect(createIssue(input)).rejects.toThrow('Issue title is required.'); // Expect the specific message

    try {
        await createIssue(input);
    } catch (error: any) {
        expect(error).toBeInstanceOf(IssueCreationError);
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

    await expect(createIssue(input)).rejects.toThrow(IssueCreationError); // Expect the specific error type
    await expect(createIssue(input)).rejects.toThrow('Subtask creation requires a parentKey.'); // Expect the specific message

    try {
        await createIssue(input);
    } catch (error: any) {
        expect(error).toBeInstanceOf(IssueCreationError);
        expect(error.errorCode).toBe('INVALID_PARENT_KEY');
        expect(error.statusCode).toBe(400);
    }

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1); // Load happens before this validation
    expect(mockSaveDatabase).not.toHaveBeenCalled(); // Save should not be called
  });
});
