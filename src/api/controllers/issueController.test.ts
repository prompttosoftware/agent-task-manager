import { Request, Response } from 'express';
import { createIssue } from './issueController';
// Assuming issueService handles UUID, key generation, and persistence
// import { v4 as uuidv4 } from 'uuid'; // Removed as service handles ID
// import { loadDatabase, saveDatabase } from '../dataStore'; // Removed as service handles data
// import * as dataStore from '../dataStore'; // Removed as service handles data
// import issueService from '../services/issueService'; // REMOVED: Old import, path incorrect and targets non-existent default export.
import { AnyIssue, CreateIssueInput } from '../../models'; // Import necessary types
import { ApiError } from '../utils/apiError'; // Assuming a custom error type

// Mock the issueService module and its named export 'createIssue'.
// The path '../../issueService.ts' correctly targets 'src/issueService.ts'
// from 'src/api/controllers/issueController.test.ts'.
jest.mock('../../issueService', () => ({
  createIssue: jest.fn(),
}));

// Import the mocked createIssue function. This must be done after jest.mock.
// eslint-disable-next-line import/first
import { createIssue as mockedCreateIssueService } from '../../issueService';

// const mockIssueService = issueService as jest.Mocked<typeof issueService>; // REMOVED: Old mock variable setup.


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

// Helper functions (can remain if controller validation uses them,
// but the key generation logic itself is service responsibility)
// Helper to determine the expected prefix based on issue type
// Removed as service handles key generation
// const getExpectedKeyPrefix = (issueType: AnyIssue['issueType']): string => {
//     const prefixMap: { [key in AnyIssue['issueType']]: string } = {
//         "Task": "TASK",
//         "Story": "STOR",
//         "Epic": "EPIC",
//         "Bug": "BUG",
//         "Subtask": "SUBT",
//     };
//     return prefixMap[issueType];
// };

// Define valid issue types and statuses for validation tests
// These should ideally be imported from a shared constants file used by the controller
const validIssueTypes: AnyIssue['issueType'][] = ['Task', 'Story', 'Epic', 'Bug', 'Subtask'];
const validStatuses: AnyIssue['status'][] = ['Todo', 'In Progress', 'Done'];


