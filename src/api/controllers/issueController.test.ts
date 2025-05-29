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

// Define valid issue types and statuses for validation tests
// These were used in the original file for validation tests.
// We keep them here for consistency or potential future use, though
// validation tests have been moved.
const validIssueTypes: AnyIssue['issueType'][] = ['Task', 'Story', 'Epic', 'Bug', 'Subtask'];
const validStatuses: AnyIssue['status'][] = ['Todo', 'In Progress', 'Done'];


// Main test suite for createIssue controller
describe('createIssue Controller - Success and Error Handling', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    afterEach(() => {
        // Restore original mocks after each test (though clearAllMocks is often sufficient)
        jest.restoreAllMocks();
    });

    // --- Successful Creation Tests ---
    // These tests verify that the controller correctly extracts data from the request body,
    // maps it to the service's expected input format, calls the service,
    // and returns the 201 status with the result from the service.

    it('should call issueService.createIssue with correct data and return 201 on success without description', async () => {
        const issueInput = {
          issueType: 'Bug',
          summary: 'Test Issue Without Description',
          status: 'Todo', // Status is validated by controller but not passed to service
        };
        const expectedServiceInput: CreateIssueInput = {
            issueTypeName: 'Bug',
            title: 'Test Issue Without Description',
            description: '', // Controller should pass default if missing
            parentKey: null, // Should be null for non-Subtasks
        };
        const serviceResult: AnyIssue = { // The object the service is mocked to return
            id: 'mock-uuid-1',
            key: 'BUG-1',
            issueType: 'Bug',
            summary: 'Test Issue Without Description',
            status: 'Todo', // Service adds status upon creation
            description: '',
            createdAt: '2023-01-01T10:00:00.000Z',
            updatedAt: '2023-01-01T10:00:00.000Z',
        };

        // Mock the service call to return the expected issue
        mockedCreateIssueService.mockResolvedValue(serviceResult);

        const req = mockRequest(issueInput);
        const res = mockResponse();

        await createIssue(req, res);

        // Verify the service was called with the correct input (point 1)
        expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
        expect(mockedCreateIssueService).toHaveBeenCalledWith(expectedServiceInput);

        // Verify the controller responded correctly
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(serviceResult);
    });

    it('should call issueService.createIssue with correct data and return 201 on success with description', async () => {
        const issueInput = {
          issueType: 'Story',
          summary: 'Test Issue With Description',
          status: 'In Progress', // Status is validated by controller but not passed to service
          description: 'This is a test description.',
        };
         const expectedServiceInput: CreateIssueInput = {
            issueTypeName: 'Story',
            title: 'Test Issue With Description',
            description: 'This is a test description.',
            parentKey: null, // Should be null for non-Subtasks
        };
        const serviceResult: AnyIssue = { // The object the service is mocked to return
            id: 'mock-uuid-2',
            key: 'STOR-2',
            issueType: 'Story',
            summary: 'Test Issue With Description',
            status: 'In Progress', // Service adds status upon creation
            description: 'This is a test description.',
            createdAt: '2023-01-01T10:00:00.000Z',
            updatedAt: '2023-01-01T10:00:00.000Z',
        };

        // Mock the service call to return the expected issue
        mockedCreateIssueService.mockResolvedValue(serviceResult);

        const req = mockRequest(issueInput);
        const res = mockResponse();

        await createIssue(req, res);

        // Verify the service was called with the correct input (point 1)
        expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
        expect(mockedCreateIssueService).toHaveBeenCalledWith(expectedServiceInput);


        // Verify the controller responded correctly
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(serviceResult);
      });

    it('should call issueService.createIssue with correct data and return 201 for a Subtask with parentIssueKey', async () => {
        const parentKey = 'TASK-99';
        const issueInput = {
            issueType: 'Subtask',
            summary: 'Subtask of Parent',
            status: 'Todo', // Status is validated by controller but not passed to service
            parentIssueKey: parentKey,
        };
        const expectedServiceInput: CreateIssueInput = {
            issueTypeName: 'Subtask',
            title: 'Subtask of Parent',
            description: '', // Default description
            parentKey: parentKey, // Should pass parentIssueKey as parentKey to service
        };
         const serviceResult: AnyIssue = { // The object the service is mocked to return
            id: 'mock-uuid-subtask-1',
            key: 'SUBT-3',
            issueType: 'Subtask',
            summary: 'Subtask of Parent',
            status: 'Todo', // Service adds status upon creation
            parentKey: parentKey, // Service includes the parentKey
            description: '',
            createdAt: '2023-01-01T10:00:00.000Z',
            updatedAt: '2023-01-01T10:00:00.000Z',
        };

        // Mock the service call to return the expected issue
        mockedCreateIssueService.mockResolvedValue(serviceResult);

        const req = mockRequest(issueInput);
        const res = mockResponse();

        await createIssue(req, res);

        // Verify the service was called with the correct input (point 1)
        expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
         expect(mockedCreateIssueService).toHaveBeenCalledWith(expectedServiceInput);

        // Verify the controller responded correctly (using the service result)
        expect(res.status).toHaveBeenCalledWith(201);
        // The API response might slightly differ from the internal service object
        // e.g., using parentIssueKey for external API consistency if the model does.
        // Based on issueController.ts return value (Turn 24, not included here), it returns the service result directly.
        // So, we expect the service result including `parentKey`. If the API needs `parentIssueKey`, the controller should map it.
        // Let's assume the service returns `parentKey` and the API response should have `parentIssueKey`.
        // The test in the previous successful file created a new object for the assertion. Let's stick to that.
        // The controller code in Turn 24 was returning the service result directly. So the test should expect the service result.
        // Let's verify the controller returns the service result which includes `parentKey`.
        expect(res.json).toHaveBeenCalledWith(serviceResult);
    });

    // --- Validation Tests (Moved to issueController.validation.test.ts) ---
    // The following tests have been moved to issueController.validation.test.ts
    // - missing issueType, summary, status
    // - invalid issueType, status
    // - subtask missing parentIssueKey
    // - non-subtask with parentIssueKey (point 2 of subtask)

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
