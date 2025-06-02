// src/api/controllers/createIssue.logging.test.ts
import { Request, Response } from 'express';
import { createIssue as createIssueController } from './createIssue';
import * as issueServiceModule from '../../issueService';
import logger from '../../utils/logger';
import { IssueCreationError, IssueErrorCodes } from '../../utils/errorHandling';
import { AnyIssue, CreateIssueInput } from '../../models';

// Mock logger
// We are mocking the default export which is an object with info, warn, error methods
jest.mock('../../utils/logger', () => ({
  __esModule: true, // ES Module mock
  default: {
    info: jest.fn(),
    warn: jest.fn(), // Include warn for completeness, though not used by this controller
    error: jest.fn(),
  },
}));

// Mock issueService
// We are mocking the named export 'createIssue' from this module
jest.mock('../../issueService', () => ({
  __esModule: true, // ES Module mock
  createIssue: jest.fn(),
}));

// Type cast the mocked logger methods
const mockedLoggerInfo = logger.info as jest.Mock;
const mockedLoggerError = logger.error as jest.Mock;

// Type cast the mocked service function
const mockedServiceCreateIssue = issueServiceModule.createIssue as jest.MockedFunction<
  typeof issueServiceModule.createIssue
>;

// Helper to create a mock Express Response object
const createMockResponse = (): Response => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.send = jest.fn().mockReturnThis(); // .send() is not used by controller in these paths, but good for a generic mock
  return res as Response;
};

