// src/api/controllers/issueController.createIssue.spec.ts
import { IssueController } from './issueController';
import { DatabaseService } from '../../services/databaseService';
import { databaseService } from '../../services/database';
import { IssueKeyService } from '../../services/issueKeyService';
import { IssueStatusTransitionService } from '../../services/issueStatusTransitionService';
import { Request, Response } from 'express';
import { Issue } from '../../models/issue';
import { ObjectId } from 'mongodb'; // Used for _id generation in tests
import httpMocks from 'node-mocks-http';
import { triggerWebhooks } from '../../services/webhookService';
import { formatIssueResponse } from '../../utils/jsonTransformer'; // Assuming this is where the function is
import { getDBConnection } from '../../config/db';
import { initializeDatabaseSchema } from '../../config/databaseSchema';

// Mock external dependencies
jest.mock('../../services/webhookService', () => ({}));
jest.mock('../../services/issueKeyService');
jest.mock('../../services/issueStatusTransitionService');

const mockTriggerWebhooks = triggerWebhooks as jest.Mock;
type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; };
describe('IssueController - createIssue', () => {
    jest.setTimeout(30000);
    
    let controller: IssueController;
    let mockRequest: httpMocks.MockRequest<Request>;
    let mockResponse: httpMocks.MockResponse<Response>;
    const mockNext: jest.Mock = jest.fn();

    beforeAll(async () => {
        const db = await getDBConnection();
        await databaseService.connect(db);
        await initializeDatabaseSchema(databaseService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new IssueController(
            new DatabaseService(),
            new IssueKeyService(databaseService),
            new IssueStatusTransitionService(databaseService)
            );
        mockRequest = httpMocks.createRequest();
        mockResponse = httpMocks.createResponse();
    });

    it('should create an issue and trigger webhook', async () => {
        const issueData = {
            issuetype: 'task',
            summary: 'Test issue',
            description: 'Test description',
        };
        const issueKey = 'PROJ-1';
        const now = new Date().toISOString();
        const createdDbIssue: DbIssue = {
            _id: new ObjectId().toHexString(),
            id: 1,
            issuetype: issueData.issuetype,
            summary: issueData.summary,
            description: issueData.description,
            key: issueKey,
            status: 'To Do',
            assignee_key: null,
            created_at: now,
            updated_at: now
        };

        (IssueKeyService.prototype.getNextIssueKey as jest.Mock).mockResolvedValue(issueKey);
        
        mockRequest.body = issueData;
        await controller.createIssue(mockRequest as Request, mockResponse as Response);

        expect(IssueKeyService.prototype.getNextIssueKey).toHaveBeenCalled();
        
        expect(mockResponse.statusCode).toBe(201);
        const expectedFormattedIssue = formatIssueResponse(createdDbIssue);
        expect(JSON.parse(mockResponse._getData())).toEqual(expectedFormattedIssue);
        expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
        expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_created', expectedFormattedIssue);
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
        mockRequest.body = { summary: 'Incomplete issue' }; // Missing issuetype, description
        await controller.createIssue(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.statusCode).toBe(400);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Missing required fields' });
        expect(IssueKeyService.prototype.getNextIssueKey).not.toHaveBeenCalled();
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 if issue key generation fails', async () => {
        const error = new Error('Key generation failed');
        (IssueKeyService.prototype.getNextIssueKey as jest.Mock).mockRejectedValue(error);
        mockRequest.body = { issuetype: 'task', summary: 'Test', description: 'Desc' };

        await controller.createIssue(mockRequest as Request, mockResponse as Response);

        expect(IssueKeyService.prototype.getNextIssueKey).toHaveBeenCalled();
        expect(mockResponse.statusCode).toBe(500);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to create issue' });
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 if database insert fails', async () => {
        const issueData = { issuetype: 'bug', summary: 'Error case', description: 'DB fail' };
        const error = new Error('Database insert error');
        (IssueKeyService.prototype.getNextIssueKey as jest.Mock).mockResolvedValue('TASK-ERR');
        
        mockRequest.body = issueData;
        await controller.createIssue(mockRequest as Request, mockResponse as Response);

        expect(IssueKeyService.prototype.getNextIssueKey).toHaveBeenCalled();
        expect(mockResponse.statusCode).toBe(500);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to create issue' });
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 if database get after insert fails', async () => {
        const issueData = { issuetype: 'task', summary: 'Test issue', description: 'Test description' };
        const issueKey = 'PROJ-1';
        const error = new Error('Database get error');

        (IssueKeyService.prototype.getNextIssueKey as jest.Mock).mockResolvedValue(issueKey);
        
        mockRequest.body = issueData;
        await controller.createIssue(mockRequest as Request, mockResponse as Response);

        expect(IssueKeyService.prototype.getNextIssueKey).toHaveBeenCalled();
        expect(mockResponse.statusCode).toBe(500);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to create issue' });
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });
});