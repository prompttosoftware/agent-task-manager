import { Request, Response } from 'express';
import { createIssue } from './issueController'; // The controller function being tested
import { AnyIssue, CreateIssueInput } from '../../models';
// IssueCreationError and errorStatusCodeMap are not strictly needed for success tests but kept for consistency if shared setup is used later
import { IssueCreationError, errorStatusCodeMap } from '../../utils/errorHandling';

// Import the service function to be mocked.
// Jest hoists jest.mock, so this import will get the mocked version.
import { createIssue as actualServiceCreateIssue } from '../../issueService';

// Mock the issueService module.
// The factory function's return value replaces the module's exports.
// We explicitly type the mock function's signature for better type safety with mockResolvedValue/mockRejectedValue.
// Corrected Jest fn typing: jest.fn<ReturnType, Args>()
jest.mock('../../issueService', () => ({
  createIssue: jest.fn<Promise<AnyIssue>, [CreateIssueInput]>(), // Corrected typing here
}));

// Cast the (already mocked) imported service function to Jest's mock type.
// This provides type safety for .mockResolvedValue, .toHaveBeenCalledWith, etc.
const mockedCreateIssueService = actualServiceCreateIssue as jest.MockedFunction<typeof actualServiceCreateIssue>;

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

describe('createIssue Controller - Success Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should call issueService.createIssue with correct data and return 201 on success without description', async () => {
    const issueInput = {
      issueType: 'Bug',
      summary: 'Test Issue Without Description',
      status: 'Todo',
    };
    const expectedIssue: AnyIssue = {
      // Explicitly type expectedIssue
      id: 'mock-uuid-1',
      key: 'BUG-1',
      issueType: 'Bug',
      summary: 'Test Issue Without Description',
      status: 'Todo',
      description: '',
      parentKey: null, // Add parentKey property
      createdAt: '2023-01-01T10:00:00.000Z',
      updatedAt: '2023-01-01T10:00:00.000Z',
    };

    mockedCreateIssueService.mockResolvedValue(expectedIssue);

    const req = mockRequest(issueInput);
    const res = mockResponse();

    await createIssue(req, res);

    expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      issueTypeName: 'Bug',
      title: 'Test Issue Without Description',
      description: '',
      parentKey: null, // Changed from undefined to null
    } as CreateIssueInput); // Cast to CreateIssueInput for type safety in test call check

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expectedIssue);
  });

  it('should call issueService.createIssue with correct data and return 201 on success with description', async () => {
    const issueInput = {
      issueType: 'Story',
      summary: 'Test Issue With Description',
      status: 'In Progress',
      description: 'This is a test description.',
    };
    const expectedIssue: AnyIssue = {
      // Explicitly type expectedIssue
      id: 'mock-uuid-2',
      key: 'STOR-2',
      issueType: 'Story',
      summary: 'Test Issue With Description',
      status: 'In Progress',
      description: 'This is a test description.',
      parentKey: null, // Add parentKey property
      createdAt: '2023-01-01T10:00:00.000Z',
      updatedAt: '2023-01-01T10:00:00.000Z',
    };

    mockedCreateIssueService.mockResolvedValue(expectedIssue);

    const req = mockRequest(issueInput);
    const res = mockResponse();

    await createIssue(req, res);

    expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      issueTypeName: 'Story',
      title: 'Test Issue With Description',
      description: 'This is a test description.',
      parentKey: null, // Changed from undefined to null
    } as CreateIssueInput); // Cast to CreateIssueInput for type safety in test call check

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expectedIssue);
  });

  it('should call issueService.createIssue with correct data and return 201 for a Subtask with parentIssueKey', async () => {
    const parentKey = 'TASK-99';
    const issueInput = {
      issueType: 'Subtask',
      summary: 'Subtask of Parent',
      status: 'Todo',
      parentIssueKey: parentKey,
    };
    const expectedIssue: AnyIssue = {
      // Explicitly type expectedIssue
      id: 'mock-uuid-subtask-1',
      key: 'SUBT-3',
      issueType: 'Subtask',
      summary: 'Subtask of Parent',
      status: 'Todo',
      // Removed redundant parentIssueKey - AnyIssue likely uses parentKey
      parentKey: parentKey,
      description: '',
      createdAt: '2023-01-01T10:00:00.000Z',
      updatedAt: '2023-01-01T10:00:00.000Z',
    };

    mockedCreateIssueService.mockResolvedValue(expectedIssue);

    const req = mockRequest(issueInput);
    const res = mockResponse();

    await createIssue(req, res);

    expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      issueTypeName: 'Subtask',
      title: 'Subtask of Parent',
      description: '',
      parentKey: parentKey,
    } as CreateIssueInput); // Cast to CreateIssueInput for type safety in test call check

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expectedIssue);
  });
});

