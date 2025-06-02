import { Request, Response } from 'express';
// Import the service functions to be mocked
import {
  createIssue as actualServiceCreateIssue,
  getIssueByKey as actualServiceGetIssueByKey,
} from '../../issueService';
// Import issue types and interfaces
import { AnyIssue, CreateIssueInput, IssueType } from '../../models'; // Import specific types
// Import logger after mock definition
// import logger from '../../utils/logger'; // Will import after mock

// Mock the issueService module.
jest.mock('../../issueService', () => ({
  createIssue: jest.fn<Promise<AnyIssue>, [CreateIssueInput]>(),
  // Update mock definition return type to match likely actual service return type (undefined for not found)
  getIssueByKey: jest.fn<Promise<AnyIssue | undefined>, [string]>(),
}));

// Mock the logger utility
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
import { createIssue } from './createIssue'; // Import the controller
import logger from '../../utils/logger'; // Import logger

// Cast the (already mocked) imported service functions to Jest's mock type.
const mockedCreateIssueService = actualServiceCreateIssue as jest.MockedFunction<typeof actualServiceCreateIssue>;
// Update mock variable type annotation to match definition
const mockedGetIssueByKeyService = actualServiceGetIssueByKey as jest.MockedFunction<typeof actualServiceGetIssueByKey>;
// Cast the (already mocked) imported logger functions to Jest's mock type.
const mockedLoggerError = logger.error as jest.Mock;
const mockedLoggerInfo = logger.info as jest.Mock;
const mockedLoggerDebug = logger.debug as jest.Mock; // Add mock for debug logging

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

// Define valid issue types (useful for validation tests) - Kept from original, though not directly used by these specific tests
// const allowedIssueTypes: AnyIssue['issueType'][] = ['Task', 'Story', 'Epic', 'Bug', 'Subtask'];

