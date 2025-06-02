import { Request, Response } from 'express';
// Import the service function to be mocked.
import { createIssue as actualServiceCreateIssue } from '../../issueService';
import { AnyIssue, CreateIssueInput, IssueType } from '../../models';
import { IssueCreationError, errorStatusCodeMap, IssueErrorCodes } from '../../utils/errorHandling';
// Import logger after mock definition
// import logger from '../../utils/logger'; // Will import after mock

// Mock the issueService module.
jest.mock('../../issueService', () => ({
  createIssue: jest.fn<Promise<AnyIssue>, [CreateIssueInput]>(),
}));

// Mock the logger utility - NEW STYLE - Using pattern for default exports
jest.mock('../../utils/logger', () => ({
  __esModule: true, // This tells Jest that the module is an ES module with a default export
  default: {
    // The default export is this object
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// NOW import the code under test and the logger
import { createIssue } from './createIssue'; // Import from the new file
import logger from '../../utils/logger'; // Import logger

// Cast the (already mocked) imported service function to Jest's mock type.
const mockedCreateIssueService = actualServiceCreateIssue as jest.MockedFunction<typeof actualServiceCreateIssue>;
// Cast the (already mocked) imported logger functions to Jest's mock type.
const mockedLoggerError = logger.error as jest.Mock;
const mockedLoggerInfo = logger.info as jest.Mock;
const mockedLoggerWarn = logger.warn as jest.Mock;
const mockedLoggerDebug = logger.debug as jest.Mock;

// Mock the request and response objects
const mockRequest = (body: any = {}): Request =>
  ({
    body,
  }) as Request;

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

describe('createIssue Controller - Parent Issue Service Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --- Service Error Handling (Parent Issue Related) ---

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
    const serviceError = new IssueCreationError(errorMessage, IssueErrorCodes.PARENT_ISSUE_NOT_FOUND, 404);
    mockedCreateIssueService.mockRejectedValueOnce(serviceError);

    await createIssue(req, res);

    // Verify service was called with transformed input (summary -> title, issueType -> issueTypeName)
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      title: issueInput.summary,
      issueTypeName: issueInput.issueType,
      description: '', // Default description
      parentKey: issueInput.parentIssueKey, // Expect the parentKey to be passed to service
    });

    // Verify logger was called
    expect(mockedLoggerError).toHaveBeenCalledWith(`Issue creation failed: ${serviceError.message}`, {
      errorCode: serviceError.errorCode,
      status: serviceError.statusCode,
      parentKey: issueInput.parentIssueKey,
    });
    // Verify info logs were called
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Start processing request.');
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Received body:', { body: issueInput });

    // Verify the controller handled the error correctly, returning the specified validation format
    expect(res.status).toHaveBeenCalledWith(404); // Status code comes from the error's statusCode or map
    expect(res.json).toHaveBeenCalledWith({
      errorMessages: [errorMessage], // Expect the message in the array
      errors: {}, // Expect empty errors object
    });
  });

  // This test was already using the correct PARENT_ISSUE_NOT_FOUND code
  it('should return 404 with error messages if service throws IssueCreationError with PARENT_ISSUE_NOT_FOUND (alternative message)', async () => {
    const parentKey = 'ANOTHER-NONEXISTENT-123'; // Use a different key for clarity
    const issueInput = {
      issueType: 'Task' as IssueType, // Can use any type, parentKey is key
      summary: 'Issue with non-existent parent handled by service (PARENT_ISSUE_NOT_FOUND)',
      status: 'Todo',
      parentIssueKey: parentKey,
    };
    const req = mockRequest(issueInput);
    const res = mockResponse();

    // Mock the service to throw the specific error with PARENT_ISSUE_NOT_FOUND
    const errorMessage = `Parent object with ID ${parentKey} could not be located.`; // A slightly different message
    const serviceError = new IssueCreationError(errorMessage, IssueErrorCodes.PARENT_ISSUE_NOT_FOUND, 404); // Use PARENT_ISSUE_NOT_FOUND code
    mockedCreateIssueService.mockRejectedValueOnce(serviceError);

    await createIssue(req, res);

    // Verify service was called
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      title: issueInput.summary,
      issueTypeName: issueInput.issueType,
      description: '', // Default description
      parentKey: issueInput.parentIssueKey, // Expect the parentKey to be passed to service
    });

    // Verify logger was called
    expect(mockedLoggerError).toHaveBeenCalledWith(`Issue creation failed: ${serviceError.message}`, {
      errorCode: serviceError.errorCode,
      status: serviceError.statusCode,
      parentKey: issueInput.parentIssueKey,
    });
    // Verify info logs were called
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Start processing request.');
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Received body:', { body: issueInput });

    // Verify the controller handled the error correctly, returning the specified validation format
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      errorMessages: [errorMessage],
      errors: {},
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
    const serviceError = new IssueCreationError(errorMessage, IssueErrorCodes.INVALID_PARENT_TYPE, 400);
    mockedCreateIssueService.mockRejectedValueOnce(serviceError);

    await createIssue(req, res);

    // Verify service was called with transformed input (summary -> title, issueType -> issueTypeName)
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      title: issueInput.summary,
      issueTypeName: issueInput.issueType,
      description: '', // Default description
      parentKey: issueInput.parentIssueKey, // Expect the parentKey to be passed to service
    });

    // Verify logger was called
    expect(mockedLoggerError).toHaveBeenCalledWith(`Issue creation failed: ${serviceError.message}`, {
      errorCode: serviceError.errorCode,
      status: serviceError.statusCode,
      parentKey: issueInput.parentIssueKey,
      issueType: issueInput.issueType,
    });
    // Verify info logs were called
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Start processing request.');
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Received body:', { body: issueInput });

    // Verify the controller handled the error correctly, returning the specified validation format
    expect(res.status).toHaveBeenCalledWith(400); // Status code comes from the error's statusCode or map
    expect(res.json).toHaveBeenCalledWith({
      errorMessages: [errorMessage], // Expect the message in the array
      errors: {}, // Expect empty errors object
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
    const serviceError = new IssueCreationError(errorMessage, IssueErrorCodes.INVALID_PARENT_TYPE, 400);
    mockedCreateIssueService.mockRejectedValueOnce(serviceError);

    await createIssue(req, res);

    // Verify service was called with transformed input
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      title: issueInput.summary,
      issueTypeName: issueInput.issueType,
      description: '',
      parentKey: issueInput.parentIssueKey,
    });

    // Verify logger was called
    expect(mockedLoggerError).toHaveBeenCalledWith(`Issue creation failed: ${serviceError.message}`, {
      errorCode: serviceError.errorCode,
      status: serviceError.statusCode,
      parentKey: issueInput.parentIssueKey,
      issueType: issueInput.issueType,
    });
    // Verify info logs were called
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Start processing request.');
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Received body:', { body: issueInput });

    // Verify the controller handled the error correctly
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errorMessages: [errorMessage],
      errors: {},
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
    const serviceError = new IssueCreationError(errorMessage, IssueErrorCodes.INVALID_PARENT_TYPE, 400);
    mockedCreateIssueService.mockRejectedValueOnce(serviceError);

    await createIssue(req, res);

    // Verify service was called with transformed input
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      title: issueInput.summary,
      issueTypeName: issueInput.issueType,
      description: '',
      parentKey: issueInput.parentIssueKey,
    });

    // Verify logger was called
    expect(mockedLoggerError).toHaveBeenCalledWith(`Issue creation failed: ${serviceError.message}`, {
      errorCode: serviceError.errorCode,
      status: serviceError.statusCode,
      parentKey: issueInput.parentIssueKey,
      issueType: issueInput.issueType,
    });
    // Verify info logs were called
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Start processing request.');
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Received body:', { body: issueInput });

    // Verify the controller handled the error correctly
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errorMessages: [errorMessage],
      errors: {},
    });
  });
});