// Assume IssueErrorCodes is available from '../../utils/errorHandling' or elsewhere
// import { IssueCreationError, errorStatusCodeMap, IssueErrorCodes } from '../../utils/errorHandling';

describe('createIssue Controller - Error Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 400 if issueService.createIssue throws IssueCreationError with INVALID_PARENT_KEY', async () => {
    const issueInput = {
      issueType: 'Subtask',
      summary: 'Invalid Parent Test',
      status: 'Todo',
      parentIssueKey: 'NON-EXISTENT-PARENT',
    };

    // Assuming IssueErrorCodes and IssueCreationError are structured like this
    const IssueErrorCodes = {
      // Define locally for test if not imported
      INVALID_PARENT_KEY: 'INVALID_PARENT_KEY',
      // ... other codes potentially
    };
    const errorStatusCodeMap = {
      // Define locally for test if not imported
      [IssueErrorCodes.INVALID_PARENT_KEY]: 400,
      500: 500, // Add a default for unexpected errors
      // ... other mappings
    };
    class IssueCreationError extends Error {
      // Define locally for test if not imported
      code: string; // Use string to match the mock definition
      details?: any;

      constructor(code: string, message: string, details?: any) {
        super(message);
        this.code = code;
        this.details = details;
        // Set the prototype explicitly. See https://github.com/Microsoft/TypeScript/wiki/Breaking-Changes#extending-built-ins-like-error-array-and-map-may-no-longer-work
        Object.setPrototypeOf(this, IssueCreationError.prototype);
      }
    }

    const errorCode = IssueErrorCodes.INVALID_PARENT_KEY;
    const errorMessage = 'Parent issue with key NON-EXISTENT-PARENT not found or is not a valid parent.';
    const errorDetails = { parentKey: issueInput.parentIssueKey };
    const serviceError = new IssueCreationError(errorCode, errorMessage, errorDetails);

    mockedCreateIssueService.mockRejectedValue(serviceError);

    const req = mockRequest(issueInput);
    const res = mockResponse();

    await createIssue(req, res);

    expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      issueTypeName: 'Subtask',
      title: 'Invalid Parent Test',
      description: '',
      parentKey: issueInput.parentIssueKey,
    } as CreateIssueInput);

    // Expect the controller to handle the error
    expect(res.status).toHaveBeenCalledWith(errorStatusCodeMap[errorCode]);
    expect(res.json).toHaveBeenCalledWith({
      message: errorMessage,
      code: errorCode,
      details: errorDetails,
    });
  });

  it('should return a generic 500 if an unexpected error occurs', async () => {
    const issueInput = {
      issueType: 'Bug',
      summary: 'Unexpected Error Test',
      status: 'Todo',
    };

    const errorStatusCodeMap = {
      // Define locally for test if not imported
      500: 500, // Add a default for unexpected errors
      // ... other mappings
    };

    const unexpectedError = new Error('Something went wrong in the service');

    mockedCreateIssueService.mockRejectedValue(unexpectedError);

    const req = mockRequest(issueInput);
    const res = mockResponse();

    await createIssue(req, res);

    expect(mockedCreateIssueService).toHaveBeenCalledTimes(1);
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      issueTypeName: 'Bug',
      title: 'Unexpected Error Test',
      description: '',
      parentKey: null,
    } as CreateIssueInput);

    // Expect the controller to handle the unexpected error
    expect(res.status).toHaveBeenCalledWith(errorStatusCodeMap[500]); // Use the default 500 mapping
    // Assuming the controller sends a generic 500 response for unhandled errors
    expect(res.json).toHaveBeenCalledWith({ message: 'Internal Server Error' }); // Adjust based on actual controller implementation
  });
});
