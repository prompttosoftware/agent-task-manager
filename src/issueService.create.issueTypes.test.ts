import { createIssue } from './issueService';
import { loadDatabase, saveDatabase } from './database/database';
import { DbSchema, AnyIssue, Epic } from './models'; // Import Epic for type casting
import { IssueCreationError } from './utils/errorHandling';

// Mock the database module to control database interactions
jest.mock('./database/database');

jest.mock('uuid', () => {
  const mockV4 = jest.fn(() => 'test-uuid');
  return {
    v4: mockV4,
  };
});

const mockLoadDatabaseFunction = loadDatabase as jest.Mock;
const mockSaveDatabaseFunction = saveDatabase as jest.Mock;

// This initialDb is the default state returned by mockLoadDatabase
const defaultInitialDb: DbSchema = {
  issues: [],
  issueKeyCounter: 1,
};

let savedDbState: DbSchema | null = null;
let mockDate: Date;
let mockUuidV4: jest.Mock;

beforeEach(() => {
  mockLoadDatabaseFunction.mockClear();
  mockSaveDatabaseFunction.mockClear();

  const mockedUuid = jest.requireMock('uuid');
  mockUuidV4 = mockedUuid.v4 as jest.Mock;
  mockUuidV4.mockClear();

  savedDbState = null;

  // Corrected deep copy: Use only one JSON.parse
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

describe('issueService - Create Operations - Issue Types', () => {
  it('should create a Story issue with status Todo when issueTypeName is feature', async () => {
    const input = {
      title: 'Feature Title',
      description: 'This is a feature request.',
      issueTypeName: 'feature', // Test 'feature' alias
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0]; // Only one issue

    expect(createdIssue.key).toBe('STOR-1');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    expect(createdIssue.issueType).toBe('Story'); // Should map 'feature' to 'Story'
    expect(createdIssue.status).toBe('Todo'); // Stories should start as Todo
    expect(createdIssue.createdAt).toEqual(mockDate.toISOString());
    expect(createdIssue.updatedAt).toEqual(mockDate.toISOString());
    expect(createdIssue.parentKey).toBeNull(); // Default null
    expect(createdIssue).toEqual(savedIssue);
  });

  it('should create a Story issue with status Todo when issueTypeName is Story', async () => {
    const input = {
      title: 'Story Title',
      description: 'This is a story.',
      issueTypeName: 'Story', // Test 'Story'
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0];

    expect(createdIssue.key).toBe('STOR-1');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    expect(createdIssue.issueType).toBe('Story');
    expect(createdIssue.status).toBe('Todo'); // Stories should start as Todo
    expect(createdIssue.createdAt).toEqual(mockDate.toISOString());
    expect(createdIssue.updatedAt).toEqual(mockDate.toISOString());
    expect(createdIssue.parentKey).toBeNull();
    expect(createdIssue).toEqual(savedIssue);
  });

  it('should create a Bug issue with status In Progress when issueTypeName is bug', async () => {
    const input = {
      title: 'Bug Title',
      description: 'This is a bug report.',
      issueTypeName: 'bug', // Test 'bug' (lowercase)
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0];

    expect(createdIssue.key).toBe('BUG-1');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    expect(createdIssue.issueType).toBe('Bug');
    expect(createdIssue.status).toBe('In Progress'); // Bugs should start as In Progress
    expect(createdIssue.createdAt).toEqual(mockDate.toISOString());
    expect(createdIssue.updatedAt).toEqual(mockDate.toISOString());
    expect(createdIssue.parentKey).toBeNull();
    expect(createdIssue).toEqual(savedIssue);
  });

  it('should create an Epic issue with status Todo and empty childIssueKeys', async () => {
    const input = {
      title: 'Epic Title',
      description: 'This is an epic.',
      issueTypeName: 'Epic', // Test 'Epic'
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0] as Epic; // Cast to Epic for childIssueKeys check

    expect(createdIssue.key).toBe('EPIC-1');
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    expect(createdIssue.issueType).toBe('Epic');
    expect(createdIssue.status).toBe('Todo'); // Epics should start as Todo
    expect(createdIssue.createdAt).toEqual(mockDate.toISOString());
    expect(createdIssue.updatedAt).toEqual(mockDate.toISOString());
    expect(createdIssue.parentKey).toBeNull(); // Epics don't have parents in this model
    expect((createdIssue as Epic).childIssueKeys).toEqual([]); // Epics should have an empty childIssueKeys array
    expect(createdIssue).toEqual(savedIssue); // Check that the returned object matches the saved one, including childIssueKeys
  });

  it('should create a Task issue with status Todo when issueTypeName is unrecognized', async () => {
    const input = {
      title: 'Unrecognized Type Test',
      description: 'Should default to Task.',
      issueTypeName: 'UnknownType', // Test unrecognized type
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0];

    expect(createdIssue.key).toBe('TASK-1'); // Should use Task prefix
    expect(createdIssue.summary).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    expect(createdIssue.issueType).toBe('Task'); // Should default to Task
    expect(createdIssue.status).toBe('Todo'); // Tasks should start as Todo
    expect(createdIssue.createdAt).toEqual(mockDate.toISOString());
    expect(createdIssue.updatedAt).toEqual(mockDate.toISOString());
    expect(createdIssue.parentKey).toBeNull();
    expect(createdIssue).toEqual(savedIssue);
  });
});
