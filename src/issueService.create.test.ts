import { createIssue } from './issueService';
import { loadDatabase, saveDatabase } from './dataStore';
import { DbSchema, AnyIssue, Task, Story, Bug, Epic, Subtask } from './models';
import { IssueCreationError } from './utils/errorHandling';
import { v4 as uuidv4 } from 'uuid';
import * as keyGenerator from '../src/utils/keyGenerator';

// Mock the dataStore module to control database interactions
jest.mock('./dataStore');
jest.mock('../src/utils/keyGenerator'); // Mock the keyGenerator

const mockLoadDatabase = loadDatabase as jest.Mock;
const mockSaveDatabase = saveDatabase as jest.Mock;
const mockKeyGenerator = keyGenerator as jest.Mocked<typeof keyGenerator>;

describe('issueService - Create Operations', () => {
  // This initialDb is the default state returned by mockLoadDatabase
  // unless overridden in a specific test case.
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
    mockKeyGenerator.generateIssueKey.mockClear(); // Clear the mock
    savedDbState = null;

    // Mock loadDatabase to return a copy of the initial state by default
    mockLoadDatabase.mockResolvedValue(JSON.parse(JSON.stringify(initialDb))); // Deep copy to avoid mutation issues

    // Mock saveDatabase to capture the state it was called with
    mockSaveDatabase.mockImplementation(async (db: DbSchema) => {
      savedDbState = db; // Capture the state
      return Promise.resolve();
    });

    // Mock Date to get predictable timestamps
    mockDate = new Date('2023-10-27T10:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    // Mock UUID to ensure predictable IDs in tests.
    jest.mock('uuid');
    const mockUuid = require('uuid');
    mockUuid.v4.mockReturnValue('test-uuid');

     // Mock keyGenerator to return deterministic values.
    mockKeyGenerator.generateIssueKey.mockImplementation(() => 'TASK-1'); // Default for now.
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
    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull(); // Ensure saveDatabase was called

    // Verify the saved database state
    expect(savedDbState!.issueKeyCounter).toBe(1);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0];

    // Verify the returned issue object
    expect(createdIssue).toBeDefined();
    // Corrected key format
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

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(1);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0];

    // Corrected key format
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

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    // Corrected key format
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

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(1);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0];

    // Corrected key format
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

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    const savedIssue = savedDbState!.issues[0];

    // Corrected key format
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
        createdAt: new Date('2023-10-26T09:00:00.000Z').toISOString(), // Earlier date
        updatedAt: new Date('2023-10-26T09:00:00.000Z').toISOString(), // Earlier date
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
    mockLoadDatabase.mockResolvedValue(JSON.parse(JSON.stringify(dbWithParent)));
    // --- End: Add mock parent issue for this test ---


    const createdIssue = await createIssue(input);

    // Verify database interactions
    expect(mockLoadDatabase).toHaveBeenCalledTimes(1); // Should load the db once with the parent issue
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1); // Should save the db once with the new subtask added
    expect(savedDbState).not.toBeNull(); // Ensure saveDatabase was called

    // Verify the saved database state
    expect(savedDbState!.issueKeyCounter).toBe(124); // The counter should increment from 123 to 124
    expect(savedDbState!.issues.length).toBe(2); // Should contain the parent issue + the new subtask = 2 issues

    // Find the newly created subtask in the saved state
    // Expect the new subtask key to be SUBT-124 based on counter 123
    const savedSubtask = savedDbState!.issues.find(issue => issue.key === 'SUBT-124');

    expect(savedSubtask).toBeDefined(); // Ensure the subtask was added

    // Verify the returned issue object
    expect(createdIssue).toBeDefined();
    // Corrected key format: Expect SUBT-124
    expect(createdIssue.key).toBe('SUBT-124');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    expect(createdIssue.issueType).toBe('Subtask');
    expect(createdIssue.status).toBe('Todo'); // Check expected status for Subtask
    expect(createdIssue.parentKey).toBe('EPIC-123'); // Check parent key
    // Check Subtask specific property
     expect((createdIssue as Subtask).parentIssueKey).toBe('EPIC-123');


    // Verify the returned object matches the saved object
    expect(createdIssue).toEqual(savedSubtask);

    // Verify the parent issue in the saved state was *not* modified (as per current service implementation)
    const savedParentIssue = savedDbState!.issues.find(issue => issue.key === 'EPIC-123') as Epic;
    expect(savedParentIssue).toBeDefined();
    // Expect childIssueKeys to still be empty, as the service doesn't update the parent yet.
    expect(savedParentIssue.childIssueKeys).toEqual([]);
    // Expect other parent properties to remain unchanged (e.g., updatedAt)
    expect(savedParentIssue.updatedAt).toEqual(new Date('2023-10-26T09:00:00.000Z').toISOString());

  });

  it('should create a Task issue with status Todo when issueTypeName is unrecognized', async () => {
    const input = {
      title: 'Unrecognized Type Test',
      description: 'Should default to Task.',
      issueTypeName: 'UnknownType', // Unrecognized type
    };

    const createdIssue = await createIssue(input as any); // Cast to any as UnknownType is not in union

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    // Corrected key format (defaults to Task)
    expect(createdIssue.key).toBe('TASK-1');
    expect(createdIssue.issueType).toBe('Task'); // Should default to Task
    expect(createdIssue.status).toBe('Todo'); // Task status is Todo
  });


  it('should generate the next key correctly when counter is not zero', async () => {
    // Modify mock to use type-specific keys and match the counter
    const dbWithExistingIssues: DbSchema = {
      issues: [
        // Mock existing issues
        {
          id: 'uuid1',
          key: 'TASK-10', // Using type-specific key
          issueType: 'Task',
          summary: 'Existing Task',
          description: '...',
          status: 'Done',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          parentKey: null,
        } as Task,
        {
          id: 'uuid2',
          key: 'STOR-5', // Another existing issue
          issueType: 'Story',
          summary: 'Existing Story',
          description: '...',
          status: 'Todo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          parentKey: null,
        } as Story
      ],
      issueKeyCounter: 10, // Counter reflects the highest number part
    };

    mockLoadDatabase.mockResolvedValue(JSON.parse(JSON.stringify(dbWithExistingIssues)));

    const input = {
      title: 'New Issue After 10',
      description: '...',
      // Default type is Task
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(11); // Counter should increment
    expect(savedDbState!.issues.length).toBe(3); // Should contain all issues
    // New key should be TASK-11 (default type Task, next number 11)
    expect(createdIssue.key).toBe('TASK-11');

    // Check the newly added issue in saved state
    const newSavedIssue = savedDbState!.issues.find(issue => issue.key === 'TASK-11');
    expect(newSavedIssue).toBeDefined();
    // Updated check: service maps input.title to issue.summary
    expect(newSavedIssue!.summary).toBe(input.title);
    expect(newSavedIssue!.description).toBe(input.description);
    // Default type and status checks
    expect(newSavedIssue!.issueType).toBe('Task');
    expect(newSavedIssue!.status).toBe('Todo');


    expect(createdIssue).toEqual(newSavedIssue);
  });

  it('should include createdAt and updatedAt timestamps as ISO strings', async () => {
    const input = {
      title: 'Timestamp Test',
      description: 'Checking timestamps',
    };

    const createdIssue = await createIssue(input);

    // Corrected key format (defaults to Task)
    expect(createdIssue.key).toBe('TASK-1');
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

  it('should generate a unique id using uuidv4', async () => {
      const input = {
          title: 'UUID Test',
          description: 'Checking UUID',
      };

      const createdIssue = await createIssue(input);

      expect(createdIssue.id).toBe('test-uuid'); // Check if the uuid mock is used
  });

  it('should generate a unique key using keyGenerator', async () => {
      const input = {
          title: 'Key Generation Test',
          description: 'Checking key generation',
          issueTypeName: 'Task',
      };

      mockKeyGenerator.generateIssueKey.mockReturnValue('TEST-KEY');
      const createdIssue = await createIssue(input);

      expect(mockKeyGenerator.generateIssueKey).toHaveBeenCalledWith(1, 'Task');
      expect(createdIssue.key).toBe('TEST-KEY');
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentKey: null,
      childIssueKeys: [],
    };

    const dbWithEpic: DbSchema = {
      issues: [epic],
      issueKeyCounter: 1,
    };

    mockLoadDatabase.mockResolvedValue(JSON.parse(JSON.stringify(dbWithEpic)));

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(createdIssue.key).toBe('TASK-2');
    expect(createdIssue.issueType).toBe('Task');
    expect(createdIssue.status).toBe('Todo');
    expect(createdIssue.parentKey).toBe('EPIC-1');

    // Verify the saved database state
    expect(savedDbState!.issueKeyCounter).toBe(2);
    expect(savedDbState!.issues.length).toBe(2);

    const savedTask = savedDbState!.issues.find(issue => issue.key === 'TASK-2') as Task;
    expect(savedTask).toBeDefined();
    expect(savedTask.parentKey).toBe('EPIC-1');
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      parentKey: null,
      childIssueKeys: [],
    };

    const dbWithEpic: DbSchema = {
      issues: [epic],
      issueKeyCounter: 1,
    };

    mockLoadDatabase.mockResolvedValue(JSON.parse(JSON.stringify(dbWithEpic)));

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(createdIssue.key).toBe('STOR-2');
    expect(createdIssue.issueType).toBe('Story');
    expect(createdIssue.status).toBe('Todo');
    expect(createdIssue.parentKey).toBe('EPIC-1');

    // Verify the saved database state
    expect(savedDbState!.issueKeyCounter).toBe(2);
    expect(savedDbState!.issues.length).toBe(2);

    const savedStory = savedDbState!.issues.find(issue => issue.key === 'STOR-2') as Story;
    expect(savedStory).toBeDefined();
    expect(savedStory.parentKey).toBe('EPIC-1');
  });
});
