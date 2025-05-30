import { createIssue } from './issueService';
import { loadDatabase, saveDatabase } from './dataStore';
import { DbSchema } from './models';
// IssueCreationError might not be strictly needed here if we only test generic errors,
// but it's good practice to have common imports if related functionalities are tested.
// For now, it's not used directly in these specific tests.
// import { IssueCreationError } from './utils/errorHandling';

// Mock the dataStore module to control database interactions
jest.mock('./dataStore');

const mockLoadDatabase = loadDatabase as jest.Mock;
const mockSaveDatabase = saveDatabase as jest.Mock;

describe('issueService - Error Handling', () => {
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
    savedDbState = null;

    // Mock loadDatabase to return a copy of the initial state
    mockLoadDatabase.mockResolvedValue(JSON.parse(JSON.stringify(initialDb))); // Deep copy to avoid mutation issues

    // Mock saveDatabase to capture the state it was called with
    mockSaveDatabase.mockImplementation(async (db: DbSchema) => {
      savedDbState = db; // Capture the state
      return Promise.resolve();
    });

    // Mock Date to get predictable timestamps
    mockDate = new Date('2023-10-27T10:00:00.000Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  });

  afterEach(() => {
    // Restore Date mock
    jest.restoreAllMocks();
  });

  it('should throw an error if database loading fails', async () => {
    const mockError = new Error('Failed to load database');
    mockLoadDatabase.mockRejectedValue(mockError);

    const input = {
      title: 'Issue to Fail Load',
      description: '...',
    };

    // Service now wraps this in a generic Error
    await expect(createIssue(input)).rejects.toThrow('Failed to create issue due to an unexpected error.');

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).not.toHaveBeenCalled(); // Save should not be called if load fails
  });

  it('should throw an error if database saving fails', async () => {
    const mockError = new Error('Failed to save database');
    mockSaveDatabase.mockRejectedValue(mockError);

    const input = {
      title: 'Issue to Fail Save',
      description: '...',
    };

    // Service now wraps this in a generic Error
    await expect(createIssue(input)).rejects.toThrow('Failed to create issue due to an unexpected error.');

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1); // Save should be attempted
  });
});
