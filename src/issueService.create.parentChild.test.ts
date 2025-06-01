import { createIssue } from './issueService';
// Correct import path for database functions based on issueService.ts
// issueService.ts imports these from './database/database', so the test should mock that module
import { loadDatabase, saveDatabase } from './database/database';
import { DbSchema, Epic, Task, Story, Subtask } from './models'; // Added Subtask
// Import IssueErrorCodes to use PARENT_ISSUE_NOT_FOUND and INVALID_PARENT_TYPE
import { IssueCreationError, IssueErrorCodes } from './utils/errorHandling'; // Corrected import

// Mock the database module, using the correct path that issueService imports from
jest.mock('./database/database');

// Mock uuid
jest.mock('uuid', () => {
  const mockV4 = jest.fn(() => 'test-uuid');
  return {
    v4: mockV4,
  };
});

// Correctly type the mocked functions from the mocked module
const mockLoadDatabaseFunction = loadDatabase as jest.Mock;
const mockSaveDatabaseFunction = saveDatabase as jest.Mock;

describe('issueService - Create Operations - Parent-Child Relationships', () => {
  let mockUuidV4: jest.Mock;

  const defaultInitialDb: DbSchema = {
    issues: [],
    issueKeyCounter: 1,
  };

  let savedDbState: DbSchema | null = null;
  let mockDate: Date;

  beforeEach(() => {
    mockLoadDatabaseFunction.mockClear();
    mockSaveDatabaseFunction.mockClear();

    const mockedUuid = jest.requireMock('uuid');
    mockUuidV4 = mockedUuid.v4 as jest.Mock;
    mockUuidV4.mockClear();

    savedDbState = null;

    // Default mock for loadDatabase, can be overridden in tests
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

  it('should create a Subtask issue, assign parentKey, and update parent\'s childIssueKeys and updatedAt', async () => {
    const input = {
      title: 'Subtask Title',
      description: 'This is a subtask.',
      issueTypeName: 'Subtask',
      parentKey: 'EPIC-123',
    };

    const parentIssue: Epic = {
        id: 'parent-uuid',
        key: 'EPIC-123',
        projectKey: 'PROJ', // Added projectKey
        issueType: 'Epic',
        summary: 'Mock Parent Epic',
        description: 'This is a mock parent issue for subtask testing.',
        status: 'Todo',
        createdAt: '2023-10-26T09:00:00.000Z',
        updatedAt: '2023-10-26T09:00:00.000Z',
        parentKey: null,
        childIssueKeys: [],
    };

    const dbWithParent: DbSchema = {
        issues: [parentIssue],
        issueKeyCounter: 123,
    };

    mockLoadDatabaseFunction.mockResolvedValue(JSON.parse(JSON.stringify(dbWithParent)));

    const createdIssue = await createIssue(input) as Subtask;

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(124);
    expect(savedDbState!.issues.length).toBe(2);

    const savedSubtask = savedDbState!.issues.find(issue => issue.key === 'SUBT-123');
    expect(savedSubtask).toBeDefined();

    expect(createdIssue.key).toBe('SUBT-123');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.issueType).toBe('Subtask');
    expect(createdIssue.status).toBe('Todo');
    expect(createdIssue.parentKey).toBe('EPIC-123');
    expect(createdIssue).toEqual(savedSubtask);

    const savedParentIssue = savedDbState!.issues.find(issue => issue.key === 'EPIC-123') as Epic;
    expect(savedParentIssue).toBeDefined();
    expect(savedParentIssue.childIssueKeys).toEqual(['SUBT-123']);
    expect(savedParentIssue.updatedAt).toEqual(mockDate.toISOString());
    // Compare against hardcoded ISO string, not new Date() which uses mocked date
    expect(savedParentIssue.createdAt).toEqual('2023-10-26T09:00:00.000Z'); // createdAt should not change
  });

  it('should create a Task with a parentKey pointing to an existing Epic and update parent', async () => {
    const input = {
      title: 'Task with Epic Parent',
      description: 'This task has an Epic parent.',
      issueTypeName: 'Task',
      parentKey: 'EPIC-1',
    };

    const epic: Epic = {
      id: 'epic-uuid',
      key: 'EPIC-1',
      projectKey: 'PROJ', // Added projectKey
      issueType: 'Epic',
      summary: 'Existing Epic',
      description: 'Epic description',
      status: 'Todo',
      createdAt: '2023-11-01T10:00:00.000Z',
      updatedAt: '2023-11-01T10:00:00.000Z',
      parentKey: null,
      childIssueKeys: [],
    };

    const dbWithEpic: DbSchema = {
      issues: [epic],
      issueKeyCounter: 1, // Next key will be TASK-1
    };
    mockLoadDatabaseFunction.mockResolvedValue(JSON.parse(JSON.stringify(dbWithEpic)));

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(createdIssue.key).toBe('TASK-1'); // Uses counter 1
    expect(createdIssue.issueType).toBe('Task');
    expect(createdIssue.parentKey).toBe('EPIC-1');

    expect(savedDbState!.issueKeyCounter).toBe(2); // Incremented from 1
    expect(savedDbState!.issues.length).toBe(2);

    const savedTask = savedDbState!.issues.find(issue => issue.key === 'TASK-1') as Task;
    expect(savedTask).toBeDefined();
    expect(savedTask.parentKey).toBe('EPIC-1');

    const savedEpic = savedDbState!.issues.find(issue => issue.key === 'EPIC-1') as Epic;
    expect(savedEpic).toBeDefined();
    expect(savedEpic.childIssueKeys).toEqual(['TASK-1']);
    expect(savedEpic.updatedAt).toEqual(mockDate.toISOString());
    // Ensure parent createdAt does not change
    expect(savedEpic.createdAt).toEqual('2023-11-01T10:00:00.000Z');
  });

  it('should create a Story with a parentKey pointing to an existing Epic and update parent', async () => {
    const input = {
      title: 'Story with Epic Parent',
      description: 'This story has an Epic parent.',
      issueTypeName: 'Story',
      parentKey: 'EPIC-1',
    };

    const epic: Epic = {
      id: 'epic-uuid',
      key: 'EPIC-1',
      projectKey: 'PROJ', // Added projectKey
      issueType: 'Epic',
      summary: 'Existing Epic',
      description: 'Epic description',
      status: 'Todo',
      createdAt: '2023-11-01T11:00:00.000Z',
      updatedAt: '2023-11-01T11:00:00.000Z',
      parentKey: null,
      childIssueKeys: [],
    };

    const dbWithEpic: DbSchema = {
      issues: [epic],
      issueKeyCounter: 1, // Next key will be STOR-1
    };
    mockLoadDatabaseFunction.mockResolvedValue(JSON.parse(JSON.stringify(dbWithEpic)));

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(createdIssue.key).toBe('STOR-1'); // Uses counter 1
    expect(createdIssue.issueType).toBe('Story');
    expect(createdIssue.parentKey).toBe('EPIC-1');

    expect(savedDbState!.issueKeyCounter).toBe(2); // Incremented from 1
    expect(savedDbState!.issues.length).toBe(2);

    const savedStory = savedDbState!.issues.find(issue => issue.key === 'STOR-1') as Story;
    expect(savedStory).toBeDefined();
    expect(savedStory.parentKey).toBe('EPIC-1');

    const savedEpic = savedDbState!.issues.find(issue => issue.key === 'EPIC-1') as Epic;
    expect(savedEpic).toBeDefined();
    expect(savedEpic.childIssueKeys).toEqual(['STOR-1']);
    expect(savedEpic.updatedAt).toEqual(mockDate.toISOString());
     // Ensure parent createdAt does not change
    expect(savedEpic.createdAt).toEqual('2023-11-01T11:00:00.000Z');
  });

  it('should throw PARENT_ISSUE_NOT_FOUND error if the parentKey does not exist', async () => { // Updated test description
    const input = {
      title: 'Issue with Missing Parent',
      description: 'This issue points to a parent that does not exist.',
      issueTypeName: 'Task',
      parentKey: 'MISSING-123',
    };

    // Mock database to contain no issues
    mockLoadDatabaseFunction.mockResolvedValue(JSON.parse(JSON.stringify(defaultInitialDb)));

    // Use IssueErrorCodes.PARENT_ISSUE_NOT_FOUND
    await expect(createIssue(input)).rejects.toThrow(expect.objectContaining({
      errorCode: IssueErrorCodes.PARENT_ISSUE_NOT_FOUND, // Expect the correct error code constant
      message: expect.stringContaining('Parent issue with key'), // Added message check for robustness
    }));

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    // Expect saveDatabase NOT to have been called because an error occurred
    expect(mockSaveDatabaseFunction).not.toHaveBeenCalled();
    // Ensure database state remains unchanged
    expect(savedDbState).toBeNull();
  });

  it('should throw INVALID_PARENT_TYPE error if the parent type is invalid for the child issue type', async () => {
    const input = {
      title: 'Subtask with Invalid Parent Type',
      description: 'This subtask attempts to link to an invalid parent type.',
      issueTypeName: 'Subtask',
      // Change parentKey to point to a Task, which is currently an invalid parent for Subtasks
      parentKey: 'TASK-456',
    };

    // Mock database to contain a Task parent (which is invalid for Subtask according to current logic)
    const invalidParent: Task = { // Changed type to Task
      id: 'task-uuid',
      key: 'TASK-456', // Changed key
      projectKey: 'PROJ',
      issueType: 'Task', // Changed type
      summary: 'Invalid Parent Task', // Changed summary
      description: 'This task should not be a parent of a subtask in this test context.',
      status: 'Todo',
      createdAt: '2023-11-01T12:00:00.000Z',
      updatedAt: '2023-11-01T12:00:00.000Z',
      parentKey: null,
      // Task type does not have childIssueKeys
    };

    // Mock database to contain only the invalid parent
    const dbWithInvalidParent: DbSchema = {
      issues: [invalidParent],
      issueKeyCounter: 456, // Counter doesn't matter for this test, but keep it reasonable
    };
    // FIX: Removed the extra JSON.parse around JSON.stringify
    mockLoadDatabaseFunction.mockResolvedValue(JSON.parse(JSON.stringify(dbWithInvalidParent)));

    // Use IssueErrorCodes.INVALID_PARENT_TYPE
    await expect(createIssue(input)).rejects.toThrow(expect.objectContaining({
      errorCode: IssueErrorCodes.INVALID_PARENT_TYPE, // Correct error code reference
      message: expect.stringContaining('cannot be a parent of a Subtask'), // Added message check reflecting the specific error message
    }));

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    // Expect saveDatabase NOT to have been called because an error occurred
    expect(mockSaveDatabaseFunction).not.toHaveBeenCalled();
    // Ensure database state remains unchanged
    expect(savedDbState).toBeNull();
  });
});