describe('createIssue Controller - Parent Issue Format and Existence Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return 400 if parentIssueKey has an invalid format', async () => {
    const invalidParentKey = 'INVALID-KEY-FORMAT';
    const issueInput = {
      fields: {
        issuetype: { name: 'Subtask' as IssueType },
        summary: 'Subtask with invalid parent key format',
        status: { name: 'Todo' },
        parent: { key: invalidParentKey }, // Invalid format
      },
    };
    const req = mockRequest(issueInput);
    const res = mockResponse();

    await createIssue(req, res);

    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Start processing request.');
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Received body:', { body: issueInput });
    // Expect debug log before parent key validation
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Validating parent key:', {
      parentKey: invalidParentKey,
    });

    // Expect validation error from controller, service should not be called
    // The service SHOULD NOT be called because the format validation throws FIRST
    expect(mockedGetIssueByKeyService).not.toHaveBeenCalled();
    expect(mockedCreateIssueService).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errorMessages: [`Parent issue key "${invalidParentKey}" is invalid. Must be in format PROJECT-123.`],
      errors: { parentKey: `Parent issue key "${invalidParentKey}" is invalid. Must be in format PROJECT-123.` },
    });
    // Expect logger.error to have been called twice: once inside the try block, once in the catch block
    expect(mockedLoggerError).toHaveBeenCalledTimes(2);
    // Check the log from inside the try block
    expect(mockedLoggerError).toHaveBeenCalledWith(
      'IssueCreationError during validation: Invalid parent key format.',
      expect.objectContaining({
        parentKey: invalidParentKey,
        error: 'INVALID_INPUT',
        statusCode: 400,
      }),
    );
    // Check the log from the catch block
    expect(mockedLoggerError).toHaveBeenCalledWith(
      'Caught IssueCreationError:',
      expect.objectContaining({
        code: 'INVALID_INPUT',
        status: 400,
        // Also check that the error message matches the one thrown
        error: `Parent issue key "${invalidParentKey}" is invalid. Must be in format PROJECT-123.`,
      }),
    );
  });

  it('should return 400 if parent is provided for an Epic', async () => {
    const issueInput = {
      fields: {
        issuetype: { name: 'Epic' as IssueType },
        summary: 'Epic with parent key',
        status: { name: 'Todo' },
        parent: { key: 'PROJ-123' }, // Epics cannot have parents
      },
    };
    const req = mockRequest(issueInput);
    const res = mockResponse();

    await createIssue(req, res);

    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Start processing request.');
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Received body:', { body: issueInput });

    expect(mockedGetIssueByKeyService).not.toHaveBeenCalled();
    expect(mockedCreateIssueService).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errorMessages: ['Epic and Bug issue types cannot have a parent issue.'],
      errors: {},
    });
    // Expect logger.error to have been called twice: once inside the try block, once in the catch block
    expect(mockedLoggerError).toHaveBeenCalledTimes(2);
    // Check the log from inside the try block
    expect(mockedLoggerError).toHaveBeenCalledWith(
      'IssueCreationError during validation: Epic/Bug cannot have a parent.',
      expect.objectContaining({
        issueType: 'Epic',
        parentKey: 'PROJ-123',
        error: 'INVALID_PARENT_KEY',
        statusCode: 400,
      }),
    );
    // Check the log from the catch block
    expect(mockedLoggerError).toHaveBeenCalledWith(
      'Caught IssueCreationError:',
      expect.objectContaining({
        code: 'INVALID_PARENT_KEY',
        status: 400,
        error: 'Epic and Bug issue types cannot have a parent issue.',
      }),
    );
  });

  it('should return 404 if parent issue key is valid format but issue not found', async () => {
    const parentKey = 'PROJ-999';
    const issueInput = {
      fields: {
        issuetype: { name: 'Subtask' as IssueType },
        summary: 'Subtask with non-existent parent',
        status: { name: 'Todo' },
        parent: { key: parentKey }, // Valid format
      },
    };
    const req = mockRequest(issueInput);
    const res = mockResponse();

    mockedGetIssueByKeyService.mockResolvedValue(undefined);

    await createIssue(req, res);

    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Start processing request.');
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Received body:', { body: issueInput });
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Validating parent key:', {
      parentKey: parentKey,
    });

    expect(mockedGetIssueByKeyService).toHaveBeenCalledWith(parentKey);
    expect(mockedCreateIssueService).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      errorMessages: [`Parent issue with key '${parentKey}' not found.`],
      errors: {},
    });
    // Expect logger.error to have been called twice: once inside the try block, once in the catch block
    expect(mockedLoggerError).toHaveBeenCalledTimes(2);
    // Check the log from inside the try block
    expect(mockedLoggerError).toHaveBeenCalledWith(
      'IssueCreationError during validation: Parent issue not found.',
      expect.objectContaining({
        parentKey: parentKey,
        error: 'PARENT_ISSUE_NOT_FOUND',
        statusCode: 404,
      }),
    );
    // Check the log from the catch block
    expect(mockedLoggerError).toHaveBeenCalledWith(
      'Caught IssueCreationError:',
      expect.objectContaining({
        code: 'PARENT_ISSUE_NOT_FOUND',
        status: 404,
        error: `Parent issue with key '${parentKey}' not found.`,
      }),
    );
  });

  it('should return 400 if Subtask parent issue is not Task or Story', async () => {
    const parentKey = 'PROJ-123';
    const issueInput = {
      fields: {
        issuetype: { name: 'Subtask' as IssueType },
        summary: 'Subtask under wrong parent type',
        status: { name: 'Todo' },
        parent: { key: parentKey },
      },
    };
    // Mock a parent issue of type Epic
    const mockParentIssue: AnyIssue = {
      id: 'parent-id-123',
      key: parentKey,
      summary: 'Parent Epic',
      issueType: 'Epic' as IssueType, // Incorrect type for Subtask parent
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectKey: 'PROJ',
      childIssueKeys: [],
    };
    const req = mockRequest(issueInput);
    const res = mockResponse();

    mockedGetIssueByKeyService.mockResolvedValue(mockParentIssue);

    await createIssue(req, res);

    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Start processing request.');
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Received body:', { body: issueInput });
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Validating parent key:', {
      parentKey: parentKey,
    });

    expect(mockedGetIssueByKeyService).toHaveBeenCalledWith(parentKey);
    expect(mockedCreateIssueService).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errorMessages: [`Parent issue with key '${parentKey}' must be of type 'Task' or 'Story' for a Subtask.`],
      errors: {},
    });
    // Expect logger.error to have been called twice
    expect(mockedLoggerError).toHaveBeenCalledTimes(2);
    // Check the log from inside the try block
    expect(mockedLoggerError).toHaveBeenCalledWith(
      'IssueCreationError during validation: Invalid parent type for Subtask.',
      expect.objectContaining({
        parentKey: parentKey,
        parentType: 'Epic',
        issueType: 'Subtask',
        error: 'INVALID_PARENT_TYPE',
        statusCode: 400, // Corrected expectation
      }),
    );
    // Check the log from the catch block
    expect(mockedLoggerError).toHaveBeenCalledWith(
      'Caught IssueCreationError:',
      expect.objectContaining({
        code: 'INVALID_PARENT_TYPE',
        status: 400,
        error: `Parent issue with key '${parentKey}' must be of type 'Task' or 'Story' for a Subtask.`,
      }),
    );
  });

  it('should return 400 if Task/Story parent issue is not Epic', async () => {
    const parentKey = 'PROJ-456';
    const issueInput = {
      fields: {
        issuetype: { name: 'Task' as IssueType }, // Testing Task
        summary: 'Task under wrong parent type',
        status: { name: 'Todo' },
        parent: { key: parentKey },
      },
    };
    // Mock a parent issue of type Story
    const mockParentIssue: AnyIssue = {
      id: 'parent-id-456',
      key: parentKey,
      summary: 'Parent Story',
      issueType: 'Story' as IssueType, // Incorrect type for Task/Story parent
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectKey: 'PROJ',
    };
    const req = mockRequest(issueInput);
    const res = mockResponse();

    mockedGetIssueByKeyService.mockResolvedValue(mockParentIssue);

    await createIssue(req, res);

    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Start processing request.');
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Received body:', { body: issueInput });
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Validating parent key:', {
      parentKey: parentKey,
    });

    expect(mockedGetIssueByKeyService).toHaveBeenCalledWith(parentKey);
    expect(mockedCreateIssueService).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errorMessages: [`Parent issue with key '${parentKey}' must be of type 'Epic' for a Task or Story.`],
      errors: {},
    });
    // Expect logger.error to have been called twice
    expect(mockedLoggerError).toHaveBeenCalledTimes(2);
    // Check the log from inside the try block
    expect(mockedLoggerError).toHaveBeenCalledWith(
      'IssueCreationError during validation: Invalid parent type for Task/Story.',
      expect.objectContaining({
        parentKey: parentKey,
        parentType: 'Story',
        issueType: 'Task', // This should match the input issue type
        error: 'INVALID_PARENT_TYPE',
        statusCode: 400, // Corrected expectation
      }),
    );
    // Check the log from the catch block
    expect(mockedLoggerError).toHaveBeenCalledWith(
      'Caught IssueCreationError:',
      expect.objectContaining({
        code: 'INVALID_PARENT_TYPE',
        status: 400,
        error: `Parent issue with key '${parentKey}' must be of type 'Epic' for a Task or Story.`,
      }),
    );
  });

  it('should proceed to call service if parent issue key is valid format, parent exists and type is valid', async () => {
    const parentKey = 'PROJ-123';
    const issueInput = {
      fields: {
        issuetype: { name: 'Subtask' as IssueType },
        summary: 'Valid Subtask with parent',
        status: { name: 'Todo' },
        parent: { key: parentKey },
      },
    };
    const mockParentIssue: AnyIssue = {
      id: 'parent-id-123',
      key: parentKey,
      summary: 'Parent Task',
      issueType: 'Task' as IssueType, // Valid type for Subtask parent
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectKey: 'PROJ',
    };
    const mockCreatedIssue: AnyIssue = {
      id: 'new-id-1',
      key: 'PROJ-1',
      summary: 'Valid Subtask with parent',
      issueType: 'Subtask' as IssueType,
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      projectKey: 'PROJ',
      parentKey: parentKey,
    };
    const req = mockRequest(issueInput);
    const res = mockResponse();

    mockedGetIssueByKeyService.mockResolvedValue(mockParentIssue);
    mockedCreateIssueService.mockResolvedValue(mockCreatedIssue);

    await createIssue(req, res);

    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Start processing request.');
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Received body:', { body: issueInput });
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Validating parent key:', {
      parentKey: parentKey,
    });

    expect(mockedGetIssueByKeyService).toHaveBeenCalledWith(parentKey);
    expect(mockedCreateIssueService).toHaveBeenCalledWith({
      title: issueInput.fields.summary,
      issueTypeName: issueInput.fields.issuetype.name,
      description: undefined,
      parentKey: parentKey,
    });

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'PROJ-1',
        summary: 'Valid Subtask with parent',
        issueType: { name: 'Subtask' },
      }),
    );

    expect(mockedLoggerError).not.toHaveBeenCalled(); // No errors expected
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Service call successful.');
    expect(mockedLoggerInfo).toHaveBeenCalledWith('createIssue Controller: Successfully created issue.', {
      issueKey: 'PROJ-1',
    });
  });
});
