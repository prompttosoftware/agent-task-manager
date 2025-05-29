import { createIssue } from './issueService';
import { loadDatabase, saveDatabase } from './dataStore';
import { DbSchema, AnyIssue, IssueType, IssueStatus } from './models'; // Assuming AnyIssue, DbSchema, IssueType, IssueStatus are exported from models
import { IssueCreationError } from './utils/errorHandling'; // Import custom error

// Mock the dataStore module to control database interactions
jest.mock('./dataStore');

const mockLoadDatabase = loadDatabase as jest.Mock;
const mockSaveDatabase = saveDatabase as jest.Mock;

describe('issueService', () => {
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

  it('should create a Task issue with default status Todo and properties', async () => {
    const input = {
      title: 'Test Issue Title',
      description: 'This is a test description.',
    };

    const createdIssue = await createIssue(input);

    // Verify database interactions
    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull(); // Ensure saveDatabase was called

    // Verify the saved database state
    expect(savedDbState!.issueKeyCounter).toBe(1);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0];

    // Verify the returned issue object
    expect(createdIssue).toBeDefined();
    expect(createdIssue.key).toBe('ISSUE-1');
    // Updated check: service maps input.title to issue.summary
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    // Updated expected status for default/Task
    expect(createdIssue.status).toBe('Todo');
    // Check default issue type
    expect(createdIssue.issueType).toBe('Task');
    expect(createdIssue.createdAt).toEqual(mockDate.toISOString()); // Expect ISO string
    expect(createdIssue.updatedAt).toEqual(mockDate.toISOString()); // Expect ISO string
    expect(createdIssue.parentKey).toBeNull(); // Should be null if not provided

    // Verify the returned object matches the saved object (reference might differ, but properties should match)
    expect(createdIssue).toEqual(savedIssue);
  });

  it('should create a Story issue with status Todo when issueTypeName is feature', async () => {
    const input = {
      title: 'Feature Title',
      description: 'This is a feature request.',
      issueTypeName: 'feature', // alias for Story
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(1);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0];

    expect(createdIssue.key).toBe('ISSUE-1');
    // Updated check: service maps input.title to issue.summary
    expect(createdIssue.summary).toBe(input.title);
    // Check mapped issue type
    expect(createdIssue.issueType).toBe('Story');
    // Updated expected status for Story
    expect(createdIssue.status).toBe('Todo');

    expect(createdIssue).toEqual(savedIssue);
  });

    it('should create a Story issue with status Todo when issueTypeName is Story', async () => {
      const input = {
        title: 'Story Title',
        description: 'This is a story.',
        issueTypeName: 'Story',
      };

      const createdIssue = await createIssue(input);

      expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
      expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
      expect(savedDbState).not.toBeNull();

      expect(createdIssue.key).toBe('ISSUE-1');
      expect(createdIssue.summary).toBe(input.title);
      expect(createdIssue.issueType).toBe('Story');
      expect(createdIssue.status).toBe('Todo');
    });


  it('should create a Bug issue with status In Progress when issueTypeName is bug', async () => {
    const input = {
      title: 'Bug Title',
      description: 'This is a bug report.',
      issueTypeName: 'bug',
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(1);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0];

    expect(createdIssue.key).toBe('ISSUE-1');
    // Updated check: service maps input.title to issue.summary
    expect(createdIssue.summary).toBe(input.title);
    // Check issue type
    expect(createdIssue.issueType).toBe('Bug');
    // Updated expected status for Bug
    expect(createdIssue.status).toBe('In Progress');

    expect(createdIssue).toEqual(savedIssue);
  });

  it('should create an Epic issue with status Todo and empty childIssueKeys', async () => {
    const input = {
      title: 'Epic Title',
      description: 'This is an epic.',
      issueTypeName: 'Epic',
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    const savedIssue = savedDbState!.issues[0];

    expect(createdIssue.key).toBe('ISSUE-1');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.issueType).toBe('Epic');
    expect(createdIssue.status).toBe('Todo');
    // Check Epic specific property
    expect((createdIssue as any).childIssueKeys).toEqual([]);

    expect(createdIssue).toEqual(savedIssue);
  });


  it('should create a Subtask issue with status Todo and a parentKey if provided', async () => {
    const input = {
      title: 'Subtask Title',
      description: 'This is a subtask.',
      issueTypeName: 'Subtask',
      parentKey: 'EPIC-123', // Providing parent key
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(1);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0];

    expect(createdIssue.key).toBe('ISSUE-1');
    // Updated check: service maps input.title to issue.summary
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    // Check issue type
    expect(createdIssue.issueType).toBe('Subtask');
    // Check expected status for Subtask
    expect(createdIssue.status).toBe('Todo');
    // Check parent key
    expect(createdIssue.parentKey).toBe('EPIC-123');

    expect(createdIssue).toEqual(savedIssue);
  });

  it('should create a Task issue with status Todo when issueTypeName is unrecognized', async () => {
    const input = {
      title: 'Unrecognized Type Test',
      description: 'Should default to Task.',
      issueTypeName: 'UnknownType', // Unrecognized type
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(createdIssue.issueType).toBe('Task'); // Should default to Task
    expect(createdIssue.status).toBe('Todo'); // Task status is Todo
  });


  it('should generate the next key correctly when counter is not zero', async () => {
    const dbWithExistingIssues: DbSchema = {
      issues: [
        // Mock existing issues
        {
          id: 'uuid1',
          key: 'ISSUE-10',
          issueType: 'Task',
          summary: 'Existing Issue',
          description: '...',
          status: 'Done',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          parentKey: null,
        },
      ],
      issueKeyCounter: 10, // Start counter from 10
    };

    mockLoadDatabase.mockResolvedValue(JSON.parse(JSON.stringify(dbWithExistingIssues)));

    const input = {
      title: 'New Issue After 10',
      description: '...',
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(11); // Counter should be 11
    expect(savedDbState!.issues.length).toBe(2); // Should contain both issues
    expect(createdIssue.key).toBe('ISSUE-11'); // New key should be ISSUE-11

    // Check the newly added issue in saved state
    const newSavedIssue = savedDbState!.issues.find(issue => issue.key === 'ISSUE-11');
    expect(newSavedIssue).toBeDefined();
    // Updated check: service maps input.title to issue.summary
    expect(newSavedIssue!.summary).toBe(input.title);
    expect(newSavedIssue!.description).toBe(input.description);
    // Default type and status checks
    expect(newSavedIssue!.issueType).toBe('Task');
    expect(newSavedIssue!.status).toBe('Todo');


    expect(createdIssue).toEqual(newSavedIssue);
  });

  // --- New Validation Tests ---

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


  // --- Existing Error Handling Tests (modified to match service error messages) ---

  it('should throw an error if database loading fails', async () => {
    const mockError = new Error('Failed to load database');
    mockLoadDatabase.mockRejectedValue(mockError);

    const input = {
      title: 'Issue to Fail Load',
      description: '...',
    };

    // Service now wraps this in a generic Error
    await expect(createIssue(input)).rejects.toThrow('Failed to create issue due to a data storage error.');

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).not.toHaveBeenCalled(); // Save should not be called if load fails
  });

  it('should throw an error if database saving fails', async () => {
    const mockError = new Error('Failed to save database');
    mockSaveDatabase.mockRejectedValue(mockError);

    const input = {
      title: 'Issue to Fail Save',
      description: '...',
    };

    // Service now wraps this in a generic Error
    await expect(createIssue(input)).rejects.toThrow('Failed to create issue due to a data storage error.');

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1); // Save should be attempted
  });

  it('should include createdAt and updatedAt timestamps as ISO strings', async () => {
    const input = {
      title: 'Timestamp Test',
      description: 'Checking timestamps',
    };

    const createdIssue = await createIssue(input);

    // Expect ISO string format
    expect(createdIssue.createdAt).toEqual(mockDate.toISOString());
    expect(createdIssue.updatedAt).toEqual(mockDate.toISOString());

    // Check saved state too
    expect(savedDbState).not.toBeNull();
    const savedIssue = savedDbState!.issues[0];
    // Expect ISO string format
    expect(savedIssue.createdAt).toEqual(mockDate.toISOString());
    expect(savedIssue.updatedAt).toEqual(mockDate.toISOString());
  });
});
