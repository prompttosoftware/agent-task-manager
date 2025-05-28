import { Request, Response } from 'express';
import { createIssue } from './issueController';
import { v4 as uuidv4 } from 'uuid';
import { loadDatabase, saveDatabase } from '../dataStore';
import * as dataStore from '../dataStore';
import { AnyIssue } from '../../models'; // Import AnyIssue for typing

// Mock the request and response objects
const mockRequest = (body = {}) => ({
  body,
} as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();
  res.send = jest.fn(); // Although not used by createIssue, good practice to mock
  return res;
};

// Helper to determine the expected prefix based on issue type
const getExpectedKeyPrefix = (issueType: AnyIssue['issueType']): string => {
    const prefixMap: { [key in AnyIssue['issueType']]: string } = {
        "Task": "TASK",
        "Story": "STOR",
        "Epic": "EPIC",
        "Bug": "BUG",
        "Subtask": "SUBT",
    };
    return prefixMap[issueType];
};

// Define valid issue types and statuses for validation tests
const validIssueTypes: AnyIssue['issueType'][] = ['Task', 'Story', 'Epic', 'Bug', 'Subtask'];
const validStatuses: AnyIssue['status'][] = ['Todo', 'In Progress', 'Done'];


// Main test suite for createIssue controller
describe('createIssue Controller', () => {
    beforeEach(async () => {
        // Reset the database to an empty state before each test
        dataStore.issues = [];
        dataStore.issueKeyCounter = 0;

        // Clear all mocks
        jest.clearAllMocks();
        // Mock Date.now for predictable timestamps
        const mockDate = new Date('2023-01-01T10:00:00.000Z');
        jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

        // Mock uuidv4 for predictable IDs - default mock
        (uuidv4 as jest.Mock).mockReturnValue('test-uuid-default');
    });

    afterEach(async () => {
        // Restore original mocks after each test
        jest.restoreAllMocks();
        jest.resetAllMocks();
    });

    // --- Key Generation Tests (Existing) ---

    it('should generate keys with the correct prefixes for all issue types', async () => {
        const issueTypes: AnyIssue['issueType'][] = ['Task', 'Story', 'Epic', 'Bug', 'Subtask'];
        let currentCounter = dataStore.issueKeyCounter; // Should be 0 initially due to beforeEach

        for (const issueType of issueTypes) {
            const testUuid = `uuid-${issueType.toLowerCase()}`;
            (uuidv4 as jest.Mock).mockReturnValueOnce(testUuid); // Mock uuidv4 for this specific creation

            const req = mockRequest({
                issueType: issueType,
                summary: `Test ${issueType}`,
                status: 'Todo', // Use a valid status
                // Provide parentIssueKey for Subtask, ignore for others
                parentIssueKey: issueType === 'Subtask' ? 'PARENT-1' : undefined,
            });
            const res = mockResponse();

            await createIssue(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            const createdIssue = (res.json as jest.Mock).mock.calls[0][0];

            const expectedPrefix = getExpectedKeyPrefix(issueType);
            currentCounter++;
            const expectedKey = `${expectedPrefix}-${currentCounter}`;

            expect(createdIssue.key).toBe(expectedKey);
            expect(createdIssue.issueType).toBe(issueType);
            expect(dataStore.issueKeyCounter).toBe(currentCounter);

             // Verify parentIssueKey is included for Subtask and absent for others
            if (issueType === 'Subtask') {
                expect((createdIssue as any).parentIssueKey).toBe('PARENT-1');
            } else {
                expect(createdIssue).not.toHaveProperty('parentIssueKey');
            }
        }
        expect(dataStore.issues.length).toBe(issueTypes.length);
        expect(dataStore.issueKeyCounter).toBe(issueTypes.length); // Final counter check
    });

    // --- Successful Creation Tests ---

    it('should return 201 and the created issue object upon successful issue creation without description', async () => {
        const testUuid = 'test-uuid-success-1';
        (uuidv4 as jest.Mock).mockReturnValue(testUuid);

        const req = mockRequest({
          issueType: 'Bug',
          summary: 'Test Issue Without Description',
          status: 'Todo', // Use a valid status
        });
        const res = mockResponse();

        await createIssue(req, res);

        const testDate = new Date('2023-01-01T10:00:00.000Z').toISOString(); // Matches mocked Date
        const initialCounter = 0; // Assume counter starts at 0 after beforeEach
        const expectedIssueKey = `${getExpectedKeyPrefix('Bug')}-${initialCounter + 1}`;

        const expectedIssue = {
            id: testUuid,
            key: expectedIssueKey,
            issueType: 'Bug',
            summary: 'Test Issue Without Description',
            description: '', // Default description when not provided
            status: 'Todo',
            createdAt: testDate,
            updatedAt: testDate,
        };

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expectedIssue);

        // Verify dataStore state
        expect(dataStore.issues.length).toBe(1);
        expect(dataStore.issues[0]).toEqual(expectedIssue);
        expect(dataStore.issueKeyCounter).toBe(1); // Key counter should increment
      });

      it('should return 201 and the created issue object upon successful issue creation with description', async () => {
        const testUuid = 'test-uuid-success-2';
        (uuidv4 as jest.Mock).mockReturnValue(testUuid); // Set specific UUID for this test

        const req = mockRequest({
          issueType: 'Story',
          summary: 'Test Issue With Description',
          status: 'In Progress',
          description: 'This is a test description.',
        });
        const res = mockResponse();

        await createIssue(req, res);

        const testDate = new Date('2023-01-01T10:00:00.000Z').toISOString(); // Matches mocked Date
        const initialCounter = 0; // Assume counter starts at 0 after beforeEach
        const expectedIssueKey = `${getExpectedKeyPrefix('Story')}-${initialCounter + 1}`;

        const expectedIssue = {
            id: testUuid,
            key: expectedIssueKey,
            issueType: 'Story',
            summary: 'Test Issue With Description',
            description: 'This is a test description.',
            status: 'In Progress',
            createdAt: testDate,
            updatedAt: testDate,
        };

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expectedIssue);

         // Verify dataStore state
        expect(dataStore.issues.length).toBe(1);
        expect(dataStore.issues[0]).toEqual(expectedIssue);
        expect(dataStore.issueKeyCounter).toBe(1); // Key counter should increment
      });

    it('should return 201 and create a Subtask issue with the correct parentIssueKey', async () => {
        const subtaskUuid = 'test-uuid-subtask-success-1';
        const parentKey = 'TASK-99'; // A dummy parent key

        // Mock uuidv4 for the subtask creation
        (uuidv4 as jest.Mock).mockReturnValueOnce(subtaskUuid);

        const initialCounter = dataStore.issueKeyCounter; // Should be 0 after beforeEach

        // Create the subtask
        const req = mockRequest({
            issueType: 'Subtask',
            summary: 'Subtask of Parent',
            status: 'Todo',
            parentIssueKey: parentKey, // Provide the parent key
        });
        const res = mockResponse();

        await createIssue(req, res);

        const testDate = new Date('2023-01-01T10:00:00.000Z').toISOString();
        const expectedSubtaskKey = `${getExpectedKeyPrefix('Subtask')}-${initialCounter + 1}`;

        const expectedSubtask = {
            id: subtaskUuid,
            key: expectedSubtaskKey,
            issueType: 'Subtask',
            summary: 'Subtask of Parent',
            description: '', // Default description
            status: 'Todo',
            createdAt: testDate,
            updatedAt: testDate,
            parentIssueKey: parentKey, // Verify parentIssueKey is included
        };

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expectedSubtask);

        // Verify dataStore state
        expect(dataStore.issues.length).toBe(1); // Only the subtask was created in this test run
        const createdSubtask = dataStore.issues.find(issue => issue.id === subtaskUuid);
        expect(createdSubtask).toEqual(expectedSubtask);
        expect(dataStore.issueKeyCounter).toBe(initialCounter + 1); // Counter should increment to 1
    });

    // --- Validation Tests (Missing Fields - Existing) ---

    it('should generate keys with the correct format [PREFIX]-[COUNTER]', async () => {
        const testUuid = 'uuid-format-check';
        (uuidv4 as jest.Mock).mockReturnValueOnce(testUuid);

        const req = mockRequest({
            issueType: 'Bug',
            summary: 'Format Test',
            status: 'Todo',
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        const createdIssue = (res.json as jest.Mock).mock.calls[0][0];

        const key = createdIssue.key;
        expect(key).toEqual(expect.stringMatching(/^[A-Z]+-\d+$/)); // Regex: one or more uppercase letters, hyphen, one or more digits

        const parts = key.split('-');
        expect(parts.length).toBe(2); // Should have exactly two parts
        expect(parts[0]).toBe(getExpectedKeyPrefix('Bug')); // First part is the prefix
        expect(parseInt(parts[1], 10)).toBeGreaterThanOrEqual(1); // Second part is a number >= 1 (since counter starts at 0 or 1)
        expect(isNaN(parseInt(parts[1], 10))).toBe(false); // Ensure the second part is a valid number

        expect(dataStore.issues.length).toBe(1);
        expect(dataStore.issueKeyCounter).toBe(1);
    });

    it('should correctly increment the counter for sequential issue creations', async () => {
        const testUuid1 = 'uuid-counter-1';
        const testUuid2 = 'uuid-counter-2';
        const testUuid3 = 'uuid-counter-3';

        // First creation
        (uuidv4 as jest.Mock).mockReturnValueOnce(testUuid1);
        const req1 = mockRequest({ issueType: 'Task', summary: 'Task One', status: 'Todo' });
        const res1 = mockResponse();
        await createIssue(req1, res1);
        expect(res1.status).toHaveBeenCalledWith(201);
        const issue1 = (res1.json as jest.Mock).mock.calls[0][0];
        expect(issue1.key).toBe(`${getExpectedKeyPrefix('Task')}-1`);
        expect(dataStore.issueKeyCounter).toBe(1);

        // Second creation
        (uuidv4 as jest.Mock).mockReturnValueOnce(testUuid2);
        const req2 = mockRequest({ issueType: 'Bug', summary: 'Bug Two', status: 'In Progress' });
        const res2 = mockResponse();
        await createIssue(req2, res2);
        expect(res2.status).toHaveBeenCalledWith(201);
        const issue2 = (res2.json as jest.Mock).mock.calls[0][0];
        // Counter should increment regardless of issue type
        expect(issue2.key).toBe(`${getExpectedKeyPrefix('Bug')}-2`);
        expect(dataStore.issueKeyCounter).toBe(2);

        // Third creation
        (uuidv4 as jest.Mock).mockReturnValueOnce(testUuid3);
        const req3 = mockRequest({ issueType: 'Story', summary: 'Story Three', status: 'Done' });
        const res3 = mockResponse();
        await createIssue(req3, res3);
        expect(res3.status).toHaveBeenCalledWith(201);
        const issue3 = (res3.json as jest.Mock).mock.calls[0][0];
         // Counter should increment again
        expect(issue3.key).toBe(`${getExpectedKeyPrefix('Story')}-3`);
        expect(dataStore.issueKeyCounter).toBe(3);

        // Verify state in the store
        expect(dataStore.issues.length).toBe(3);
        expect(dataStore.issues[0].key).toBe(`${getExpectedKeyPrefix('Task')}-1`);
        expect(dataStore.issues[1].key).toBe(`${getExpectedKeyPrefix('Bug')}-2`);
        expect(dataStore.issues[2].key).toBe(`${getExpectedKeyPrefix('Story')}-3`);
        expect(dataStore.issueKeyCounter).toBe(3); // Final counter check
    });

    // --- Successful Creation Tests ---

    it('should return 201 and the created issue object upon successful issue creation without description', async () => {
        const testUuid = 'test-uuid-success-1';
        (uuidv4 as jest.Mock).mockReturnValue(testUuid);

        const req = mockRequest({
          issueType: 'Bug',
          summary: 'Test Issue Without Description',
          status: 'Todo', // Use a valid status
        });
        const res = mockResponse();

        await createIssue(req, res);

        const testDate = new Date('2023-01-01T10:00:00.000Z').toISOString(); // Matches mocked Date
        const initialCounter = 0; // Assume counter starts at 0 after beforeEach
        const expectedIssueKey = `${getExpectedKeyPrefix('Bug')}-${initialCounter + 1}`;

        const expectedIssue = {
            id: testUuid,
            key: expectedIssueKey,
            issueType: 'Bug',
            summary: 'Test Issue Without Description',
            description: '', // Default description when not provided
            status: 'Todo',
            createdAt: testDate,
            updatedAt: testDate,
        };

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expectedIssue);

        // Verify dataStore state
        expect(dataStore.issues.length).toBe(1);
        expect(dataStore.issues[0]).toEqual(expectedIssue);
        expect(dataStore.issueKeyCounter).toBe(1); // Key counter should increment
      });

      it('should return 201 and the created issue object upon successful issue creation with description', async () => {
        const testUuid = 'test-uuid-success-2';
        (uuidv4 as jest.Mock).mockReturnValue(testUuid); // Set specific UUID for this test

        const req = mockRequest({
          issueType: 'Story',
          summary: 'Test Issue With Description',
          status: 'In Progress',
          description: 'This is a test description.',
        });
        const res = mockResponse();

        await createIssue(req, res);

        const testDate = new Date('2023-01-01T10:00:00.000Z').toISOString(); // Matches mocked Date
        const initialCounter = 0; // Assume counter starts at 0 after beforeEach
        const expectedIssueKey = `${getExpectedKeyPrefix('Story')}-${initialCounter + 1}`;

        const expectedIssue = {
            id: testUuid,
            key: expectedIssueKey,
            issueType: 'Story',
            summary: 'Test Issue With Description',
            description: 'This is a test description.',
            status: 'In Progress',
            createdAt: testDate,
            updatedAt: testDate,
        };

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expectedIssue);

         // Verify dataStore state
        expect(dataStore.issues.length).toBe(1);
        expect(dataStore.issues[0]).toEqual(expectedIssue);
        expect(dataStore.issueKeyCounter).toBe(1); // Key counter should increment
      });

    it('should return 201 and create a Subtask issue with the correct parentIssueKey', async () => {
        const subtaskUuid = 'test-uuid-subtask-success-1';
        const parentKey = 'TASK-99'; // A dummy parent key

        // Mock uuidv4 for the subtask creation
        (uuidv4 as jest.Mock).mockReturnValueOnce(subtaskUuid);

        const initialCounter = dataStore.issueKeyCounter; // Should be 0 after beforeEach

        // Create the subtask
        const req = mockRequest({
            issueType: 'Subtask',
            summary: 'Subtask of Parent',
            status: 'Todo',
            parentIssueKey: parentKey, // Provide the parent key
        });
        const res = mockResponse();

        await createIssue(req, res);

        const testDate = new Date('2023-01-01T10:00:00.000Z').toISOString();
        const expectedSubtaskKey = `${getExpectedKeyPrefix('Subtask')}-${initialCounter + 1}`;

        const expectedSubtask = {
            id: subtaskUuid,
            key: expectedSubtaskKey,
            issueType: 'Subtask',
            summary: 'Subtask of Parent',
            description: '', // Default description
            status: 'Todo',
            createdAt: testDate,
            updatedAt: testDate,
            parentIssueKey: parentKey, // Verify parentIssueKey is included
        };

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expectedSubtask);

        // Verify dataStore state
        expect(dataStore.issues.length).toBe(1); // Only the subtask was created in this test run
        const createdSubtask = dataStore.issues.find(issue => issue.id === subtaskUuid);
        expect(createdSubtask).toEqual(expectedSubtask);
        expect(dataStore.issueKeyCounter).toBe(initialCounter + 1); // Counter should increment to 1
    });

    // --- Validation Tests (Missing Fields - Existing) ---

     it('should return 400 if issueType is missing', async () => {
        const req = mockRequest({
            summary: 'Missing Type',
            status: 'Todo',
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Missing required field: issueType.' });

        // Verify dataStore state remains unchanged
        expect(dataStore.issues.length).toBe(0);
        expect(dataStore.issueKeyCounter).toBe(0);
    });

     it('should return 400 if summary is missing', async () => {
        const req = mockRequest({
            issueType: 'Task',
            status: 'Todo',
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Missing required field: summary.' });

        // Verify dataStore state remains unchanged
        expect(dataStore.issues.length).toBe(0);
        expect(dataStore.issueKeyCounter).toBe(0);
    });

    it('should return 400 if status is missing', async () => {
        const req = mockRequest({
            issueType: 'Task',
            summary: 'Missing Status',
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Missing required field: status.' });

        // Verify dataStore state remains unchanged
        expect(dataStore.issues.length).toBe(0);
        expect(dataStore.issueKeyCounter).toBe(0);
    });

    // --- Validation Tests (Invalid Values - New) ---

    it('should return 400 if issueType is invalid', async () => {
        const invalidIssueType = 'InvalidType';
        const req = mockRequest({
            issueType: invalidIssueType, // Invalid type
            summary: 'Invalid Type Test',
            status: 'Todo',
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Check for a message indicating invalid type
        expect(res.json).toHaveBeenCalledWith({ message: `Invalid value for issueType: ${invalidIssueType}. Must be one of: ${validIssueTypes.join(', ')}.` });

        // Verify dataStore state remains unchanged
        expect(dataStore.issues.length).toBe(0);
        expect(dataStore.issueKeyCounter).toBe(0);
    });

    it('should return 400 if status is invalid', async () => {
        const invalidStatus = 'InvalidStatus';
        const req = mockRequest({
            issueType: 'Task',
            summary: 'Invalid Status Test',
            status: invalidStatus, // Invalid status
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
         // Check for a message indicating invalid status
        expect(res.json).toHaveBeenCalledWith({ message: `Invalid value for status: ${invalidStatus}. Must be one of: ${validStatuses.join(', ')}.` });

        // Verify dataStore state remains unchanged
        expect(dataStore.issues.length).toBe(0);
        expect(dataStore.issueKeyCounter).toBe(0);
    });

    // --- Validation Tests (Subtask Parent - Existing) ---

    it('should return 400 if issueType is Subtask but parentIssueKey is missing', async () => {
        const req = mockRequest({
            issueType: 'Subtask',
            summary: 'Subtask without Parent',
            status: 'Todo',
            // parentIssueKey is intentionally missing
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Missing required field: parentIssueKey is required for Subtasks.' });

        // Verify dataStore state remains unchanged
        expect(dataStore.issues.length).toBe(0);
        expect(dataStore.issueKeyCounter).toBe(0);
    });

     it('should return 400 if issueType is Subtask but parentIssueKey is an empty string', async () => {
        const req = mockRequest({
            issueType: 'Subtask',
            summary: 'Subtask without Parent',
            status: 'Todo',
            parentIssueKey: '', // Empty string
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Missing required field: parentIssueKey is required for Subtasks.' });

        // Verify dataStore state remains unchanged
        expect(dataStore.issues.length).toBe(0);
        expect(dataStore.issueKeyCounter).toBe(0);
    });

    // Add a test to ensure parentIssueKey is ignored for non-subtasks
    it('should ignore parentIssueKey if issueType is not Subtask', async () => {
        const testUuid = 'test-uuid-ignore-parent';
        (uuidv4 as jest.Mock).mockReturnValue(testUuid);

        const req = mockRequest({
            issueType: 'Task', // Not a subtask
            summary: 'Task with Parent Key Provided',
            status: 'Todo',
            parentIssueKey: 'TASK-1', // Provided but should be ignored
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        const createdIssue = (res.json as jest.Mock).mock.calls[0][0];

        // Verify the created issue object does NOT have the parentIssueKey property
        expect(createdIssue).not.toHaveProperty('parentIssueKey');
        // Also verify it was not added to the issue in the store
        const issueInStore = dataStore.issues.find(issue => issue.id === testUuid);
        expect(issueInStore).not.toHaveProperty('parentIssueKey');

        // Verify it was created successfully otherwise
        expect(createdIssue.key).toBe(`${getExpectedKeyPrefix('Task')}-1`);
        expect(dataStore.issues.length).toBe(1);
        expect(dataStore.issueKeyCounter).toBe(1);
    });
});

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Missing required field: parentIssueKey is required for Subtasks.' });

        // Verify dataStore state remains unchanged
        expect(dataStore.issues.length).toBe(0);
        expect(dataStore.issueKeyCounter).toBe(0);
    });

    // Add a test to ensure parentIssueKey is ignored for non-subtasks
    it('should ignore parentIssueKey if issueType is not Subtask', async () => {
        const testUuid = 'test-uuid-ignore-parent';
        (uuidv4 as jest.Mock).mockReturnValue(testUuid);

        const req = mockRequest({
            issueType: 'Task', // Not a subtask
            summary: 'Task with Parent Key Provided',
            status: 'Todo',
            parentIssueKey: 'TASK-1', // Provided but should be ignored
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        const createdIssue = (res.json as jest.Mock).mock.calls[0][0];

        // Verify the created issue object does NOT have the parentIssueKey property
        expect(createdIssue).not.toHaveProperty('parentIssueKey');
        // Also verify it was not added to the issue in the store
        const issueInStore = dataStore.issues.find(issue => issue.id === testUuid);
        expect(issueInStore).not.toHaveProperty('parentIssueKey');

        // Verify it was created successfully otherwise
        expect(createdIssue.key).toBe(`${getExpectedKeyPrefix('Task')}-1`);
        expect(dataStore.issues.length).toBe(1);
        expect(dataStore.issueKeyCounter).toBe(1);
    });

});
