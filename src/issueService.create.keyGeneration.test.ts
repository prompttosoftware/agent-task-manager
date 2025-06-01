import { createIssue } from './issueService';
// Correct import path for database functions based on issueService.ts
// issueService.ts imports these from './database/database', so the test should mock that module
import { loadDatabase, saveDatabase } from './database/database';
import { DbSchema, Task, Story } from './models';
// IssueCreationError is not used in this specific file but kept for consistency with original structure
// If not needed, it can be removed.
// Correct import path for errorHandling
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

describe('issueService - Create Operations - Key Generation', () => {
  let mockUuidV4: jest.Mock;

  // Note: defaultInitialDb is not explicitly used here as tests override db state.
  // It's good practice to have a default for consistency if other tests were added.
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

    // Default mock for loadDatabase, will be overridden in the specific test
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
          updatedAt: '2023-01-01T10:00:00.000Z', // Use specific ISO strings for existing issues
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
          updatedAt: '2023-01-01T11:00:00.000Z', // Use specific ISO strings for existing issues
          parentKey: null,
        } as Story
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
    expect(createdIssue.issueType).toBe('Task');
    expect(createdIssue.status).toBe('Todo');

    const newSavedIssue = savedDbState!.issues.find(issue => issue.id === createdIssue.id);
    expect(newSavedIssue).toEqual(createdIssue);

    const savedExistingTask = savedDbState!.issues.find(issue => issue.key === 'TASK-8') as Task;
    expect(savedExistingTask).toBeDefined();
    expect(savedExistingTask.summary).toBe('Existing Task 8'); // Verify properties of existing issue
    // Check createdAt/updatedAt of existing issues aren't affected by new issue creation
    // Use hardcoded ISO strings for comparison instead of new Date() affected by mock
    expect(savedExistingTask.createdAt).toEqual('2023-01-01T10:00:00.000Z');
    expect(savedExistingTask.updatedAt).toEqual('2023-01-01T10:00:00.000Z');

    const savedExistingStory = savedDbState!.issues.find(issue => issue.key === 'STOR-9') as Story;
    expect(savedExistingStory).toBeDefined();
    expect(savedExistingStory.summary).toBe('Existing Story 9');
     // Use hardcoded ISO strings for comparison instead of new Date() affected by mock
    expect(savedExistingStory.createdAt).toEqual('2023-01-01T11:00:00.000Z');
    expect(savedExistingStory.updatedAt).toEqual('2023-01-01T11:00:00.000Z');
  });
});
