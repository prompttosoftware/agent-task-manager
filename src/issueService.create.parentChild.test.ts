import { createIssue } from './issueService';
// Correct import path for database functions based on issueService.ts
// issueService.ts imports these from './database/database', so the test should mock that module
import { loadDatabase, saveDatabase } from './database/database';
import { DbSchema, Epic, Task, Story, Subtask } from './models'; // Added Subtask
// IssueCreationError is not used in this specific file but kept for consistency with original structure
// If not needed, it can be removed.
import { IssueCreationError } from './utils/errorHandling';


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
});
