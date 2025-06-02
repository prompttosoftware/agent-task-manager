import { createIssue } from './issueService';
import { loadDatabase, saveDatabase } from './database/database';
import { DbSchema, Epic, Subtask, Task, Story } from './models'; // Removed Bug, AnyIssue as not directly used here
// IssueCreationError not needed for parent success tests

jest.mock('./database/database');

const mockLoadDatabaseFunction = loadDatabase as jest.Mock;
const mockSaveDatabaseFunction = saveDatabase as jest.Mock;

jest.mock('uuid', () => {
  const mockV4 = jest.fn(() => 'test-uuid');
  return {
    v4: mockV4,
  };
});

describe('issueService - Create Operations - Parent', () => {
  let mockUuidV4: jest.Mock; // Not directly used by these tests, but part of setup

  const defaultInitialDb: DbSchema = { // This won't be used directly by tests that set specific DB states
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

  it('should create a Subtask issue with status Todo and a parentKey if provided', async () => {
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
      issueKeyCounter: 123, // Next new key number will be 123
    };

    mockLoadDatabaseFunction.mockResolvedValue(JSON.parse(JSON.stringify(dbWithParent)));

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(124); // Counter increments
    expect(savedDbState!.issues.length).toBe(2);

    const savedSubtask = savedDbState!.issues.find((issue) => issue.key === 'SUBT-123');
    expect(savedSubtask).toBeDefined();

    expect(createdIssue.key).toBe('SUBT-123');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    expect(createdIssue.issueType).toBe('Subtask');
    expect(createdIssue.status).toBe('Todo');
    expect(createdIssue.parentKey).toBe('EPIC-123');
    expect(createdIssue).toEqual(savedSubtask);

    const savedParentIssue = savedDbState!.issues.find((issue) => issue.key === 'EPIC-123') as Epic;
    expect(savedParentIssue).toBeDefined();
    expect(savedParentIssue.childIssueKeys).toEqual(['SUBT-123']);
    expect(savedParentIssue.updatedAt).toEqual(mockDate.toISOString());
    expect(savedParentIssue.createdAt).toEqual('2023-10-26T09:00:00.000Z');
  });

  it('should create a Task with a parentKey pointing to an existing Epic', async () => {
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
      issueKeyCounter: 1, // Next key number will be 1
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
    expect(createdIssue.createdAt).toEqual(mockDate.toISOString());
    expect(createdIssue.updatedAt).toEqual(mockDate.toISOString());

    expect(savedDbState!.issueKeyCounter).toBe(2);
    expect(savedDbState!.issues.length).toBe(2);

    const savedTask = savedDbState!.issues.find((issue) => issue.key === 'TASK-1') as Task;
    expect(savedTask).toBeDefined();
    expect(savedTask.parentKey).toBe('EPIC-1');
    expect(savedTask.createdAt).toEqual(mockDate.toISOString());
    expect(savedTask.updatedAt).toEqual(mockDate.toISOString());

    const savedEpic = savedDbState!.issues.find((issue) => issue.key === 'EPIC-1') as Epic;
    expect(savedEpic).toBeDefined();
    expect(savedEpic.childIssueKeys).toEqual(['TASK-1']);
    expect(savedEpic.updatedAt).toEqual(mockDate.toISOString());
    expect(savedEpic.createdAt).toEqual('2023-11-01T10:00:00.000Z');
    expect(createdIssue).toEqual(savedTask);
  });

  it('should create a Story with a parentKey pointing to an existing Epic', async () => {
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
      issueKeyCounter: 1, // Next key number will be 1
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

    expect(savedDbState!.issueKeyCounter).toBe(2);
    expect(savedDbState!.issues.length).toBe(2);

    const savedStory = savedDbState!.issues.find((issue) => issue.key === 'STOR-1') as Story;
    expect(savedStory).toBeDefined();
    expect(savedStory.parentKey).toBe('EPIC-1');

    const savedEpic = savedDbState!.issues.find((issue) => issue.key === 'EPIC-1') as Epic;
    expect(savedEpic).toBeDefined();
    expect(savedEpic.childIssueKeys).toEqual(['STOR-1']);
    expect(savedEpic.updatedAt).toEqual(mockDate.toISOString());
    expect(savedEpic.createdAt).toEqual('2023-11-01T11:00:00.000Z');
  });
});
