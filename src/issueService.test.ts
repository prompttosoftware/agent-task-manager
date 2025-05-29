import { createIssue } from './issueService';
import { loadDatabase, saveDatabase } from './dataStore';
import { DbSchema, AnyIssue } from './models'; // Assuming AnyIssue and DbSchema are exported from models

// Mock the dataStore module to control database interactions
jest.mock('./dataStore');

const mockLoadDatabase = loadDatabase as jest.Mock;
const mockSaveDatabase = saveDatabase as jest.Mock;

describe('issueService', () => {
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

  it('should create an issue with default status and properties', async () => {
    const input = {
      title: 'Test Issue Title',
      description: 'This is a test description.',
    };

    const createdIssue = await createIssue(input);

    // Verify database interactions
    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull(); // Ensure saveDatabase was called

    // Verify the saved database state
    expect(savedDbState!.issueKeyCounter).toBe(1);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0];

    // Verify the returned issue object
    expect(createdIssue).toBeDefined();
    expect(createdIssue.key).toBe('ISSUE-1');
    expect(createdIssue.title).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    expect(createdIssue.status).toBe('Open'); // Default status
    expect(createdIssue.createdAt).toEqual(mockDate);
    expect(createdIssue.updatedAt).toEqual(mockDate);
    expect(createdIssue.parentKey).toBeUndefined(); // Should not have parentKey

    // Verify the returned object matches the saved object (reference might differ, but properties should match)
    expect(createdIssue).toEqual(savedIssue);
  });

  it('should create an issue with status Backlog when issueTypeName is feature', async () => {
    const input = {
      title: 'Feature Title',
      description: 'This is a feature request.',
      issueTypeName: 'feature',
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(1);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0];

    expect(createdIssue.key).toBe('ISSUE-1');
    expect(createdIssue.status).toBe('Backlog'); // Status should be Backlog

    expect(createdIssue).toEqual(savedIssue);
  });

  it('should create an issue with status Open when issueTypeName is bug', async () => {
    const input = {
      title: 'Bug Title',
      description: 'This is a bug report.',
      issueTypeName: 'bug',
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(1);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0];

    expect(createdIssue.key).toBe('ISSUE-1');
    expect(createdIssue.status).toBe('Open'); // Status should be Open (explicitly set for bug)

    expect(createdIssue).toEqual(savedIssue);
  });

  it('should create an issue with a parentKey if provided', async () => {
    const input = {
      title: 'Subtask Title',
      description: 'This is a subtask.',
      parentKey: 'EPIC-123',
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(1);
    expect(savedDbState!.issues.length).toBe(1);
    const savedIssue = savedDbState!.issues[0];

    expect(createdIssue.key).toBe('ISSUE-1');
    expect(createdIssue.title).toBe(input.title);
    expect(createdIssue.description).toBe(input.description);
    expect(createdIssue.parentKey).toBe('EPIC-123'); // Parent key should be present

    expect(createdIssue).toEqual(savedIssue);
  });

  it('should generate the next key correctly when counter is not zero', async () => {
    const dbWithExistingIssues: DbSchema = {
      issues: [
        // Mock existing issues
        {
          key: 'ISSUE-10',
          title: 'Existing Issue',
          description: '...',
          status: 'Done',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          id: 'uuid1', issueType: 'Task', summary: '...',
        },
      ],
      issueKeyCounter: 10, // Start counter from 10
    };

    mockLoadDatabase.mockResolvedValue(JSON.parse(JSON.stringify(dbWithExistingIssues)));

    const input = {
      title: 'New Issue After 10',
      description: '...',
    };

    const createdIssue = await createIssue(input);

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(savedDbState).not.toBeNull();

    expect(savedDbState!.issueKeyCounter).toBe(11); // Counter should be 11
    expect(savedDbState!.issues.length).toBe(2); // Should contain both issues
    expect(createdIssue.key).toBe('ISSUE-11'); // New key should be ISSUE-11

    // Check the newly added issue in saved state
    const newSavedIssue = savedDbState!.issues.find(issue => issue.key === 'ISSUE-11');
    expect(newSavedIssue).toBeDefined();
    expect(newSavedIssue!.title).toBe(input.title);
    expect(newSavedIssue!.description).toBe(input.description);

    expect(createdIssue).toEqual(newSavedIssue);
  });

  it('should throw an error if database loading fails', async () => {
    const mockError = new Error('Failed to load database');
    mockLoadDatabase.mockRejectedValue(mockError);

    const input = {
      title: 'Issue to Fail',
      description: '...',
    };

    await expect(createIssue(input)).rejects.toThrow('Failed to create issue due to a data storage error.');

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

    await expect(createIssue(input)).rejects.toThrow('Failed to create issue due to a data storage error.');

    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1); // Save should be attempted
  });

  it('should include createdAt and updatedAt timestamps', async () => {
    const input = {
      title: 'Timestamp Test',
      description: 'Checking timestamps',
    };

    const createdIssue = await createIssue(input);

    expect(createdIssue.createdAt).toEqual(mockDate);
    expect(createdIssue.updatedAt).toEqual(mockDate);

    // Check saved state too
    expect(savedDbState).not.toBeNull();
    const savedIssue = savedDbState!.issues[0];
    expect(savedIssue.createdAt).toEqual(mockDate);
    expect(savedIssue.updatedAt).toEqual(mockDate);
  });
});
