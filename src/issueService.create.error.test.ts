import { createIssue } from './issueService';
import { loadDatabase, saveDatabase } from './database/database';
import { DbSchema } from './models'; // Removed specific issue types, AnyIssue as not directly used for error test properties
import { IssueCreationError } from './utils/errorHandling';

jest.mock('./database/database');

const mockLoadDatabaseFunction = loadDatabase as jest.Mock;
const mockSaveDatabaseFunction = saveDatabase as jest.Mock;

jest.mock('uuid', () => {
  const mockV4 = jest.fn(() => 'test-uuid'); // Not strictly needed for this error test, but consistent setup
  return {
    v4: mockV4,
  };
});

describe('issueService - Create Operations - Error', () => {
  let mockUuidV4: jest.Mock; // Not directly used by this test, but part of setup

  const defaultInitialDb: DbSchema = { // This won't be used directly by the test that sets specific DB state
    issues: [],
    issueKeyCounter: 1,
  };

  let savedDbState: DbSchema | null = null; // Not expected to be populated in error case
  let mockDate: Date; // Not strictly needed for this error test, but consistent setup

  beforeEach(() => {
    mockLoadDatabaseFunction.mockClear();
    mockSaveDatabaseFunction.mockClear();

    const mockedUuid = jest.requireMock('uuid');
    mockUuidV4 = mockedUuid.v4 as jest.Mock;
    mockUuidV4.mockClear();

    savedDbState = null;

    // Default mock for loadDatabase, will be overridden by the test
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

  it('should throw IssueCreationError with code PARENT_NOT_FOUND (404) if parentKey does not exist', async () => {
    const input = {
      title: 'Subtask with Missing Parent',
      description: 'This subtask references a parent that does not exist.',
      issueTypeName: 'Subtask',
      parentKey: 'NON-EXISTENT-123',
    };

    const dbWithoutParent: DbSchema = {
      issues: [],
      issueKeyCounter: 1,
    };

    mockLoadDatabaseFunction.mockResolvedValue(JSON.parse(JSON.stringify(dbWithoutParent)));

    // Using a try-catch to verify properties of the thrown error,
    // as expect(...).rejects.toThrow(IssueCreationError) doesn't easily allow property checks.
    // The number of calls to createIssue needs to be managed if also using .rejects.
    let caughtError: IssueCreationError | null = null;
    try {
      await createIssue(input);
    } catch (error: any) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(IssueCreationError);
    if (caughtError) { // Type guard for TypeScript
        expect(caughtError.code).toBe('PARENT_NOT_FOUND');
        expect(caughtError.httpStatus).toBe(404);
        expect(caughtError.message).toContain('Parent issue with key "NON-EXISTENT-123" not found');
    }


    expect(mockLoadDatabaseFunction).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabaseFunction).not.toHaveBeenCalled();
  });
});
