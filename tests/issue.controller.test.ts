import { Request, Response } from 'express';
import { IssueController } from '../src/controllers/issue.controller';
import { IssueService } from '../src/services/issue.service';
import { createIssueSchema } from '../src/controllers/schemas/issue.schema';
import logger from '../src/utils/logger';
import { ZodError } from 'zod';

const mockIssueService = {
  create: jest.fn(),
  findByKey: jest.fn(),
  deleteByKey: jest.fn(),
};

jest.mock('../src/services/issue.service', () => {
  return {
    IssueService: jest.fn(() => mockIssueService),
  };
});

// Mock the logger
jest.mock('../src/utils/logger');
const mockedLogger = logger as jest.Mocked<typeof logger>;

describe('IssueController', () => {
  let issueController: IssueController;
  let req: Request;
  let res: Response;
  let mockedIssueService: any;

  beforeEach(() => {
    // Ensure mocks are clear before each test
    (mockIssueService.create as jest.Mock).mockClear();
    (mockIssueService.findByKey as jest.Mock).mockClear();
    (mockIssueService.deleteByKey as jest.Mock).mockClear();
    mockedLogger.error.mockClear();

    issueController = new IssueController(mockIssueService as any);
    req = {} as Request;
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    } as any as Response;
  });

  describe('createIssue', () => {
    it('should create an issue with valid data and return 201', async () => {
      // Data as it would be received in req.body
      const validReqBody = {
        title: 'Test Issue',
        description: 'Test Description',
        issueType: 'Bug', // This will be ignored by the schema
        priority: 'HIGH', // Corrected enum value
      };
      // Data after being parsed by createIssueSchema
      const expectedParsedData = {
        title: 'Test Issue',
        description: 'Test Description',
        priority: 'HIGH',
        statusId: 1, // Defaulted by schema
      };
      req.body = validReqBody;
      (mockIssueService.create as jest.Mock).mockResolvedValue(expectedParsedData);

      await issueController.createIssue(req, res);

      expect(mockIssueService.create).toHaveBeenCalledWith(expectedParsedData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'Issue created', data: expectedParsedData });
    });

    it('should return a 400 error with invalid data', async () => {
      const invalidData = {
        title: 'in',
        description: 'Test Description',
        issueType: 'Bug',
        priority: 'HIGH',
      };
      req.body = invalidData;

      await issueController.createIssue(req, res);

      expect(mockIssueService.create).not.toHaveBeenCalled();
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
            path: ['title'],
            type: 'string',
          },
        ],
      });
    });

    it('should handle unexpected errors and return 500', async () => {
      const validReqBody = {
        title: 'Test Issue',
        description: 'Test Description',
        issueType: 'Bug',
        priority: 'HIGH',
      };
      const expectedParsedData = {
        title: 'Test Issue',
        description: 'Test Description',
        priority: 'HIGH',
        statusId: 1, // Defaulted by schema
      };

      req.body = validReqBody;
      const errorMessage = 'Unexpected error';
      (mockIssueService.create as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await issueController.createIssue(req, res);

      expect(mockIssueService.create).toHaveBeenCalledWith(expectedParsedData);
      expect(mockedLogger.error).toHaveBeenCalledWith('Error creating issue:', new Error(errorMessage));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error', error: errorMessage });
    });
  });

  describe('getIssue', () => {
    it('should get an issue with a valid issue key and return 200', async () => {
      const issueKey = 'TEST-123';
      const issueData = { issueKey: issueKey, title: 'Test Issue' };
      req.params = { issueKey: issueKey };
      (mockIssueService.findByKey as jest.Mock).mockResolvedValue(issueData);

      await issueController.getIssue(req, res);

      expect(mockIssueService.findByKey).toHaveBeenCalledWith(issueKey);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ data: issueData });
    });

    it('should return a 404 error if the issue is not found', async () => {
      const issueKey = 'NONEXISTENT-123';
      req.params = { issueKey: issueKey };
      (mockIssueService.findByKey as jest.Mock).mockResolvedValue(null);

      await issueController.getIssue(req, res);

      expect(mockIssueService.findByKey).toHaveBeenCalledWith(issueKey);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Issue not found' });
    });

    it('should handle unexpected errors during getIssue and return 500', async () => {
      const issueKey = 'TEST-123';
      req.params = { issueKey: issueKey };
      const errorMessage = 'Unexpected error';
      (mockIssueService.findByKey as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await issueController.getIssue(req, res);

      expect(mockIssueService.findByKey).toHaveBeenCalledWith(issueKey);
      expect(mockedLogger.error).toHaveBeenCalledWith(`Error getting issue with key ${issueKey}:`, new Error(errorMessage));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('deleteIssue', () => {
    it('should delete an issue with a valid issue key and return 204', async () => {
      const issueKey = 'TEST-123';
      req.params = { issueKey: issueKey };
      (mockIssueService.deleteByKey as jest.Mock).mockResolvedValue(true);

      await issueController.deleteIssue(req, res);

      expect(mockIssueService.deleteByKey).toHaveBeenCalledWith(issueKey);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return a 404 error if the issue to delete is not found', async () => {
      const issueKey = 'NONEXISTENT-123';
      req.params = { issueKey: issueKey };
      (mockIssueService.deleteByKey as jest.Mock).mockResolvedValue(false);

      await issueController.deleteIssue(req, res);

      expect(mockIssueService.deleteByKey).toHaveBeenCalledWith(issueKey);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Issue not found' });
    });

    it('should handle unexpected errors during deleteIssue and return 500', async () => {
      const issueKey = 'TEST-123';
      req.params = { issueKey: issueKey };
      const errorMessage = 'Unexpected error';
      (mockIssueService.deleteByKey as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await issueController.deleteIssue(req, res);

      expect(mockIssueService.deleteByKey).toHaveBeenCalledWith(issueKey);
      expect(mockedLogger.error).toHaveBeenCalledWith(`Error deleting issue with key ${issueKey}:`, new Error(errorMessage));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });
});
