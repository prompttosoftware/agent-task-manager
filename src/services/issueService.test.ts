import { createIssue, IssueCreationData } from './issueService';
import { loadDatabase, saveDatabase } from '../db/persistence';
import { generateIssueKey } from '../utils/issueKeyGenerator';
import { v4 as uuidv4 } from 'uuid';

// Mock the external modules
jest.mock('../db/persistence');
jest.mock('../utils/issueKeyGenerator');
jest.mock('uuid');

// Cast mocked functions for TypeScript
const mockLoadDatabase = loadDatabase as jest.Mock;
const mockSaveDatabase = saveDatabase as jest.Mock;
const mockGenerateIssueKey = generateIssueKey as jest.Mock;
const mockUuidv4 = uuidv4 as jest.Mock;

describe('issueService', () => {
  // Define common mock data
  const mockInitialDbState = { issues: [], issueKeyCounter: 5 };
  const mockGeneratedKey = 'TEST-6';
  const mockGeneratedUuid = 'mocked-uuid-123';

  // Set up mocks before each test
  beforeEach(() => {
    // Mock loadDatabase to return a specific initial state
    mockLoadDatabase.mockResolvedValue(mockInitialDbState);

    // Mock saveDatabase to be a spy function
    mockSaveDatabase.mockResolvedValue(undefined); // saveDatabase is async but doesn't return anything

    // Mock generateIssueKey to return a predictable key
    mockGenerateIssueKey.mockReturnValue(mockGeneratedKey);

    // Mock uuidv4 to return a predictable UUID
    mockUuidv4.mockReturnValue(mockGeneratedUuid);

    // Optionally mock Date if exact timestamps need verification,
    // but checking for presence and type is often sufficient.
    // For now, we just check if they are strings.
  });

  // Clean up mocks after each test
  afterEach(() => {
    // Clear all mocks to ensure a clean state for each test
    jest.clearAllMocks();
  });

  const issueCreationData: IssueCreationData = {
    projectKey: 'TEST',
    issueTypeId: 'some-issue-type-id',
    summary: 'This is a test issue',
    description: 'Detailed description of the test issue',
  };

  const expectedIssueKeyCounterAfterSave = mockInitialDbState.issueKeyCounter + 1;

  // Test case 1 & 3: createIssue successfully creates and returns an issue with correct fields
  test('should successfully create and return an issue with correct fields', async () => {
    const createdIssue = await createIssue(issueCreationData);

    // Expect the returned object to match the structure created in the service
    expect(createdIssue).toBeDefined();
    expect(createdIssue.id).toBe(mockGeneratedUuid);
    expect(createdIssue.key).toBe(mockGeneratedKey);
    expect(createdIssue.self).toBe(`/rest/api/2/issue/${mockGeneratedKey}`);

    // Check fields property and its contents
    expect(createdIssue.fields).toBeDefined();
    expect(createdIssue.fields.summary).toBe(issueCreationData.summary);
    expect(createdIssue.fields.description).toBe(issueCreationData.description);
    expect(createdIssue.fields.project).toEqual({ key: issueCreationData.projectKey });
    expect(createdIssue.fields.issuetype).toEqual({ id: issueCreationData.issueTypeId });

    // Check presence and type of timestamps
    expect(typeof createdIssue.fields.created).toBe('string');
    expect(typeof createdIssue.fields.updated).toBe('string');
  });

  // Test case 2: The issue key is generated correctly using generateIssueKey
  test('should generate the issue key using generateIssueKey with correct arguments', async () => {
    await createIssue(issueCreationData);

    // Verify generateIssueKey was called exactly once
    expect(mockGenerateIssueKey).toHaveBeenCalledTimes(1);

    // Verify generateIssueKey was called with the correct issue type ID and the incremented counter
    expect(mockGenerateIssueKey).toHaveBeenCalledWith(
      issueCreationData.issueTypeId,
      expectedIssueKeyCounterAfterSave // The counter is incremented BEFORE key generation
    );

    // The resulting key is checked in Test 1 (createdIssue.key)
  });

  // Test case 4: The created issue has the correct default status
  test('should create issue with the correct default status', async () => {
    const createdIssue = await createIssue(issueCreationData);

    expect(createdIssue.fields).toHaveProperty('status');
    expect(createdIssue.fields.status).toEqual({ id: '1', name: 'To Do' });
  });

  // Test case 5: Database loading and saving are correctly used
  test('should load and save the database with the new issue added and counter incremented', async () => {
    await createIssue(issueCreationData);

    // Verify loadDatabase was called exactly once
    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockLoadDatabase).toHaveBeenCalledWith(); // loadDatabase is called with no arguments

    // Verify saveDatabase was called exactly once
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);

    // Verify saveDatabase was called with the correct updated database state
    // The state should be the initial state with the new issue added to the issues array
    // and the issueKeyCounter incremented.
    const expectedDbStateAfterSave = {
      issues: [
        // The expected issue object structure should match what createIssue constructs
        {
          id: mockGeneratedUuid,
          key: mockGeneratedKey,
          self: `/rest/api/2/issue/${mockGeneratedKey}`,
          fields: {
            project: { key: issueCreationData.projectKey },
            issuetype: { id: issueCreationData.issueTypeId },
            summary: issueCreationData.summary,
            description: issueCreationData.description,
            status: { id: '1', name: 'To Do' },
            // Use expect.any(String) for timestamps as their exact values depend on execution time
            created: expect.any(String),
            updated: expect.any(String),
          }
        }
      ],
      issueKeyCounter: expectedIssueKeyCounterAfterSave,
    };

    // Use toEqual for deep comparison of the object passed to saveDatabase
    expect(mockSaveDatabase).toHaveBeenCalledWith(expectedDbStateAfterSave);
  });

  // Additional test: handle issue creation data without description
  test('should correctly create issue when description is not provided', async () => {
    const issueCreationDataWithoutDesc: IssueCreationData = {
      projectKey: 'ANOTHER',
      issueTypeId: 'bug',
      summary: 'A bug without a description',
    };

    // Reset mocks for this test if specific mock behavior is needed, otherwise defaults apply
    // The common mocks set in beforeEach are sufficient here.

    const createdIssue = await createIssue(issueCreationDataWithoutDesc);

    expect(createdIssue).toBeDefined();
    expect(createdIssue.fields.summary).toBe(issueCreationDataWithoutDesc.summary);
    expect(createdIssue.fields.project.key).toBe(issueCreationDataWithoutDesc.projectKey);
    expect(createdIssue.fields.issuetype.id).toBe(issueCreationDataWithoutDesc.issueTypeId);
    expect(createdIssue.fields.status).toEqual({ id: '1', name: 'To Do' });

    // Verify description is undefined or absent in the created issue fields
    expect(createdIssue.fields).not.toHaveProperty('description', expect.any(String));
    expect(createdIssue.fields.description).toBeUndefined();


    // Check the database state saved reflects the issue without description
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    const savedDbState = mockSaveDatabase.mock.calls[0][0];

    expect(savedDbState.issues.length).toBe(1);
    const savedIssue = savedDbState.issues[0];

    expect(savedIssue.fields.summary).toBe(issueCreationDataWithoutDesc.summary);
    expect(savedIssue.fields).not.toHaveProperty('description', expect.any(String));
    expect(savedIssue.fields.description).toBeUndefined(); // Ensure it's explicitly undefined or omitted

    expect(savedDbState.issueKeyCounter).toBe(expectedIssueKeyCounterAfterSave); // Counter still increments
  });

  // Test case 7: parentKey is correctly stored when provided
  test('should correctly store the parentKey when provided in issue creation data', async () => {
    const parentKey = 'PARENT-123';
    const issueCreationDataWithParent: IssueCreationData = {
      ...issueCreationData,
      parentKey: parentKey,
    };

    const createdIssue = await createIssue(issueCreationDataWithParent);

    expect(createdIssue).toBeDefined();
    expect(createdIssue).toHaveProperty('parentIssueKey', parentKey);

    // Verify that the parentKey is stored in the database.
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    const savedDbState = mockSaveDatabase.mock.calls[0][0];
    const savedIssue = savedDbState.issues[0]; // Assuming only one issue created in this test

    expect(savedIssue).toHaveProperty('parentIssueKey', parentKey);
  });
});
