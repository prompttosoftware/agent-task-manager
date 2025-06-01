import { createIssue } from './issueService';
import { loadDatabase, saveDatabase } from './database/database';
import { DbSchema, Epic, Subtask, Task } from './models'; // Added Task for unrecognized type test
// IssueCreationError is not used in this specific file but kept for consistency with original structure
// If not needed, it can be removed.
import { IssueCreationError } from './utils/errorHandling';

// Mock the database module
jest.mock('./database/database');

// Mock uuid
jest.mock('uuid', () => {
  const mockV4 = jest.fn(() => 'test-uuid');
  return {
    v4: mockV4,
  };
});

const mockLoadDatabaseFunction = loadDatabase as jest.Mock;
const mockSaveDatabaseFunction = saveDatabase as jest.Mock;

describe('issueService - Create Operations - Issue Types', () => {
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

    expect(savedDbState!.issueKeyCounter).toBe(2);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues.find(issue => issue.id === createdIssue.id);
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
    const savedIssue = savedDbState!.issues.find(issue => issue.id === createdIssue.id);
    expect(savedIssue).toBeDefined();

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

    expect(savedDbState!.issueKeyCounter).toBe(2);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues.find(issue => issue.id === createdIssue.id);
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

    const savedIssue = savedDbState!.issues.find(issue => issue.id === createdIssue.id);
    expect(savedIssue).toBeDefined();

    expect(createdIssue.key).toBe('EPIC-1');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.issueType).toBe('Epic');
    expect(createdIssue.status).toBe('Todo');
    expect((createdIssue as Epic).childIssueKeys).toEqual([]);

    expect(createdIssue).toEqual(savedIssue);
  });

  it('should create a Subtask issue with status Todo and correct properties when parentKey is provided', async () => {
    const input = {
      title: 'Subtask Title for IssueType Test',
      description: 'This subtask is for issue type validation.',
      issueTypeName: 'Subtask',
      parentKey: 'EPIC-123', 
    };

    const parentIssue: Epic = {
        id: 'parent-uuid',
        key: 'EPIC-123',
        issueType: 'Epic',
        summary: 'Mock Parent Epic for Subtask Type Test',
        description: 'Parent for subtask type test.',
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
    
    // Verify the created subtask properties
    expect(createdIssue).toBeDefined();
    expect(createdIssue.key).toBe('SUBT-123'); // Based on counter 123
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    expect(createdIssue.issueType).toBe('Subtask');
    expect(createdIssue.status).toBe('Todo'); 
    expect(createdIssue.parentKey).toBe('EPIC-123');

    // Verify the subtask was saved correctly
    const savedSubtask = savedDbState!.issues.find(issue => issue.key === 'SUBT-123');
    expect(savedSubtask).toBeDefined();
    expect(createdIssue).toEqual(savedSubtask);

    // Note: Parent update validation (childIssueKeys, parent updatedAt) is deferred to parentChild.test.ts
  });


  it('should create a Task issue with status Todo when issueTypeName is unrecognized', async () => {
    const input = {
      title: 'Unrecognized Type Test',
      description: 'Should default to Task.',
      issueTypeName: 'UnknownType', // Unrecognized type
    };

    const createdIssue = await createIssue(input as any); 

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(2);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues.find(issue => issue.id === createdIssue.id);
    expect(savedIssue).toBeDefined();

    expect(createdIssue.key).toBe('TASK-1');
    expect(createdIssue.issueType).toBe('Task');
    expect(createdIssue.status).toBe('Todo');
  });
});
