import { createIssue } from './issueService';
import { loadDatabase, saveDatabase } from './database/database';
import { DbSchema, AnyIssue, Task, Story, Bug, Epic, Subtask } from './models';
import { IssueCreationError } from './utils/errorHandling';

// Mock the database module to control database interactions
jest.mock('./database/database');

// Declare mockUuidV4Function before jest.mock call
jest.mock('uuid', () => {
  const mockV4 = jest.fn(() => 'test-uuid');
  return {
    v4: mockV4,
  };
});

const mockLoadDatabaseFunction = loadDatabase as jest.Mock;
const mockSaveDatabaseFunction = saveDatabase as jest.Mock;

describe('issueService - Create Operations', () => {
  let mockUuidV4: jest.Mock;

  // This initialDb is the default state returned by mockLoadDatabase
  // unless overridden in a specific test case.
  // Start with an empty database by default for cleaner tests.
  const defaultInitialDb: DbSchema = {
    issues: [],
    issueKeyCounter: 1, // Start counter at 1 for new issues
  };

  let savedDbState: DbSchema | null = null;
  let mockDate: Date;

  beforeEach(() => {
    // Reset mocks and mock data before each test
    mockLoadDatabaseFunction.mockClear();
    mockSaveDatabaseFunction.mockClear();

    const mockedUuid = jest.requireMock('uuid');
    mockUuidV4 = mockedUuid.v4 as jest.Mock;

    mockUuidV4.mockClear();

    savedDbState = null;

    // Mock loadDatabase to return a copy of the initial state by default
    // Explicitly setting the mock implementation here as requested.
    mockLoadDatabaseFunction.mockImplementation(async () => {
      return Promise.resolve(JSON.parse(JSON.stringify(defaultInitialDb))); // Deep copy to avoid mutation issues
    });

    // Mock saveDatabase to capture the state it was called with
    mockSaveDatabaseFunction.mockImplementation(async (db: DbSchema) => {
      savedDbState = db; // Capture the state
      return Promise.resolve();
    });

    // Mock Date to get predictable timestamps
    mockDate = new Date('2023-10-27T10:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  });

  afterEach(() => {
    // Restore mocks
    jest.restoreAllMocks();
  });

  it('should create a Task issue with default status Todo and properties', async () => {
    const input = {
      title: 'Test Issue Title',
      description: 'This is a test description.',
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

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    // Using default initialDb (counter 1, issues [])
    expect(savedDbState!.issueKeyCounter).toBe(2); // Counter increments from initial 1 to 2
    expect(savedDbState!.issues.length).toBe(1); // Only the new issue
    // Find the newly created issue in the saved state
    const savedIssue = savedDbState!.issues.find(issue => issue.id === createdIssue.id);
    expect(savedIssue).toBeDefined();

    // Using default initialDb (counter 1), the first new key number is 1
    expect(createdIssue.key).toBe('STOR-1');
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

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    // Verify the saved database state
    // Using default initialDb (counter 1, issues [])
    expect(savedDbState!.issueKeyCounter).toBe(2); // Counter increments from initial 1 to 2
    expect(savedDbState!.issues.length).toBe(1); // Only the new issue
    // Find the newly created issue in the saved state
    const savedIssue = savedDbState!.issues.find(issue => issue.id === createdIssue.id);
    expect(savedIssue).toBeDefined();


    // Using default initialDb (counter 1), the first new key number is 1
    expect(createdIssue.key).toBe('STOR-1');
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

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    // Using default initialDb (counter 1, issues [])
    expect(savedDbState!.issueKeyCounter).toBe(2); // Counter increments from initial 1 to 2
    expect(savedDbState!.issues.length).toBe(1); // Only the new issue
    // Find the newly created issue in the saved state
    const savedIssue = savedDbState!.issues.find(issue => issue.id === createdIssue.id);
    expect(savedIssue).toBeDefined();


    // Using default initialDb (counter 1), the first new key number is 1
    expect(createdIssue.key).toBe('BUG-1');
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

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    // Verify the saved database state
    // Using default initialDb (counter 1, issues [])
    expect(savedDbState!.issueKeyCounter).toBe(2); // Counter increments from initial 1 to 2
    expect(savedDbState!.issues.length).toBe(1); // Only the new issue

    // Find the newly created issue in the saved state
    const savedIssue = savedDbState!.issues.find(issue => issue.id === createdIssue.id);
    expect(savedIssue).toBeDefined();

    // Using default initialDb (counter 1), the first new key number is 1
    expect(createdIssue.key).toBe('EPIC-1');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.issueType).toBe('Epic');
    expect(createdIssue.status).toBe('Todo');
    // Check Epic specific property
    expect((createdIssue as Epic).childIssueKeys).toEqual([]);

    expect(createdIssue).toEqual(savedIssue);
  });


  // Updated test to include a mock parent issue
  it('should create a Subtask issue with status Todo and a parentKey if provided', async () => {
    const input = {
      title: 'Subtask Title',
      description: 'This is a subtask.',
      issueTypeName: 'Subtask',
      parentKey: 'EPIC-123', // Providing parent key
    };

    // --- Start: Add mock parent issue for this test ---
    const parentIssue: Epic = { // Parent can be Epic, Task, Story, Bug
        id: 'parent-uuid',
        key: 'EPIC-123', // Match the input parentKey
        issueType: 'Epic', // Parent type
        summary: 'Mock Parent Epic',
        description: 'This is a mock parent issue for subtask testing.',
        status: 'Todo', // Parent status doesn't matter for subtask creation validation
        // Use specific ISO strings for existing issues
        createdAt: '2023-10-26T09:00:00.000Z',
        updatedAt: '2023-10-26T09:00:00.000Z',
        parentKey: null, // Parent has no parent
        childIssueKeys: [], // Parent starts with no children
    };

    // Create a database state that includes the parent issue
    // Set issueKeyCounter to simulate keys existing up to 123.
    // The new subtask should then get key 124.
    const dbWithParent: DbSchema = {
        issues: [parentIssue], // Include the mock parent
        issueKeyCounter: 123, // Set counter to reflect the highest number part of existing keys (including parent or others)
    };

    // Override mockLoadDatabase for this specific test to return the db with the parent
    mockLoadDatabaseFunction.mockResolvedValue(JSON.parse(JSON.stringify(dbWithParent)));
    // --- End: Add mock parent issue for this test ---


    const createdIssue = await createIssue(input);

    // Verify database interactions
    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1); // Should load the db once with the parent issue
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1); // Should save the db once with the new subtask added
    expect(savedDbState).not.toBeNull(); // Ensure saveDatabase was called

    // Verify the saved database state
    expect(savedDbState!.issueKeyCounter).toBe(124); // The counter should increment from 123 to 124
    expect(savedDbState!.issues.length).toBe(2); // Should contain the parent issue + the new subtask = 2 issues

    // Find the newly created subtask in the saved state
    // Expect the new subtask key to be SUBT-123 based on initial counter 123
    const savedSubtask = savedDbState!.issues.find(issue => issue.key === 'SUBT-123');

    expect(savedSubtask).toBeDefined(); // Ensure the subtask was added

    // Verify the returned issue object
    expect(createdIssue).toBeDefined();
    // Corrected key format: Expect SUBT-123 (counter was 123, next number is 123, then counter increments to 124)
    expect(createdIssue.key).toBe('SUBT-123');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    expect(createdIssue.issueType).toBe('Subtask');
    expect(createdIssue.status).toBe('Todo'); // Check expected status for Subtask
    // Check parent key was correctly assigned from input
    expect(createdIssue.parentKey).toBe('EPIC-123');

    // Verify the returned object matches the saved object
    // This also implicitly verifies parentKey is correct in the saved object
    expect(createdIssue).toEqual(savedSubtask);

    // Verify the parent issue in the saved state *was* modified to include the new child key
    const savedParentIssue = savedDbState!.issues.find(issue => issue.key === 'EPIC-123') as Epic;
    expect(savedParentIssue).toBeDefined();
    // Expect childIssueKeys to include the key of the newly created subtask
    expect(savedParentIssue.childIssueKeys).toEqual(['SUBT-123']);
    // Expect the parent's updatedAt timestamp to be updated
    expect(savedParentIssue.updatedAt).toEqual(mockDate.toISOString()); // Parent update should use the current mock date
    // Expect other parent properties to remain unchanged
    expect(savedParentIssue.id).toBe('parent-uuid');
    expect(savedParentIssue.summary).toBe('Mock Parent Epic');
    expect(savedParentIssue.description).toBe('This is a mock parent issue for subtask testing.');
    expect(savedParentIssue.status).toBe('Todo');
    expect(savedParentIssue.createdAt).toEqual(new Date('2023-10-26T09:00:00.000Z').toISOString()); // createdAt should not change


  });

  it('should create a Task issue with status Todo when issueTypeName is unrecognized', async () => {
    const input = {
      title: 'Unrecognized Type Test',
      description: 'Should default to Task.',
      issueTypeName: 'UnknownType', // Unrecognized type
    };

    const createdIssue = await createIssue(input as any); // Cast to any as UnknownType is not in union

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    // Verify the saved database state
    // Using default initialDb (counter 1, issues [])
    expect(savedDbState!.issueKeyCounter).toBe(2); // Counter increments from initial 1 to 2
    expect(savedDbState!.issues.length).toBe(1); // Only the new issue
    // Find the newly created issue in the saved state
    const savedIssue = savedDbState!.issues.find(issue => issue.id === createdIssue.id);
    expect(savedIssue).toBeDefined();


    // Using default initialDb (counter 1), the first new key number is 1 (defaults to Task)
    expect(createdIssue.key).toBe('TASK-1');
    expect(createdIssue.issueType).toBe('Task'); // Should default to Task
    expect(createdIssue.status).toBe('Todo'); // Task status is Todo
  });


  it('should generate the next key correctly when counter is not zero', async () => {
    // Set up a database state with existing issues having keys lower than the counter.
    // This makes it clear that the counter is the source for the *next* key number.
    const dbWithExistingIssues: DbSchema = {
      issues: [
        // Mock existing issues with keys lower than the counter
        {
          id: 'uuid1',
          key: 'TASK-8', // Using type-specific key, lower than counter
          issueType: 'Task',
          summary: 'Existing Task 8',
          description: '...',
          status: 'Done',
          // Use specific ISO strings for existing issues
          createdAt: '2023-01-01T10:00:00.000Z',
          updatedAt: '2023-01-01T10:00:00.000Z',
          parentKey: null,
        } as Task,
        {
          id: 'uuid2',
          key: 'STOR-9', // Another existing issue, lower than counter
          issueType: 'Story',
          summary: 'Existing Story 9',
          description: '...',
          status: 'Todo',
          // Use specific ISO strings for existing issues
          createdAt: '2023-01-01T11:00:00.000Z',
          updatedAt: '2023-01-01T11:00:00.000Z',
          parentKey: null,
        } as Story
      ],
      issueKeyCounter: 10, // Counter is set to the *next* number to be used
    };

    mockLoadDatabaseFunction.mockResolvedValue(JSON.parse(JSON.stringify(dbWithExistingIssues)));

    const input = {
      title: 'New Issue After 9', // Title updated to reflect the key number
      description: '...',
      // Default type is Task
    };

    const createdIssue = await createIssue(input);

    // Verify database interactions
    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    // Verify the saved database state
    expect(savedDbState!.issueKeyCounter).toBe(11); // Counter should increment (initial 10 + 1)
    expect(savedDbState!.issues.length).toBe(3); // Should contain the two existing issues + the new one

    // Verify the returned issue object
    expect(createdIssue).toBeDefined();
    // New key should be TASK-10 (default type Task, using initial counter 10)
    expect(createdIssue.key).toBe('TASK-10');
    // Check the new issue's properties
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    expect(createdIssue.issueType).toBe('Task');
    expect(createdIssue.status).toBe('Todo');
    expect(createdIssue.createdAt).toEqual(mockDate.toISOString());
    expect(createdIssue.updatedAt).toEqual(mockDate.toISOString());
    expect(createdIssue.parentKey).toBeNull();

    // Check the newly added issue in saved state
    const newSavedIssue = savedDbState!.issues.find(issue => issue.id === createdIssue.id);
    expect(newSavedIssue).toBeDefined();
    expect(newSavedIssue).toEqual(createdIssue); // Ensure the saved object matches the returned object

    // Ensure existing issues were not modified (except potentially updatedAt if that were part of the process, but it's not for create)
    const savedExistingTask = savedDbState!.issues.find(issue => issue.key === 'TASK-8') as Task;
    expect(savedExistingTask).toBeDefined();
    expect(savedExistingTask.summary).toBe('Existing Task 8'); // Verify properties of existing issue
    // Check createdAt/updatedAt of existing issues aren't affected by new issue creation
    expect(savedExistingTask.createdAt).toEqual(new Date('2023-01-01T10:00:00.000Z').toISOString());
    expect(savedExistingTask.updatedAt).toEqual(new Date('2023-01-01T10:00:00.000Z').toISOString());

    const savedExistingStory = savedDbState!.issues.find(issue => issue.key === 'STOR-9') as Story;
    expect(savedExistingStory).toBeDefined();
    expect(savedExistingStory.summary).toBe('Existing Story 9');
    expect(savedExistingStory.createdAt).toEqual(new Date('2023-01-01T11:00:00.000Z').toISOString());
    expect(savedExistingStory.updatedAt).toEqual(new Date('2023-01-01T11:00:00.000Z').toISOString());
  });

  it('should include createdAt and updatedAt timestamps as ISO strings', async () => {
    const input = {
      title: 'Timestamp Test',
      description: 'Checking timestamps',
    };

    const createdIssue = await createIssue(input);

    // Corrected key format (defaults to Task) - should use the next number after initial counter
    // Default initialDb counter is 1, so the first issue key should be TASK-1.
    expect(createdIssue.key).toBe('TASK-1');
    // Expect ISO string format
    expect(createdIssue.createdAt).toEqual(mockDate.toISOString());
    expect(createdIssue.updatedAt).toEqual(mockDate.toISOString());

    // Check saved state too
    expect(savedDbState).not.toBeNull();
    // Using default initialDb (counter 1)
    expect(savedDbState!.issueKeyCounter).toBe(2); // Counter increments from 1 to 2
    expect(savedDbState!.issues.length).toBe(1); // Only the new issue
    const savedIssue = savedDbState!.issues[0];
    // Expect ISO string format
    expect(savedIssue.createdAt).toEqual(mockDate.toISOString());
    expect(savedIssue.updatedAt).toEqual(mockDate.toISOString());
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
      expect(mockUuidV4).toHaveBeenCalledTimes(1);

      // Verify the saved database state includes the issue with the correct id
      // Using default initialDb (issues [])
      expect(savedDbState!.issues.length).toBe(1); // Only the new issue
      // Find the newly created issue in the saved state
      const savedIssue = savedDbState!.issues.find(issue => issue.id === 'test-uuid');
      expect(savedIssue).toBeDefined();
      expect(savedIssue!.id).toBe('test-uuid');
      expect(createdIssue).toEqual(savedIssue); // Compare returned object to the one found in saved state
  });

  it('should create a Task with a parentKey pointing to an existing Epic', async () => {
    const input = {
      title: 'Task with Epic Parent',
      description: 'This task has an Epic parent.',
      issueTypeName: 'Task',
      parentKey: 'EPIC-1',
    };

    // Mock an existing Epic in the database
    const epic: Epic = {
      id: 'epic-uuid',
      key: 'EPIC-1',
      issueType: 'Epic',
      summary: 'Existing Epic',
      description: 'Epic description',
      status: 'Todo',
      // Use specific ISO strings for existing issues
      createdAt: '2023-11-01T10:00:00.000Z', // Use a different date/time
      updatedAt: '2023-11-01T10:00:00.000Z', // Use a different date/time
      parentKey: null,
      childIssueKeys: [],
    };

    const dbWithEpic: DbSchema = {
      issues: [epic],
      issueKeyCounter: 1,
    };

    mockLoadDatabaseFunction.mockResolvedValue(JSON.parse(JSON.stringify(dbWithEpic)));

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(createdIssue.key).toBe('TASK-1');
    expect(createdIssue.issueType).toBe('Task');
    expect(createdIssue.status).toBe('Todo');
    expect(createdIssue.parentKey).toBe('EPIC-1');

    // Verify the saved database state
    expect(savedDbState!.issueKeyCounter).toBe(2); // Initial 1 + 1
    expect(savedDbState!.issues.length).toBe(2);

    const savedTask = savedDbState!.issues.find(issue => issue.key === 'TASK-1') as Task;
    expect(savedTask).toBeDefined();
    expect(savedTask.parentKey).toBe('EPIC-1');

    // Verify the parent issue in the saved state was modified to include the new child key
    const savedEpic = savedDbState!.issues.find(issue => issue.key === 'EPIC-1') as Epic;
    expect(savedEpic).toBeDefined();
    expect(savedEpic.childIssueKeys).toEqual(['TASK-1']);
    expect(savedEpic.updatedAt).toEqual(mockDate.toISOString()); // Parent update should use the current mock date
  });

  it('should create a Story with a parentKey pointing to an existing Epic', async () => {
    const input = {
      title: 'Story with Epic Parent',
      description: 'This story has an Epic parent.',
      issueTypeName: 'Story',
      parentKey: 'EPIC-1',
    };

    // Mock an existing Epic in the database
    const epic: Epic = {
      id: 'epic-uuid',
      key: 'EPIC-1',
      issueType: 'Epic',
      summary: 'Existing Epic',
      description: 'Epic description',
      status: 'Todo',
      // Use specific ISO strings for existing issues
      createdAt: '2023-11-01T11:00:00.000Z', // Use a different date/time
      updatedAt: '2023-11-01T11:00:00.000Z', // Use a different date/time
      parentKey: null,
      childIssueKeys: [],
    };

    const dbWithEpic: DbSchema = {
      issues: [epic],
      issueKeyCounter: 1,
    };

    mockLoadDatabaseFunction.mockResolvedValue(JSON.parse(JSON.stringify(dbWithEpic)));

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(createdIssue.key).toBe('STOR-1');
    expect(createdIssue.issueType).toBe('Story');
    expect(createdIssue.status).toBe('Todo');
    expect(createdIssue.parentKey).toBe('EPIC-1');

    // Verify the saved database state
    expect(savedDbState!.issueKeyCounter).toBe(2); // Initial 1 + 1
    expect(savedDbState!.issues.length).toBe(2);

    const savedStory = savedDbState!.issues.find(issue => issue.key === 'STOR-1') as Story;
    expect(savedStory).toBeDefined();
    expect(savedStory.parentKey).toBe('EPIC-1');

    // Verify the parent issue in the saved state was modified to include the new child key
    const savedEpic = savedDbState!.issues.find(issue => issue.key === 'EPIC-1') as Epic;
    expect(savedEpic).toBeDefined();
    expect(savedEpic.childIssueKeys).toEqual(['STOR-1']);
    expect(savedEpic.updatedAt).toEqual(mockDate.toISOString()); // Parent update should use the current mock date
  });
});
