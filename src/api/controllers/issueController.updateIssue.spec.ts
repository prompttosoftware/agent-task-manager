// src/api/controllers/issueController.updateIssue.spec.ts

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

describe('IssueController - updateIssue', () => {
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

    it('should update an issue and trigger webhooks', async () => {
        const issueKey = 'PROJECT-123';
        const issueData = {
            summary: 'Updated summary',
            description: 'Updated description',
            status: 'In Progress'
        };
        const now = new Date().toISOString();
        const existingDbIssue: DbIssue = {
            _id: new ObjectId().toHexString(),
            id: 1,
            issuetype: 'task',
            summary: 'Original summary',
            description: 'Original description',
            key: issueKey,
            status: 'To Do',
            assignee_key: null,
            created_at: now,
            updated_at: now
        };
        const updatedDbIssue: DbIssue = {
            _id: new ObjectId().toHexString(),
            id: 1,
            issuetype: 'task',
            summary: issueData.summary,
            description: issueData.description,
            key: issueKey,
            status: issueData.status,
            assignee_key: null,
            created_at: now,
            updated_at: now
        };

        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = issueData;
        await controller.updateIssue(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.statusCode).toBe(200);
        const expectedFormattedIssue = formatIssueResponse(updatedDbIssue);
        expect(JSON.parse(mockResponse._getData())).toEqual(expectedFormattedIssue);
        expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
        expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expectedFormattedIssue);
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 if issue to update is not found', async () => {
        mockRequest.params = { issueIdOrKey: 'NON-EXISTENT' };
        mockRequest.body = { summary: 'Attempted update' };
        await controller.updateIssue(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.statusCode).toBe(404);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Issue not found' });
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 if database get (initial) fails', async () => {
        const error = new Error('DB error');
        mockRequest.params = { issueIdOrKey: 'ANY' };
        mockRequest.body = { summary: 'Update attempt' };
        await controller.updateIssue(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.statusCode).toBe(500);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to update issue' });
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 if database update fails', async () => {
        const issueKey = 'PROJECT-123';
        const issueData = { summary: 'Updated summary', description: 'Updated description', status: 'In Progress' };
        const now = new Date().toISOString();
        const existingDbIssue: DbIssue = {
            _id: new ObjectId().toHexString(),
            id: 1,
            issuetype: 'task',
            summary: 'Original summary',
            description: 'Original description',
            key: issueKey,
            status: 'To Do',
            assignee_key: null,
            created_at: now,
            updated_at: now
        };
        const error = new Error('Update failed');

        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = issueData;
        await controller.updateIssue(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.statusCode).toBe(500);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to update issue' });
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 if database get (after update) fails', async () => {
        const issueKey = 'PROJECT-123';
        const issueData = { summary: 'Updated summary', description: 'Updated description', status: 'In Progress' };
        const now = new Date().toISOString();
        const existingDbIssue: DbIssue = {
            _id: new ObjectId().toHexString(),
            id: 1,
            issuetype: 'task',
            summary: 'Original summary',
            description: 'Original description',
            key: issueKey,
            status: 'To Do',
            assignee_key: null,
            created_at: now,
            updated_at: now
        };
        const error = new Error('Get after update failed');

        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = issueData;
        await controller.updateIssue(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.statusCode).toBe(500);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to update issue' });
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });
});