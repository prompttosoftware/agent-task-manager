import { createIssue } from './issueService';
import { loadDatabase, saveDatabase } from './database/database';
import { DbSchema, Task } from './models';
// IssueCreationError is not used in this specific file but kept for consistency with original structure
// If not needed, it can be removed.
import { IssueCreationError } from './utils/errorHandling';

// Mock the database module to control database interactions
jest.mock('./database/database');

// Mock uuid
jest.mock('uuid', () => {
  const mockV4 = jest.fn(() => 'test-uuid'); // Default mock behavior
  return {
    v4: mockV4,
  };
});

const mockLoadDatabaseFunction = loadDatabase as jest.Mock;
const mockSaveDatabaseFunction = saveDatabase as jest.Mock;

describe('issueService - Create Operations - Default Behavior', () => {
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
    mockUuidV4.mockClear(); // Clear any previous calls, e.g., from other test files if run in same suite without --runInBand

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
    const savedIssue = savedDbState!.issues.find(issue => issue.id === createdIssue.id);
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
});
