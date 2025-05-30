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

    it('should return 400 with error messages if issueType is missing', async () => {
        const req = mockRequest({
            summary: 'Missing Type',
            status: 'Todo',
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing required field: issueType.'] , errors: {} });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    it('should return 400 with error messages if summary is missing', async () => {
        const req = mockRequest({
            issueType: 'Task',
            status: 'Todo',
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing required field: summary.'] , errors: {} });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    it('should return 400 with error messages if status is missing', async () => {
        const req = mockRequest({
            issueType: 'Task',
            summary: 'Missing Status',
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing required field: status.'] , errors: {} });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    // --- Validation Tests (Invalid Values - Controller handles these, service should not be called) ---

    it('should return 400 with error messages if issueType is invalid', async () => {
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
        expect(res.json).toHaveBeenCalledWith({ errorMessages: [`Invalid value for issueType: ${invalidIssueType}. Must be one of: ${validIssueTypes.join(', ')}.`] , errors: {} });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    it('should return 400 with error messages if status is invalid', async () => {
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
        expect(res.json).toHaveBeenCalledWith({ errorMessages: [`Invalid value for status: ${invalidStatus}. Must be one of: ${validStatuses.join(', ')}.`] , errors: {} });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    // --- Validation Tests (Subtask Parent - Controller handles these, service should not be called) ---

    it('should return 400 with error messages if issueType is Subtask but parentIssueKey is missing', async () => {
        const req = mockRequest({
            issueType: 'Subtask',
            summary: 'Subtask without Parent',
            status: 'Todo',
            // parentIssueKey is intentionally missing
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing required field: parentIssueKey is required for Subtasks.'], errors: {} });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    it('should return 400 with error messages if issueType is Subtask but parentIssueKey is an empty string', async () => {
        const req = mockRequest({
            issueType: 'Subtask',
            summary: 'Subtask without Parent',
            status: 'Todo',
            parentIssueKey: '', // Empty string
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing required field: parentIssueKey is required for Subtasks.'], errors: {} });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    // Test for non-Subtask with parentIssueKey - MODIFIED as per subtask point 2
    it('should return 400 with error messages if parentIssueKey is provided for a non-Subtask issue type', async () => {
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
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['parentIssueKey is only allowed for Subtasks.'], errors: {} });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    // --- Validation Tests (Parent/Child Type Mismatch and Non-existent Parent) ---

    it('should return 400 with error messages if issueType is Subtask and parentIssueKey refers to a non-Task/Story parent', async () => {
        const req = mockRequest({
            issueType: 'Subtask',
            summary: 'Subtask with wrong parent type',
            status: 'Todo',
            parentIssueKey: 'EPIC-1', // Assume EPIC-1 exists and is an Epic
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Assuming the controller provides a specific message for this type mismatch
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Subtasks must have a parent of type Task or Story.'], errors: {} });
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    it('should return 400 with error messages if issueType is Task and parentIssueKey refers to a non-Epic parent', async () => {
        const req = mockRequest({
            issueType: 'Task',
            summary: 'Task with wrong parent type',
            status: 'Todo',
            parentIssueKey: 'STORY-1', // Assume STORY-1 exists and is a Story
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
         // Assuming the controller provides a specific message for this type mismatch
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Tasks must have a parent of type Epic.'], errors: {} });
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    it('should return 400 with error messages if issueType is Story and parentIssueKey refers to a non-Epic parent', async () => {
        const req = mockRequest({
            issueType: 'Story',
            summary: 'Story with wrong parent type',
            status: 'Todo',
            parentIssueKey: 'TASK-1', // Assume TASK-1 exists and is a Task
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
         // Assuming the controller provides a specific message for this type mismatch
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Stories must have a parent of type Epic.'], errors: {} });
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    // This test assumes the controller performs a check for parent existence
    // *before* calling the main createIssue service function and handles
    // the "not found" scenario with a 400.
    it('should return 400 with error messages if parentIssueKey refers to a non-existent issue', async () => {
        const req = mockRequest({
            issueType: 'Subtask', // Or Task/Story, depending on allowed parents
            summary: 'Subtask with non-existent parent',
            status: 'Todo',
            parentIssueKey: 'NONEXISTENT-123', // Key that doesn't exist
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Assuming the controller provides a specific message for parent not found
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Parent issue with key NONEXISTENT-123 not found.'], errors: {} });
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    // Add a test for valid request to verify correct parsing and service call - This is not *strictly* a validation test, but it's mentioned in the requirements, and good to have here.
    it('should call the service with the correct parameters for a valid request', async () => {
        const validIssue = {
            issueType: 'Task',
            summary: 'Valid Task',
            status: 'Todo',
        };
        const req = mockRequest(validIssue);
        const res = mockResponse();

        await createIssue(req, res);

        expect(mockedCreateIssueService).toHaveBeenCalledWith(validIssue);
        expect(res.status).not.toHaveBeenCalledWith(400);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalled();
    });
});
