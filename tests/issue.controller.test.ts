import { Request, Response } from 'express';
import { IssueController } from '../src/controllers/issue.controller';
import { IssueService } from '../src/services/issue.service';
import { createIssueBodySchema as createIssueSchema } from '../src/controllers/schemas/issue.schema';
import logger from '../src/utils/logger';

// Mock the logger
jest.mock('../src/utils/logger');
const mockedLogger = logger as jest.Mocked<typeof logger>;

let issueController: IssueController;
let req: Request;
let res: Response;
let issueService: IssueService;

describe('IssueController', () => {

  beforeEach(() => {
    issueService = new IssueService();
    issueController = new IssueController(issueService);
    jest.spyOn(issueService, 'create');
    jest.spyOn(issueService, 'findByKey');
    jest.spyOn(issueService, 'deleteByKey');

    // Ensure mocks are clear before each test
    mockedLogger.error.mockClear();

    req = {} as Request;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    } as any as Response;
  });

  describe('create', () => {
    it('should create an issue with valid data and return 201', async () => {
      const validReqBody = {
        fields: {
          summary: 'Test Issue',
          description: 'Test Description',
          issuetype: {
            id: '1',
          },
        },
      };
      const expectedParsedData = validReqBody;
      req.body = validReqBody;
      (issueService.create as jest.Mock).mockResolvedValue({
        id: 1,
        issueKey: 'TEST-1',
        self: '/rest/api/2/issue/TEST-1',
      });

      await issueController.create(req, res);

      expect(issueService.create).toHaveBeenCalledWith(expectedParsedData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        key: 'TEST-1',
        self: '/rest/api/2/issue/TEST-1',
      });
    });

    it('should return a 400 error with invalid data', async () => {
      const invalidData = {
        fields: {
          summary: 'in',
          description: 'Test Description',
          issuetype: {
            id: '1',
          },
        },
      };
      req.body = invalidData;

      await issueController.create(req, res);

      expect(issueService.create).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Validation error',
        errors: [
          {
            code: 'too_small',
            exact: false,
            minimum: 3,
            inclusive: true,
            message: 'String must contain at least 3 character(s)',
            path: ['fields', 'summary'],
            type: 'string',
          },
        ],
      });
    });

    it('should handle unexpected errors and return 500', async () => {
      const validReqBody = {
        fields: {
          summary: 'Test Issue',
          description: 'Test Description',
          reporterKey: 'user-1',
          assigneeKey: 'user-1',
          issuetype: {
            id: '1',
          },
        },
      };

      req.body = validReqBody;
      const errorMessage = 'Unexpected error';
      (issueService.create as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await issueController.create(req, res);

      expect(issueService.create).toHaveBeenCalledWith(validReqBody);
      expect(mockedLogger.error).toHaveBeenCalledWith('Error creating issue:', new Error(errorMessage));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error', error: errorMessage });
    });
  });

  describe('findByKey', () => {
    it('should get an issue with a valid issue key and return 200', async () => {
      const issueKey = 'TEST-123';
      const issueData = { issueKey: issueKey, title: 'Test Issue', self: `/rest/api/2/issue/${issueKey}`, summary: 'Test Issue', description: 'Test Description' };
      req.params = { issueKey: issueKey };
      (issueService.findByKey as jest.Mock).mockResolvedValue(issueData);

      await issueController.findByKey(req, res);

      expect(issueService.findByKey).toHaveBeenCalledWith(issueKey);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: issueData });
    });

    it('should return a 404 error if the issue is not found', async () => {
      const issueKey = 'NONEXISTENT-123';
      req.params = { issueKey: issueKey };
      (issueService.findByKey as jest.Mock).mockResolvedValue(null);

      await issueController.findByKey(req, res);

      expect(issueService.findByKey).toHaveBeenCalledWith(issueKey);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Issue not found' });
    });

    it('should handle unexpected errors during findByKey and return 500', async () => {
      const issueKey = 'TEST-123';
      req.params = { issueKey: issueKey };
      const errorMessage = 'Unexpected error';
      (issueService.findByKey as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await issueController.findByKey(req, res);

      expect(issueService.findByKey).toHaveBeenCalledWith(issueKey);
      expect(mockedLogger.error).toHaveBeenCalledWith(`Error getting issue with key ${issueKey}:`, new Error(errorMessage));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('delete', () => {
    it('should delete an issue with a valid issue key and return 204', async () => {
      const issueKey = 'TEST-123';
      req.params = { issueKey: issueKey };
      (issueService.deleteByKey as jest.Mock).mockResolvedValue(true);

      await issueController.delete(req, res);

      expect(issueService.deleteByKey).toHaveBeenCalledWith(issueKey);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return a 404 error if the issue to delete is not found', async () => {
      const issueKey = 'NONEXISTENT-123';
      req.params = { issueKey: issueKey };
      (issueService.deleteByKey as jest.Mock).mockResolvedValue(false);

      await issueController.delete(req, res);

      expect(issueService.deleteByKey).toHaveBeenCalledWith(issueKey);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Issue not found' });
    });

    it('should handle unexpected errors during delete and return 500', async () => {
      const issueKey = 'TEST-123';
      req.params = { issueKey: issueKey };
      const errorMessage = 'Unexpected error';
      (issueService.deleteByKey as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await issueController.delete(req, res);

      expect(issueService.deleteByKey).toHaveBeenCalledWith(issueKey);
      expect(mockedLogger.error).toHaveBeenCalledWith(`Error deleting issue with key ${issueKey}:`, new Error(errorMessage));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });
});