// Interface for the request body as expected by the controller
// Duplicating this interface here for test clarity and independence.
interface IncomingCreateIssueRequestBody {
  fields: {
    summary: string;
    description?: string;
    issuetype: {
      name: string;
    };
    parent?: {
      key: string;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

describe('createIssue Controller - Logging', () => {
  let mockReq: Request;
  let mockRes: Response;

  beforeEach(() => {
    // Reset mocks before each test to clear call history and mock implementations
    mockedLoggerInfo.mockReset();
    mockedLoggerError.mockReset();
    mockedServiceCreateIssue.mockReset();

    mockRes = createMockResponse(); // Create a fresh response mock for each test
  });

  describe('Successful Creation', () => {
    it('should call all logger.info methods with correct messages and data in the success path', async () => {
      const requestBody: IncomingCreateIssueRequestBody = {
        fields: {
          summary: 'Test Issue Summary',
          description: 'Detailed description of the test issue.',
          issuetype: { name: 'Task' },
          parent: { key: 'PARENT-ISSUE-1' },
        },
      };
      mockReq = { body: requestBody, params: {}, query: {} } as Request;

      const expectedServiceInput: CreateIssueInput = {
        title: requestBody.fields.summary,
        issueTypeName: requestBody.fields.issuetype.name,
        description: requestBody.fields.description,
        parentKey: requestBody.fields.parent?.key,
      };

      const now = new Date().toISOString();
      const mockCreatedIssue: AnyIssue = {
        id: 'test-id-123',
        key: 'TEST-1',
        issueType: 'Task',
        summary: requestBody.fields.summary,
        description: requestBody.fields.description,
        status: 'Todo',
        createdAt: now,
        updatedAt: now,
        parentKey: requestBody.fields.parent?.key,
      };
      mockedServiceCreateIssue.mockResolvedValue(mockCreatedIssue);

      const expectedResponseBody = {
        id: mockCreatedIssue.id,
        key: mockCreatedIssue.key,
        issueType: { name: mockCreatedIssue.issueType as string },
        summary: mockCreatedIssue.summary,
        description: mockCreatedIssue.description,
        status: { name: mockCreatedIssue.status as string },
        createdAt: mockCreatedIssue.createdAt,
        updatedAt: mockCreatedIssue.updatedAt,
        self: `/rest/api/2/issue/${mockCreatedIssue.key}`,
      };

      await createIssueController(mockReq, mockRes);

      expect(mockedLoggerInfo).toHaveBeenCalledTimes(6);
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(1, 'createIssue Controller: Start processing request.');
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(2, 'createIssue Controller: Received body:', {
        body: requestBody,
      });
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(3, 'createIssue Controller: Input passed to service:', {
        input: expectedServiceInput,
      });
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(4, 'createIssue Controller: Service call successful.');
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(5, 'createIssue Controller: Constructed Response Body:', {
        response: expectedResponseBody,
      });
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(6, 'createIssue Controller: Successfully created issue.', {
        issueKey: mockCreatedIssue.key,
      });

      expect(mockedLoggerError).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expectedResponseBody);
    });
  });

  describe('Invalid Request Body (Missing fields)', () => {
    it('should call logger.error with INVALID_INPUT and log caught error', async () => {
      const requestBody = {}; // Missing 'fields'
      // Use 'as any' for type flexibility in test setup, controller handles untyped input
      mockReq = { body: requestBody, params: {}, query: {} } as any;

      await createIssueController(mockReq, mockRes);

      expect(mockedLoggerInfo).toHaveBeenCalledTimes(2);
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(1, 'createIssue Controller: Start processing request.');
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(2, 'createIssue Controller: Received body:', {
        body: requestBody,
      });

      expect(mockedLoggerError).toHaveBeenCalledTimes(2);
      // First error log: Validation specific
      expect(mockedLoggerError).toHaveBeenNthCalledWith(
        1,
        'IssueCreationError during validation: Invalid request body format.',
        { error: IssueErrorCodes.INVALID_INPUT, statusCode: 400, body: requestBody },
      );
      // Second error log: From the catch block
      expect(mockedLoggerError).toHaveBeenNthCalledWith(2, 'Caught IssueCreationError:', {
        error: 'Invalid request body format.', // Message from the thrown IssueCreationError
        code: IssueErrorCodes.INVALID_INPUT,
        status: 400,
      });
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Invalid Request Body (Missing summary)', () => {
    it('should call logger.error with MISSING_TITLE and log caught error', async () => {
      const requestBody = {
        fields: {
          // summary is missing
          issuetype: { name: 'Bug' },
        },
      };
      mockReq = { body: requestBody, params: {}, query: {} } as any; // Cast for test purposes

      await createIssueController(mockReq, mockRes);

      expect(mockedLoggerInfo).toHaveBeenCalledTimes(2);
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(1, 'createIssue Controller: Start processing request.');
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(2, 'createIssue Controller: Received body:', {
        body: requestBody,
      });

      expect(mockedLoggerError).toHaveBeenCalledTimes(2);
      expect(mockedLoggerError).toHaveBeenNthCalledWith(
        1,
        "IssueCreationError during validation: Missing or invalid 'summary'.",
        { error: IssueErrorCodes.MISSING_TITLE, statusCode: 400, body: requestBody },
      );
      expect(mockedLoggerError).toHaveBeenNthCalledWith(2, 'Caught IssueCreationError:', {
        error: "Missing or invalid 'summary' in request fields.",
        code: IssueErrorCodes.MISSING_TITLE,
        status: 400,
      });
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Invalid Request Body (Missing issuetype name)', () => {
    it('should call logger.error with INVALID_ISSUE_TYPE and log caught error', async () => {
      const requestBody = {
        fields: {
          summary: 'A valid summary',
          issuetype: {
            /* name is missing */
          },
        },
      };
      mockReq = { body: requestBody, params: {}, query: {} } as any; // Cast for test purposes

      await createIssueController(mockReq, mockRes);

      expect(mockedLoggerInfo).toHaveBeenCalledTimes(2);
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(1, 'createIssue Controller: Start processing request.');
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(2, 'createIssue Controller: Received body:', {
        body: requestBody,
      });

      expect(mockedLoggerError).toHaveBeenCalledTimes(2);
      expect(mockedLoggerError).toHaveBeenNthCalledWith(
        1,
        "IssueCreationError during validation: Missing or invalid 'issuetype' name.",
        { error: IssueErrorCodes.INVALID_ISSUE_TYPE, statusCode: 400, body: requestBody },
      );
      expect(mockedLoggerError).toHaveBeenNthCalledWith(2, 'Caught IssueCreationError:', {
        error: "Missing or invalid 'issuetype' name in request fields.",
        code: IssueErrorCodes.INVALID_ISSUE_TYPE,
        status: 400,
      });
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Service Throws IssueCreationError', () => {
    it('should log preceding info messages and the caught IssueCreationError', async () => {
      const requestBody: IncomingCreateIssueRequestBody = {
        fields: {
          summary: 'Service Error Test',
          issuetype: { name: 'Story' },
        },
      };
      mockReq = { body: requestBody, params: {}, query: {} } as Request;

      const expectedServiceInput: CreateIssueInput = {
        title: requestBody.fields.summary,
        issueTypeName: requestBody.fields.issuetype.name,
        description: undefined, // No description provided in this requestBody
        parentKey: undefined, // No parent provided in this requestBody
      };

      const serviceError = new IssueCreationError('Service layer error', 'SERVICE_FAIL_CODE', 409);
      mockedServiceCreateIssue.mockRejectedValue(serviceError);

      await createIssueController(mockReq, mockRes);

      expect(mockedLoggerInfo).toHaveBeenCalledTimes(3); // Start, Received body, Input to service
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(1, 'createIssue Controller: Start processing request.');
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(2, 'createIssue Controller: Received body:', {
        body: requestBody,
      });
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(3, 'createIssue Controller: Input passed to service:', {
        input: expectedServiceInput,
      });

      expect(mockedLoggerError).toHaveBeenCalledTimes(1);
      expect(mockedLoggerError).toHaveBeenCalledWith('Caught IssueCreationError:', {
        error: serviceError.message,
        code: serviceError.errorCode,
        status: serviceError.statusCode,
      });
      expect(mockRes.status).toHaveBeenCalledWith(409);
    });
  });

  describe('Service Throws Unexpected Error', () => {
    it('should log preceding info messages and the unexpected error object', async () => {
      const requestBody: IncomingCreateIssueRequestBody = {
        fields: {
          summary: 'Unexpected Error Test',
          issuetype: { name: 'Epic' },
        },
      };
      mockReq = { body: requestBody, params: {}, query: {} } as Request;

      const expectedServiceInput: CreateIssueInput = {
        title: requestBody.fields.summary,
        issueTypeName: requestBody.fields.issuetype.name,
        description: undefined, // No description provided
        parentKey: undefined, // No parent provided
      };

      const unexpectedError = new Error('Something went very wrong!');
      mockedServiceCreateIssue.mockRejectedValue(unexpectedError);

      await createIssueController(mockReq, mockRes);

      expect(mockedLoggerInfo).toHaveBeenCalledTimes(3); // Start, Received body, Input to service
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(1, 'createIssue Controller: Start processing request.');
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(2, 'createIssue Controller: Received body:', {
        body: requestBody,
      });
      expect(mockedLoggerInfo).toHaveBeenNthCalledWith(3, 'createIssue Controller: Input passed to service:', {
        input: expectedServiceInput,
      });

      expect(mockedLoggerError).toHaveBeenCalledTimes(1);
      expect(mockedLoggerError).toHaveBeenCalledWith(
        'Unexpected error in createIssue controller:',
        unexpectedError, // The actual error object is expected here
      );
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
