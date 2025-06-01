import { Request, Response } from 'express';
import { createIssue } from './createIssue'; // Import the controller function
import { AnyIssue, CreateIssueInput } from '../../models'; // Import necessary types

// Import the service function to be mocked.
import { createIssue as actualServiceCreateIssue, getIssueByKey } from '../../services/issueService';

// Mock the issueService module.
jest.mock('../../services/issueService', () => ({
  createIssue: jest.fn<Promise<AnyIssue>, [CreateIssueInput]>(),
  getIssueByKey: jest.fn<Promise<AnyIssue | undefined>, [string]>(),
}));

// Cast the (already mocked) imported service function to Jest's mock type.
const mockedCreateIssueService = actualServiceCreateIssue as jest.MockedFunction<typeof actualServiceCreateIssue>;
const mockedGetIssueByKeyService = getIssueByKey as jest.MockedFunction<typeof getIssueByKey>;

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
            // issueType is missing
        });
        const res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Assert against the updated format
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing or invalid \'issuetype\' name in request fields.'], errors: {} });

        // Verify service was NOT called
        expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    it('should return 400 with error messages if summary is missing or empty', async () => {
        // Test missing summary
        let req = mockRequest({
            issueType: {name: 'Task'},
            // summary is missing
        });
        let res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
         // Assert against the updated format and message
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing or invalid \'summary\' in request fields.'], errors: {} });
        expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Verify service was NOT called

        // Test empty summary
        req = mockRequest({
            issueType: {name: 'Task'},
            summary: '', // Empty string
        });
        res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Assert against the updated format and message
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing or invalid \'summary\' in request fields.'], errors: {} });
        expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Verify service was NOT called

         // Test whitespace summary
        req = mockRequest({
            issueType: {name: 'Task'},
            summary: '   ', // Whitespace string
        });
        res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Assert against the updated format and message
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing or invalid \'summary\' in request fields.'], errors: {} });
        expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Verify service was NOT called
    });

     it('should return 400 with error messages if issuetype name is missing or empty', async () => {
        // Test missing issueType name
        let req = mockRequest({
            summary: 'Missing Issue Type Name',
            issueType: {
                //name is missing
            },
        });
        let res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
         // Assert against the updated format and message
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing or invalid \'issuetype\' name in request fields.'], errors: {} });
        expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Verify service was NOT called

        // Test empty issueType name
        req = mockRequest({
            summary: 'Empty Issue Type Name',
            issueType: {name: ''},
        });
        res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Assert against the updated format and message
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing or invalid \'issuetype\' name in request fields.'], errors: {} });
        expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Verify service was NOT called

         // Test whitespace summary
        req = mockRequest({
            summary: 'Whitespace Issue Type Name',
            issueType: {name: '   '},
        });
        res = mockResponse();

        await createIssue(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        // Assert against the updated format and message
        expect(res.json).toHaveBeenCalledWith({ errorMessages: ['Missing or invalid \'issuetype\' name in request fields.'], errors: {} });
        expect(mockedCreateIssueService).not.toHaveBeenCalled(); // Verify service was NOT called
    });


    // --- Validation Tests (Invalid Values - Controller handles these, service should not be called) ---


    // --- Validation Tests (Parent Issue Key Validation) ---

    it('should return 404 if parent key does not exist', async () => {
      const parentKey = 'NONEXISTENT-123';
      mockedGetIssueByKeyService.mockResolvedValueOnce(undefined); // Simulate parent not found
      const req = mockRequest({
        summary: 'Test Issue',
        issueType: { name: 'Task' },
        fields: {
            parent: { key: parentKey },
          },
      });
      const res = mockResponse();

      await createIssue(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        errorMessages: [`Parent issue with key '${parentKey}' not found.`],
        errors: {},
      });
      expect(mockedGetIssueByKeyService).toHaveBeenCalledWith(parentKey);
      expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

    it('should call the service if parent key exists and is valid', async () => {
      const parentKey = 'PROJECT-123';
      const validParentIssue: AnyIssue = {
        id: 'parent-id',
        key: parentKey,
        issueType: 'Epic',
        summary: 'Parent Issue',
        description: '',
        status: 'Todo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockedGetIssueByKeyService.mockResolvedValueOnce(validParentIssue);
      const req = mockRequest({
        summary: 'Test Issue',
        issueType: { name: 'Task' },
        fields: {
            parent: { key: parentKey },
          },
      });
      const res = mockResponse();

      await createIssue(req, res);

      expect(res.status).toHaveBeenCalledWith(201); // Assuming success
      expect(mockedGetIssueByKeyService).toHaveBeenCalledWith(parentKey);
      expect(mockedCreateIssueService).toHaveBeenCalled();
    });

    it('should return 400 if subtask has invalid parent type', async () => {
      const parentKey = 'PROJECT-123';
      const invalidParentIssue: AnyIssue = {
        id: 'parent-id',
        key: parentKey,
        issueType: 'Bug', // Invalid Parent
        summary: 'Parent Issue',
        description: '',
        status: 'Todo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockedGetIssueByKeyService.mockResolvedValueOnce(invalidParentIssue);
      const req = mockRequest({
        summary: 'Test Subtask',
        issueType: { name: 'Subtask' },
        fields: {
            parent: { key: parentKey },
          },
      });
      const res = mockResponse();

      await createIssue(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errorMessages: [`Parent issue with key '${parentKey}' must be of type 'Task' or 'Story' for a Subtask.`],
        errors: {},
      });
      expect(mockedGetIssueByKeyService).toHaveBeenCalledWith(parentKey);
      expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

     it('should return 400 if task/story has invalid parent type', async () => {
      const parentKey = 'PROJECT-123';
      const invalidParentIssue: AnyIssue = {
        id: 'parent-id',
        key: parentKey,
        issueType: 'Bug', // Invalid Parent
        summary: 'Parent Issue',
        description: '',
        status: 'Todo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockedGetIssueByKeyService.mockResolvedValueOnce(invalidParentIssue);
      const req = mockRequest({
        summary: 'Test Task',
        issueType: { name: 'Task' },
        fields: {
            parent: { key: parentKey },
          },
      });
      const res = mockResponse();

      await createIssue(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errorMessages: [`Parent issue with key '${parentKey}' must be of type 'Epic' for a Task or Story.`],
        errors: {},
      });
      expect(mockedGetIssueByKeyService).toHaveBeenCalledWith(parentKey);
      expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

     it('should call the service if task/story has valid parent type (Epic)', async () => {
      const parentKey = 'PROJECT-123';
      const validParentIssue: AnyIssue = {
        id: 'parent-id',
        key: parentKey,
        issueType: 'Epic', // Valid Parent
        summary: 'Parent Issue',
        description: '',
        status: 'Todo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockedGetIssueByKeyService.mockResolvedValueOnce(validParentIssue);
      const req = mockRequest({
        summary: 'Test Task',
        issueType: { name: 'Task' },
        fields: {
            parent: { key: parentKey },
          },
      });
      const res = mockResponse();

      await createIssue(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockedGetIssueByKeyService).toHaveBeenCalledWith(parentKey);
      expect(mockedCreateIssueService).toHaveBeenCalled();
    });

     it('should call the service if subtask has valid parent type (Task or Story)', async () => {
      const parentKey = 'PROJECT-123';
      const validParentIssue: AnyIssue = {
        id: 'parent-id',
        key: parentKey,
        issueType: 'Story', // Valid Parent
        summary: 'Parent Issue',
        description: '',
        status: 'Todo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockedGetIssueByKeyService.mockResolvedValueOnce(validParentIssue);
      const req = mockRequest({
        summary: 'Test Subtask',
        issueType: { name: 'Subtask' },
        fields: {
            parent: { key: parentKey },
          },
      });
      const res = mockResponse();

      await createIssue(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(mockedGetIssueByKeyService).toHaveBeenCalledWith(parentKey);
      expect(mockedCreateIssueService).toHaveBeenCalled();
    });

     it('should return 400 if Epic has a parent', async () => {
      const req = mockRequest({
        summary: 'Test Epic with Parent',
        issueType: { name: 'Epic' }, // Epic type
        fields: {
            parent: { key: 'SOME-PARENT-123' }, // Has a parent
          },
      });
      const res = mockResponse();

      await createIssue(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errorMessages: ["Issue type 'Epic' cannot have a parent."],
        errors: {},
      });
      expect(mockedGetIssueByKeyService).not.toHaveBeenCalled(); // Validation should happen before checking parent key
      expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });

     it('should return 400 if Bug has a parent', async () => {
      const req = mockRequest({
        summary: 'Test Bug with Parent',
        issueType: { name: 'Bug' }, // Bug type
        fields: {
            parent: { key: 'SOME-PARENT-456' }, // Has a parent
          },
      });
      const res = mockResponse();

      await createIssue(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errorMessages: ["Issue type 'Bug' cannot have a parent."],
        errors: {},
      });
      expect(mockedGetIssueByKeyService).not.toHaveBeenCalled(); // Validation should happen before checking parent key
      expect(mockedCreateIssueService).not.toHaveBeenCalled();
    });
});
