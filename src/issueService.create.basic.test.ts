import { createIssue } from './issueService';
import { loadDatabase, saveDatabase } from './database/database';
import { DbSchema, Task, Story, Bug, Epic } from './models'; // Removed Subtask, AnyIssue as not directly used here
// IssueCreationError not needed for basic tests

jest.mock('./database/database');

const mockLoadDatabaseFunction = loadDatabase as jest.Mock;
const mockSaveDatabaseFunction = saveDatabase as jest.Mock;

jest.mock('uuid', () => {
  const mockV4 = jest.fn(() => 'test-uuid');
  return {
    v4: mockV4,
  };
});

describe('issueService - Create Operations - Basic', () => {
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

  it('should create a Task issue with default status Todo and properties', async () => {
    const input = {
      title: 'Test Issue Title',
      description: 'This is a test description.',
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(2);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues.find((issue) => issue.id === createdIssue.id);
    expect(savedIssue).toBeDefined();

    expect(createdIssue).toBeDefined();
    expect(createdIssue.key).toBe('TASK-1');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    expect(createdIssue.status).toBe('Todo');
    expect(createdIssue.issueType).toBe('Task');
    expect(createdIssue.createdAt).toEqual(mockDate.toISOString());
    expect(createdIssue.updatedAt).toEqual(mockDate.toISOString());
    expect(createdIssue.parentKey).toBeNull();
    expect(createdIssue).toEqual(savedIssue);
  });

  it('should create a Story issue with status Todo when issueTypeName is feature', async () => {
    const input = {
      title: 'Feature Title',
      description: 'This is a feature request.',
      issueTypeName: 'feature',
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(2);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues.find((issue) => issue.id === createdIssue.id);
    expect(savedIssue).toBeDefined();

    expect(createdIssue.key).toBe('STOR-1');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.issueType).toBe('Story');
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

    expect(savedDbState!.issueKeyCounter).toBe(2);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues.find((issue) => issue.id === createdIssue.id);
    expect(savedIssue).toBeDefined();

    expect(createdIssue.key).toBe('STOR-1');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.issueType).toBe('Story');
    expect(createdIssue.status).toBe('Todo');
    expect(createdIssue).toEqual(savedIssue); // Added missing assertion for completeness
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

    expect(savedDbState!.issueKeyCounter).toBe(2);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues.find((issue) => issue.id === createdIssue.id);
    expect(savedIssue).toBeDefined();

    expect(createdIssue.key).toBe('BUG-1');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.issueType).toBe('Bug');
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

    expect(savedDbState!.issueKeyCounter).toBe(2);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues.find((issue) => issue.id === createdIssue.id);
    expect(savedIssue).toBeDefined();

    expect(createdIssue.key).toBe('EPIC-1');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.issueType).toBe('Epic');
    expect(createdIssue.status).toBe('Todo');
    expect((createdIssue as Epic).childIssueKeys).toEqual([]);
    expect(createdIssue).toEqual(savedIssue);
  });

  it('should create a Task issue with status Todo when issueTypeName is unrecognized', async () => {
    const input = {
      title: 'Unrecognized Type Test',
      description: 'Should default to Task.',
      issueTypeName: 'UnknownType',
    };

    const createdIssue = await createIssue(input as any);

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(2);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues.find((issue) => issue.id === createdIssue.id);
    expect(savedIssue).toBeDefined();

    expect(createdIssue.key).toBe('TASK-1'); // Defaults to Task key format
    expect(createdIssue.issueType).toBe('Task');
    expect(createdIssue.status).toBe('Todo');
    expect(createdIssue).toEqual(savedIssue); // Added missing assertion for completeness
  });

  it('should generate the next key correctly when counter is not zero', async () => {
    const dbWithExistingIssues: DbSchema = {
      issues: [
        {
          id: 'uuid1',
          key: 'TASK-8',
          issueType: 'Task',
          summary: 'Existing Task 8',
          description: '...',
          status: 'Done',
          createdAt: '2023-01-01T10:00:00.000Z',
          updatedAt: '2023-01-01T10:00:00.000Z',
          parentKey: null,
        } as Task,
        {
          id: 'uuid2',
          key: 'STOR-9',
          issueType: 'Story',
          summary: 'Existing Story 9',
          description: '...',
          status: 'Todo',
          createdAt: '2023-01-01T11:00:00.000Z',
          updatedAt: '2023-01-01T11:00:00.000Z',
          parentKey: null,
        } as Story,
      ],
      issueKeyCounter: 10,
    };

    mockLoadDatabaseFunction.mockResolvedValue(JSON.parse(JSON.stringify(dbWithExistingIssues)));

    const input = {
      title: 'New Issue After 9',
      description: '...',
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(11);
    expect(savedDbState!.issues.length).toBe(3);

    expect(createdIssue).toBeDefined();
    expect(createdIssue.key).toBe('TASK-10');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    expect(createdIssue.issueType).toBe('Task');
    expect(createdIssue.status).toBe('Todo');
    expect(createdIssue.createdAt).toEqual(mockDate.toISOString());
    expect(createdIssue.updatedAt).toEqual(mockDate.toISOString());
    expect(createdIssue.parentKey).toBeNull();

    const newSavedIssue = savedDbState!.issues.find((issue) => issue.id === createdIssue.id);
    expect(newSavedIssue).toEqual(createdIssue);

    const savedExistingTask = savedDbState!.issues.find((issue) => issue.key === 'TASK-8') as Task;
    expect(savedExistingTask.createdAt).toEqual('2023-01-01T10:00:00.000Z');
    expect(savedExistingTask.updatedAt).toEqual('2023-01-01T10:00:00.000Z');

    const savedExistingStory = savedDbState!.issues.find((issue) => issue.key === 'STOR-9') as Story;
    expect(savedExistingStory.createdAt).toEqual('2023-01-01T11:00:00.000Z');
    expect(savedExistingStory.updatedAt).toEqual('2023-01-01T11:00:00.000Z');
  });

  it('should include createdAt and updatedAt timestamps as ISO strings', async () => {
    const input = {
      title: 'Timestamp Test',
      description: 'Checking timestamps',
    };

    const createdIssue = await createIssue(input);

    expect(createdIssue.key).toBe('TASK-1');
    expect(createdIssue.createdAt).toEqual(mockDate.toISOString());
    expect(createdIssue.updatedAt).toEqual(mockDate.toISOString());

    expect(savedDbState).not.toBeNull();
    expect(savedDbState!.issueKeyCounter).toBe(2);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0];
    expect(savedIssue.createdAt).toEqual(mockDate.toISOString());
    expect(savedIssue.updatedAt).toEqual(mockDate.toISOString());
  });

  it('should generate a unique id using uuidv4', async () => {
    const input = {
      title: 'UUID Test',
      description: 'Checking UUID',
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(createdIssue.id).toBe('test-uuid');
    expect(mockUuidV4).toHaveBeenCalledTimes(1);

    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues.find((issue) => issue.id === 'test-uuid');
    expect(savedIssue).toBeDefined();
    expect(savedIssue!.id).toBe('test-uuid');
    expect(createdIssue).toEqual(savedIssue);
  });
});
