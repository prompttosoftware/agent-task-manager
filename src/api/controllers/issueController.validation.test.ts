import { Request, Response } from 'express';
import { createIssue } from './issueController'; // The controller function being tested
import { AnyIssue, CreateIssueInput } from '../../models';
import { IssueCreationError, errorStatusCodeMap } from '../../utils/errorHandling'; // Import necessary types

// Import the service function to be mocked.
import { createIssue as actualServiceCreateIssue } from '../../issueService';

// Mock the issueService module.
jest.mock('../../issueService', () => ({
  createIssue: jest.fn<Promise<AnyIssue>, [CreateIssueInput]>(),
}));

// Cast the (already mocked) imported service function to Jest's mock type.
const mockedCreateIssueService = actualServiceCreateIssue as jest.MockedFunction<typeof actualServiceCreateIssue>;

// Mock the request and response objects
const mockRequest = (body: any = {}): Request => ({
  body,
} as Request);

const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  return res;
};

// Define valid issue types and statuses for validation tests
const validIssueTypes: AnyIssue['issueType'][] = ['Task', 'Story', 'Epic', 'Bug', 'Subtask'];
const validStatuses: AnyIssue['status'][] = ['Todo', 'In Progress', 'Done'];

describe('createIssue Controller - Validation Scenarios', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- Validation Tests (Missing Fields - Controller handles these, service should not be called) ---

    it('should return 400 if issueType is missing', async () => {
        const req = mockRequest({
            summary: 'Missing Type',
            status: 'Todo',
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ message: 'Missing required field: issueType.' });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
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

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
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

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    // --- Validation Tests (Invalid Values - Controller handles these, service should not be called) ---

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

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
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

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    // --- Validation Tests (Subtask Parent - Controller handles these, service should not be called) ---

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

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
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

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    // Test for non-Subtask with parentIssueKey - MODIFIED as per subtask point 2
    it('should return 400 if parentIssueKey is provided for a non-Subtask issue type', async () => {
         const issueInput = {
            issueType: 'Task', // Not a subtask
            summary: 'Task with Parent Key Provided',
            status: 'Todo',
            parentIssueKey: 'TASK-1', // Provided but should cause error
        };

        const req = mockRequest(issueInput);
        const res = mockResponse();

        await createIssue(req, res);

        // Verify the controller responded with a 400 error
        expect(res.status).toHaveBeenCalledWith(400);
        // Check for appropriate message - matching the controller's validation
        expect(res.json).toHaveBeenCalledWith({ message: 'parentIssueKey is only allowed for Subtasks.' });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });
});
