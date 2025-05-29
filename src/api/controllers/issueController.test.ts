import { Request, Response } from 'express';
import { createIssue } from './issueController'; // The controller function being tested
import { AnyIssue, CreateIssueInput } from '../../models';
import { IssueCreationError, errorStatusCodeMap } from '../../utils/errorHandling'; // Import the correct error type and map

// --- Mock Setup ---
// Import the actual service function type/signature for typing the mock.
// This import is only used for type information and later casting to Jest's mock type.
import { createIssue as actualServiceCreateIssue } from '../../issueService';

// Mock the '../../issueService' module.
// The factory function passed to jest.mock must return the mocks.
// We create the mock function inside the factory.
jest.mock('../../issueService', () => ({
  // Create a mock function *with* the correct type signature directly here.
  createIssue: jest.fn<
    ReturnType<typeof actualServiceCreateIssue>,
    Parameters<typeof actualServiceCreateIssue>
  >(),
}));

// Cast the imported service function reference (which is now a mock because of jest.mock)
// to Jest's MockedFunction type so we can access mock-specific methods like .mockResolvedValue.
const mockedCreateIssueService = actualServiceCreateIssue as jest.MockedFunction<typeof actualServiceCreateIssue>;
// --- End Mock Setup ---


// Mock the request and response objects
const mockRequest = (body = {}): Request => ({
  body,
} as Request);

const mockResponse = (): Response => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis();
  return res;
};


// Main test suite for createIssue controller - focusing on service interaction and error handling
describe('createIssue Controller - Service Interaction and Error Handling', () => { // Updated describe block title
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Restore original mocks after each test (though clearAllMocks is often sufficient)
        jest.restoreAllMocks();
    });

    // --- Successful Creation Tests (Moved to issueController.success.test.ts) ---
    // The tests for successful creation scenarios have been moved to issueController.success.test.ts.
    // This file now focuses on how the controller handles responses and errors from the service.

    // --- Validation Tests (Moved to issueController.validation.test.ts) ---
    // The following tests have been moved to issueController.validation.test.ts
    // - missing issueType, summary, status
    // - invalid issueType, status
    // - subtask missing parentIssueKey
    // - non-subtask with parentIssueKey

    // --- Service Error Handling Tests ---

    it('should return 500 if issueService.createIssue throws a generic error', async () => {
        const issueInput = {
            issueType: 'Bug',
            summary: 'Service Error Test',
            status: 'Todo', // Status is validated by controller but not passed to service
        };
        const expectedServiceInput: CreateIssueInput = {
            issueTypeName: 'Bug',
            title: 'Service Error Test',
            description: '',
            parentKey: null,
        };
        const serviceError = new Error('Something went wrong in the service');

        // Mock the service call to reject with a generic error
        mockedCreateIssueService.mockRejectedValue(serviceError);

        const req = mockRequest(issueInput);
        const res = mockResponse();

        // Spy on console.error to check if the error is logged
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await createIssue(req, res);

        // Verify the service was called with the correct input (point 1)
        expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
        expect(mockedCreateIssueService).toHaveBeenCalledWith(expectedServiceInput);

        // Verify the controller responded with a 500 error
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });

        // Verify the error was logged
        expect(consoleSpy).toHaveBeenCalledWith('Error creating issue:', serviceError);

        consoleSpy.mockRestore(); // Restore console.error
    });

    // Test to handle specific IssueCreationError (point 3)
    it('should return the appropriate status and message if issueService.createIssue throws an IssueCreationError', async () => {
        const issueInput = {
            issueType: 'Epic',
            summary: 'Custom Error Test',
            status: 'In Progress', // Status is validated by controller but not passed to service
        };
        const expectedServiceInput: CreateIssueInput = {
             issueTypeName: 'Epic',
             title: 'Custom Error Test',
             description: '',
             parentKey: null,
        };
        // Use the correct error type and constructor arguments: message, errorCode, statusCode
        const customErrorCode = 'CONFLICT'; // Use a code from the map
        const customErrorMessage = 'Issue creation failed due to conflict'; // More descriptive message
        // Ensure statusCode is correctly passed to the IssueCreationError constructor
        const customError = new IssueCreationError(customErrorMessage, customErrorCode, errorStatusCodeMap[customErrorCode] || 500);

        // Mock the service call to reject with a custom error
        mockedCreateIssueService.mockRejectedValue(customError);

        const req = mockRequest(issueInput);
        const res = mockResponse();

        // Spy on console.error to ensure *custom* errors are not logged as generic errors
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});


        await createIssue(req, res);

        // Verify the service was called with the correct input (point 1)
        expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
         expect(mockedCreateIssueService).toHaveBeenCalledWith(expectedServiceInput);

        // Verify the controller responded with the custom error status and message (point 3)
        expect(res.status).toHaveBeenCalledWith(errorStatusCodeMap[customErrorCode]); // Use status from the map
        expect(res.json).toHaveBeenCalledWith({ message: customErrorMessage }); // Use the custom message

        // Verify the error was NOT logged as a generic server error
        // The catch block in the controller specifically logs non-IssueCreationError types.
        expect(consoleSpy).not.toHaveBeenCalled();


         consoleSpy.mockRestore(); // Restore console.error
    });
});
