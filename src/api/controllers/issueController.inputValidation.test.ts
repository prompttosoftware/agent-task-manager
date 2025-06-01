import { Request, Response } from 'express';
import { createIssue } from './createIssue'; // Import from the new file
import { AnyIssue, CreateIssueInput, IssueType } from '../../models'; // Import necessary types
import { IssueCreationError, errorStatusCodeMap, IssueErrorCodes } from '../../utils/errorHandling'; // Import necessary types and IssueErrorCodes

// Import the service function to be mocked.
import { createIssue as actualServiceCreateIssue } from '../issueService';

// Mock the issueService module.
jest.mock('../issueService', () => ({
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

// Define valid issue types and statuses for validation tests (Needed for error messages)
const allowedIssueTypes: AnyIssue['issueType'][] = ['Task', 'Story', 'Epic', 'Bug', 'Subtask'];
const allowedStatuses: AnyIssue['status'][] = ['Todo', 'In Progress', 'Done'];

describe('createIssue Controller - Direct Validation Scenarios', () => { // Updated describe block name
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- Validation Tests (Missing Fields - Controller handles these, service should not be called) ---

    it('should return 400 with error messages if issueType is missing', async () => {
        const req = mockRequest({
            summary: 'Missing Issue Type',
            status: 'Todo',
            // issueType is missing
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Assert against the updated format
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing required field: issueType.'], errors: {} });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    it('should return 400 with error messages if summary is missing or empty', async () => {
        // Test missing summary
        let req = mockRequest({
            issueType: 'Task',
            status: 'Todo',
            // summary is missing
        });
        let res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
         // Assert against the updated format and message
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing or empty required field: summary.'], errors: {} });
        expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Verify service was NOT called

        // Test empty summary
        req = mockRequest({
            issueType: 'Task',
            summary: '', // Empty string
            status: 'Todo',
        });
        res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Assert against the updated format and message
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing or empty required field: summary.'], errors: {} });
        expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Verify service was NOT called

         // Test whitespace summary
        req = mockRequest({
            issueType: 'Task',
            summary: '   ', // Whitespace string
            status: 'Todo',
        });
        res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Assert against the updated format and message
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing or empty required field: summary.'], errors: {} });
        expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Verify service was NOT called
    });


    it('should return 400 with error messages if status is missing', async () => {
        const req = mockRequest({
            issueType: 'Task',
            summary: 'Missing Status',
            // status is missing
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Assert against the updated format
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing required field: status.'], errors: {} });

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
        // Assert against the updated format and message
        expect(res.json).toHaveBeenCalledWith({ errorMessages: [`Invalid value for issueType: "${invalidIssueType}". Must be one of: ${allowedIssueTypes.join(', ')}.`] , errors: {} });

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
        // Assert against the updated format and message
        expect(res.json).toHaveBeenCalledWith({ errorMessages: [`Invalid value for status: "${invalidStatus}". Must be one of: ${allowedStatuses.join(', ')}.`] , errors: {} });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    // --- Validation Tests (Parent Issue Key Presence/Absence - Controller handles these, service should not be called) ---

    it('should return 400 with error messages if issueType is Subtask but parentIssueKey is missing', async () => {
        const req = mockRequest({
            issueType: 'Subtask' as IssueType,
            summary: 'Subtask without Parent',
            status: 'Todo',
            // parentIssueKey is intentionally missing
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Assert against the updated format
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing required field: parentIssueKey is required for Subtasks.'], errors: {} });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    it('should return 400 with error messages if issueType is Subtask but parentIssueKey is an empty string', async () => {
        const req = mockRequest({
            issueType: 'Subtask' as IssueType,
            summary: 'Subtask without Parent',
            status: 'Todo',
            parentIssueKey: '', // Empty string
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Assert against the updated format
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing required field: parentIssueKey is required for Subtasks.'], errors: {} });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    // Test if parentIssueKey is provided for issue types that do not allow it (Epic, Bug)
    it('should return 400 with error messages if parentIssueKey is provided for an Epic issue type', async () => {
         const issueInput = {
            issueType: 'Epic' as IssueType, // Epic cannot have a parent
            summary: 'Epic with Parent Key',
            status: 'Todo',
            parentIssueKey: 'PROJECT-PARENT', // Provided parent key
        };

        const req = mockRequest(issueInput);
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Match the controller's exact message format and updated JSON structure
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Invalid field: parentIssueKey is not allowed for Epic issue types.'], errors: {} });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

     it('should return 400 with error messages if parentIssueKey is provided for a Bug issue type', async () => {
         const issueInput = {
            issueType: 'Bug' as IssueType, // Bug cannot have a parent
            summary: 'Bug with Parent Key',
            status: 'Todo',
            parentIssueKey: 'PROJECT-PARENT', // Provided parent key
        };

        const req = mockRequest(issueInput);
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Match the controller's exact message format and updated JSON structure
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Invalid field: parentIssueKey is not allowed for Bug issue types.'], errors: {} });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

});