// Main test suite for createIssue controller
describe('createIssue Controller', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Mock Date.now for predictable timestamps if controller uses it before passing to service,
        // or if we need to verify the service returns correct dates based on input time.
        // Assuming service handles dates, mock Date.now is less critical for controller tests.
        // Removing the Date mock unless needed later.
        // const mockDate = new Date('2023-01-01T10:00:00.000Z');
        // jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);


        // Mock uuidv4 only if the controller generates the ID before calling the service.
        // Assuming service generates the full issue object including ID, Key, Dates.
        // Removed uuidv4 mock.
        // (uuidv4 as jest.Mock).mockReturnValue('test-uuid-default');
    });

    afterEach(() => {
        // Restore original mocks after each test (though clearAllMocks is often sufficient)
        jest.restoreAllMocks();
        // jest.resetAllMocks(); // clearAllMocks usually covers this for mocks created in beforeEach
    });

    // --- Successful Creation Tests ---

    it('should call issueService.createIssue with correct data and return 201 on success without description', async () => {
        const issueInput = {
          issueType: 'Bug',
          summary: 'Test Issue Without Description',
          status: 'Todo', // Status is validated by controller but not passed to service
        };
        const expectedIssue = {
            id: 'mock-uuid-1', // Mocked by service
            key: 'BUG-1',       // Mocked by service
            ...issueInput, // Includes status for the *return* value from service, but not the *input* to service
            description: '',    // Default description
            createdAt: '2023-01-01T10:00:00.000Z', // Mocked by service
            updatedAt: '2023-01-01T10:00:00.000Z', // Mocked by service
        };

        // Mock the service call to return the expected issue
        // The service is expected to receive input *without* status
        const serviceInputWithoutStatus = { ...issueInput };
        delete (serviceInputWithoutStatus as any).status; // Explicitly remove status for the service input expectation

        mockedCreateIssueService.mockResolvedValue(expectedIssue as AnyIssue);

        const req = mockRequest(issueInput);
        const res = mockResponse();

        await createIssue(req, res);

        // Verify the service was called with the correct input *excluding* status
        expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
        expect(mockedCreateIssueService).toHaveBeenCalledWith({
            issueType: 'Bug',
            summary: 'Test Issue Without Description',
            description: '', // Controller should pass default if missing
             // parentIssueKey should be undefined for non-subtasks
            // Status should NOT be passed to the service as it determines it
        });

        // Verify the controller responded correctly (with the issue returned by the service, which includes status)
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expectedIssue);

        // No direct dataStore assertions in controller tests
      });

      it('should call issueService.createIssue with correct data and return 201 on success with description', async () => {
        const issueInput = {
          issueType: 'Story',
          summary: 'Test Issue With Description',
          status: 'In Progress', // Status is validated by controller but not passed to service
          description: 'This is a test description.',
        };
        const expectedIssue = {
            id: 'mock-uuid-2', // Mocked by service
            key: 'STOR-2',      // Mocked by service
            ...issueInput, // Includes status for the *return* value from service, but not the *input* to service
            createdAt: '2023-01-01T10:00:00.000Z', // Mocked by service
            updatedAt: '2023-01-01T10:00:00.000Z', // Mocked by service
        };

        // Mock the service call to return the expected issue
        mockedCreateIssueService.mockResolvedValue(expectedIssue as AnyIssue);

        const req = mockRequest(issueInput);
        const res = mockResponse();

        await createIssue(req, res);

        // Verify the service was called with the correct input *excluding* status
        expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
        expect(mockedCreateIssueService).toHaveBeenCalledWith({
            issueType: 'Story',
            summary: 'Test Issue With Description',
            description: 'This is a test description.',
             // parentIssueKey should be undefined for non-subtasks
            // Status should NOT be passed to the service as it determines it
        });


        // Verify the controller responded correctly (with the issue returned by the service, which includes status)
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expectedIssue);

         // No direct dataStore assertions in controller tests
      });

    it('should call issueService.createIssue with correct data and return 201 for a Subtask with parentIssueKey', async () => {
        const parentKey = 'TASK-99';
        const issueInput = {
            issueType: 'Subtask',
            summary: 'Subtask of Parent',
            status: 'Todo', // Status is validated by controller but not passed to service
            parentIssueKey: parentKey,
        };
        const expectedIssue = {
            id: 'mock-uuid-subtask-1', // Mocked by service
            key: 'SUBT-3',              // Mocked by service
            ...issueInput, // Includes status for the *return* value from service, but not the *input* to service
            description: '',            // Default description
            createdAt: '2023-01-01T10:00:00.000Z', // Mocked by service
            updatedAt: '2023-01-01T10:00:00.000Z', // Mocked by service
        };

        // Mock the service call to return the expected issue
        mockedCreateIssueService.mockResolvedValue(expectedIssue as AnyIssue);

        const req = mockRequest(issueInput);
        const res = mockResponse();

        await createIssue(req, res);

        // Verify the service was called with the correct input *excluding* status*, including parentIssueKey
        expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
         expect(mockedCreateIssueService).toHaveBeenCalledWith({
            issueType: 'Subtask',
            summary: 'Subtask of Parent',
            description: '', // Controller should pass default if missing
            parentIssueKey: parentKey, // Verify parentIssueKey is passed
             // Status should NOT be passed to the service as it determines it
        });

        // Verify the controller responded correctly (with the issue returned by the service, which includes status)
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expectedIssue);

        // No direct dataStore assertions in controller tests
    });

    // --- Validation Tests (Missing Fields - Controller handles these, service should not be called) ---

    // Removed key generation/increment tests as they are service logic now
    // it('should generate keys with the correct format [PREFIX]-[COUNTER]', async () => { ... });
    // it('should correctly increment the counter for sequential issue creations', async () => { ... });

    // Note: Duplicate successful creation tests found in the original code have been removed.
    // The tests above cover successful creation with/without description and for Subtasks.


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

    // Validation test for missing status remains valid as controller validates input
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

    // Note: Duplicate validation tests found in the original code have been removed.
    // The tests above cover missing required fields.

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

    // Validation test for invalid status remains valid as controller validates input
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

    // Add a test to ensure parentIssueKey is ignored for non-subtasks
    it('should ignore parentIssueKey for non-Subtask issue types and call the service correctly', async () => {
         const issueInput = {
            issueType: 'Task', // Not a subtask
            summary: 'Task with Parent Key Provided',
            status: 'Todo', // Status is validated but not passed to service
            parentIssueKey: 'TASK-1', // Provided but should be ignored by the controller before passing to service
        };

        const expectedIssue = { // Mock the issue returned by the service
            id: 'mock-uuid-ignore-parent',
            key: 'TASK-4',
            issueType: 'Task',
            summary: 'Task with Parent Key Provided',
            description: '', // Default description
            status: 'Todo', // Service sets the status, included in the returned object
            createdAt: '2023-01-01T10:00:00.000Z',
            updatedAt: '2023-01-01T10:00:00.000Z',
             // Note: parentIssueKey should NOT be in the expectedIssue if service logic is correct
        };

        mockedCreateIssueService.mockResolvedValue(expectedIssue as AnyIssue);


        const req = mockRequest(issueInput);
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith(expectedIssue); // Verify response matches service output

        // Verify service was called correctly - parentIssueKey and status should NOT be passed for non-subtasks
        expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
         expect(mockedCreateIssueService).toHaveBeenCalledWith({
             issueType: 'Task',
             summary: 'Task with Parent Key Provided',
             description: '',
             // Explicitly check that parentIssueKey is not in the argument passed to the service
             parentIssueKey: undefined,
             // Status should NOT be passed to the service
         });

        // No direct dataStore assertions in controller tests
    });


    // --- Service Error Handling Tests ---

    it('should return 500 if issueService.createIssue throws a generic error', async () => {
        const issueInput = {
            issueType: 'Bug',
            summary: 'Service Error Test',
            status: 'Todo', // Status is validated by controller but not passed to service
        };
        const serviceError = new Error('Something went wrong in the service');

        // Mock the service call to reject with a generic error
        mockedCreateIssueService.mockRejectedValue(serviceError);

        const req = mockRequest(issueInput);
        const res = mockResponse();

        // Spy on console.error to check if the error is logged
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await createIssue(req, res);

        // Verify the service was called with the correct input *excluding* status
        expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
        expect(mockedCreateIssueService).toHaveBeenCalledWith({
             issueType: 'Bug',
             summary: 'Service Error Test',
             description: '',
             parentIssueKey: undefined,
             // Status should NOT be passed to the service
        });

        // Verify the controller responded with a 500 error
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });

        // Verify the error was logged
        expect(consoleSpy).toHaveBeenCalledWith('Error creating issue:', serviceError);

        consoleSpy.mockRestore(); // Restore console.error
    });

    it('should return the appropriate status and message if issueService.createIssue throws a custom ApiError', async () => {
        const issueInput = {
            issueType: 'Epic',
            summary: 'Custom Error Test',
            status: 'In Progress', // Status is validated by controller but not passed to service
        };
        // Assuming ApiError exists with statusCode and message properties
        const customError = new ApiError(409, 'Issue already exists');

        // Mock the service call to reject with a custom error
        mockedCreateIssueService.mockRejectedValue(customError);

        const req = mockRequest(issueInput);
        const res = mockResponse();

        // Spy on console.error to ensure *custom* errors are not logged as generic errors
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});


        await createIssue(req, res);

        // Verify the service was called with the correct input *excluding* status
        expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
         expect(mockedCreateIssueService).toHaveBeenCalledWith({
             issueType: 'Epic',
             summary: 'Custom Error Test',
             description: '',
             parentIssueKey: undefined,
             // Status should NOT be passed to the service
        });

        // Verify the controller responded with the custom error status and message
        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ message: 'Issue already exists' });

        // Verify the error was NOT logged as a generic server error (because it's a known API error)
        expect(consoleSpy).not.toHaveBeenCalled();

         consoleSpy.mockRestore(); // Restore console.error
    });
});
