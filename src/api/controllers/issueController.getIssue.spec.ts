 // src/api/controllers/issueController.getIssue.spec.ts

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
import { formatIssueResponse } from '../../utils/jsonTransformer';
import { getDBConnection } from '../../config/db';
import { initializeDatabaseSchema } from '../../config/databaseSchema';

// Mock external dependencies
jest.mock('../../services/webhookService', () => ({}));

jest.mock('../../services/issueKeyService');
jest.mock('../../services/issueStatusTransitionService');

const mockTriggerWebhooks = triggerWebhooks as jest.Mock;

type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; };

describe('IssueController - getIssue', () => {
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

    it('should get an issue by key', async () => {
        const now = new Date().toISOString();
        const dbIssue: DbIssue = {_id: new ObjectId().toHexString(), id: 1, issuetype: 'task', summary: 'Test issue', description: 'Test description', key: 'PROJECT-123', status: 'In Progress', assignee_key: null, created_at: now, updated_at: now};
        mockRequest.params = { issueIdOrKey: 'PROJECT-123' };
        await controller.getIssue(mockRequest as Request, mockResponse as Response);
        const expectedFormattedIssue = formatIssueResponse(dbIssue);
        expect(mockResponse.statusCode).toBe(200);
        expect(JSON.parse(mockResponse._getData())).toEqual(expectedFormattedIssue);
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should get an issue by ID', async () => {
        const now = new Date().toISOString();
        const dbIssue: DbIssue = {_id: new ObjectId().toHexString(), id: 1, issuetype: 'task', summary: 'Test issue', description: 'Test description', key: 'PROJECT-123', status: 'In Progress', assignee_key: null, created_at: now, updated_at: now};
        mockRequest.params = { issueIdOrKey: '1' };
        await controller.getIssue(mockRequest as Request, mockResponse as Response);
        const expectedFormattedIssue = formatIssueResponse(dbIssue);
        expect(mockResponse.statusCode).toBe(200);
        expect(JSON.parse(mockResponse._getData())).toEqual(expectedFormattedIssue);
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 if issue not found', async () => {
        mockRequest.params = { issueIdOrKey: 'NOT-FOUND' };
        await controller.getIssue(mockRequest as Request, mockResponse as Response);
        expect(mockResponse.statusCode).toBe(404);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Issue not found' });
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 if database get fails', async () => {
        const error = new Error('Database get error');
        mockRequest.params = { issueIdOrKey: 'FAIL-GET' };
        await controller.getIssue(mockRequest as Request, mockResponse as Response);
        expect(mockResponse.statusCode).toBe(500);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to retrieve issue' });
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });
});