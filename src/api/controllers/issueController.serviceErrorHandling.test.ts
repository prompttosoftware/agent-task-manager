import { Request, Response } from 'express';
import { createIssue } from './createIssue'; // Import from the new file
import { AnyIssue, CreateIssueInput, IssueType } from '../../models'; // Import Task type
import { IssueCreationError, errorStatusCodeMap, IssueErrorCodes } from '../../utils/errorHandling'; // Import necessary types and IssueErrorCodes

// Import the service function to be mocked.
// Assuming test file is in src/controllers/issue/__tests__ and service is in src/services
import { createIssue as actualServiceCreateIssue } from '../../services/issueService';

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

// Define valid issue types and statuses (might not be strictly needed for service error tests,
// but good to keep if any validation passes through before the service call)
const allowedIssueTypes: AnyIssue['issueType'][] = ['Task', 'Story', 'Epic', 'Bug', 'Subtask'];
const allowedStatuses: AnyIssue['status'][] = ['Todo', 'In Progress', 'Done'];


describe('createIssue Controller - Service Error Handling Scenarios', () => { // Updated describe block name
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // --- Service Error Handling (Validation Errors mapped by Controller/Error Class) ---

    it('should return 404 with error messages if service throws IssueCreationError with PARENT_ISSUE_NOT_FOUND', async () => {
        const parentKey = 'NONEXISTENT-123';
        const issueInput = {
            issueType: 'Subtask' as IssueType,
            summary: 'Subtask with non-existent parent handled by service',
            status: 'Todo',
            parentIssueKey: parentKey, // Parent key that the service will report as not found
        };
        const req = mockRequest(issueInput);
        const res = mockResponse();

        // Mock the service to throw the specific error
        const errorMessage = `Parent issue with key ${parentKey} not found.`;
        mockedCreateIssueService.mockRejectedValueOnce(
            new IssueCreationError(errorMessage, IssueErrorCodes.PARENT_ISSUE_NOT_FOUND, 404) // Use enum IssueErrorCodes
        );

        await createIssue(req, res);

        // Verify service was called with transformed input (summary -> title, issueType -> issueTypeName)
         expect(mockedCreateIssueService).toHaveBeenCalledWith({
            title: issueInput.summary,
            issueTypeName: issueInput.issueType,
            description: '', // Default description
            parentKey: issueInput.parentIssueKey // Expect the parentKey to be passed to service
        });


        // Verify the controller handled the error correctly, returning the specified validation format
        expect(res.status).toHaveBeenCalledWith(404); // Status code comes from the error's statusCode or map
        expect(res.json).toHaveBeenCalledWith({
             errorMessages: [errorMessage], // Expect the message in the array
             errors: {} // Expect empty errors object
        });
    });

    it('should return 400 with error messages if service throws IssueCreationError with INVALID_PARENT_TYPE for Subtask', async () => {
        const parentKey = 'EPIC-1'; // A parent key that exists but is the wrong type (e.g., Epic for a Subtask)
        const issueInput = {
            issueType: 'Subtask' as IssueType,
            summary: 'Subtask with invalid parent type handled by service',
            status: 'Todo',
            parentIssueKey: parentKey, // Parent key that the service will report as having invalid type
        };
        const req = mockRequest(issueInput);
        const res = mockResponse();

        // Mock the service to throw the specific error
        const errorMessage = `Invalid parent type for issue key ${parentKey}. Subtasks require Task or Story parent.`;
        mockedCreateIssueService.mockRejectedValueOnce(
            new IssueCreationError(errorMessage, IssueErrorCodes.INVALID_PARENT_TYPE, 400) // Use enum IssueErrorCodes
        );

        await createIssue(req, res);

         // Verify service was called with transformed input (summary -> title, issueType -> issueTypeName)
         expect(mockedCreateIssueService).toHaveBeenCalledWith({
            title: issueInput.summary,
            issueTypeName: issueInput.issueType,
            description: '', // Default description
            parentKey: issueInput.parentIssueKey // Expect the parentKey to be passed to service
        });

        // Verify the controller handled the error correctly, returning the specified validation format
        expect(res.status).toHaveBeenCalledWith(400); // Status code comes from the error's statusCode or map
        expect(res.json).toHaveBeenCalledWith({
             errorMessages: [errorMessage], // Expect the message in the array
             errors: {} // Expect empty errors object
        });
    });

    // New test case: Task with a non-Epic parent handled by service (simulating invalid type)
    it('should return 400 with error messages if service throws IssueCreationError with INVALID_PARENT_TYPE for Task', async () => {
        const parentKey = 'SUBTASK-1'; // A parent key that exists but is the wrong type (e.g., Subtask for a Task)
        const issueInput = {
            issueType: 'Task' as IssueType,
            summary: 'Task with invalid parent type handled by service',
            status: 'Todo',
            parentIssueKey: parentKey, // Parent key that the service will report as having invalid type
        };
        const req = mockRequest(issueInput);
        const res = mockResponse();

        // Mock the service to throw the specific error
        // The specific message might vary, but the error code is key
        const errorMessage = `Invalid parent type for issue key ${parentKey}. Tasks require Epic parent.`;
        mockedCreateIssueService.mockRejectedValueOnce(
            new IssueCreationError(errorMessage, IssueErrorCodes.INVALID_PARENT_TYPE, 400) // Use enum IssueErrorCodes
        );

        await createIssue(req, res);

         // Verify service was called with transformed input
         expect(mockedCreateIssueService).toHaveBeenCalledWith({
            title: issueInput.summary,
            issueTypeName: issueInput.issueType,
            description: '',
            parentKey: issueInput.parentIssueKey
        });

        // Verify the controller handled the error correctly
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
             errorMessages: [errorMessage],
             errors: {}
        });
    });

    // New test case: Story with a non-Epic parent handled by service (simulating invalid type)
    it('should return 400 with error messages if service throws IssueCreationError with INVALID_PARENT_TYPE for Story', async () => {
        const parentKey = 'SUBTASK-1'; // A parent key that exists but is the wrong type (e.g., Subtask for a Story)
        const issueInput = {
            issueType: 'Story' as IssueType,
            summary: 'Story with invalid parent type handled by service',
            status: 'Todo',
            parentIssueKey: parentKey, // Parent key that the service will report as having invalid type
        };
        const req = mockRequest(issueInput);
        const res = mockResponse();

        // Mock the service to throw the specific error
        // The specific message might vary, but the error code is key
        const errorMessage = `Invalid parent type for issue key ${parentKey}. Stories require Epic parent.`;
        mockedCreateIssueService.mockRejectedValueOnce(
            new IssueCreationError(errorMessage, IssueErrorCodes.INVALID_PARENT_TYPE, 400) // Use enum IssueErrorCodes
        );

        await createIssue(req, res);

         // Verify service was called with transformed input
         expect(mockedCreateIssueService).toHaveBeenCalledWith({
            title: issueInput.summary,
            issueTypeName: issueInput.issueType,
            description: '',
            parentKey: issueInput.parentIssueKey
        });

        // Verify the controller handled the error correctly
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
             errorMessages: [errorMessage],
             errors: {}
        });
    });


     it('should return 400 with error messages if service throws IssueCreationError with INVALID_INPUT', async () => {
        // Example scenario: Service might find an issue with the combination of fields
        // or more complex validation not done at the controller layer.
        const issueInput = {
            issueType: 'Task' as IssueType,
            summary: 'Task with problematic input',
            status: 'Todo',
            // Assume some combination here triggers INVALID_INPUT in service
        };
        const req = mockRequest(issueInput);
        const res = mockResponse();

        // Mock the service to throw the specific error
        const errorMessage = 'Service reported invalid input for this request.';
        mockedCreateIssueService.mockRejectedValueOnce(
            new IssueCreationError(errorMessage, IssueErrorCodes.INVALID_INPUT, 400) // Use enum IssueErrorCodes
        );

        await createIssue(req, res);

         // Verify service was called with transformed input (summary -> title, issueType -> issueTypeName)
         expect(mockedCreateIssueService).toHaveBeenCalledWith({
            title: issueInput.summary,
            issueTypeName: issueInput.issueType,
            description: '', // Default description
            parentKey: null // Expect null if not provided
        });

        // Verify the controller handled the error correctly, returning the specified validation format
        expect(res.status).toHaveBeenCalledWith(400); // Status code comes from the error's statusCode or map
        expect(res.json).toHaveBeenCalledWith({
             errorMessages: [errorMessage], // Expect the message in the array
             errors: {} // Expect empty errors object
        });
    });


    // --- Error Handling (Non-Validation) ---
     it('should return 500 if service throws a non-IssueCreationError', async () => {
        const issueInput = {
            issueType: 'Task' as IssueType,
            summary: 'Task causing generic service error',
            status: 'Todo',
        };
        const req = mockRequest(issueInput);
        const res = mockResponse();

        // Mock the service to throw a generic error
        const genericError = new Error('Something unexpected went wrong in the service.');
        mockedCreateIssueService.mockRejectedValueOnce(genericError);

        await createIssue(req, res);

         // Verify service was called
         expect(mockedCreateIssueService).toHaveBeenCalledWith({
            title: issueInput.summary,
            issueTypeName: issueInput.issueType,
            description: '',
            parentKey: null
        });


        // Verify the controller handled the generic error correctly
        expect(res.status).toHaveBeenCalledWith(500);
        // The controller returns a generic message for non-IssueCreationError
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });

     it('should return the error status and message for a non-validation IssueCreationError', async () => {
        const issueInput = {
            issueType: 'Task' as IssueType,
            summary: 'Task causing specific service error',
            status: 'Todo',
        };
        const req = mockRequest(issueInput);
        const res = mockResponse();

        // Mock the service to throw a non-validation related IssueCreationError
        // Example: a hypothetical error like DB_SAVE_FAILED
        const specificError = new IssueCreationError('Failed to save to database.', 'DB_SAVE_FAILED', 500);
        mockedCreateIssueService.mockRejectedValueOnce(specificError);

        await createIssue(req, res);

         // Verify service was called
         expect(mockedCreateIssueService).toHaveBeenCalledWith({
            title: issueInput.summary,
            issueTypeName: issueInput.issueType,
            description: '',
            parentKey: null
        });


        // Verify the controller handled the specific IssueCreationError correctly
        expect(res.status).toHaveBeenCalledWith(500); // Status code comes from the error's statusCode
        // Expect the specific error code and message
        expect(res.json).toHaveBeenCalledWith({
            errorCode: specificError.errorCode,
            message: specificError.message
        });
    });
});
