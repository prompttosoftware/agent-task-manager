// src/api/controllers/issueController.updateIssue.spec.ts

import { IssueController } from './issueController';
import { DatabaseService } from '../../services/databaseService';
import { IssueKeyService } from '../../services/issueKeyService';
import { IssueStatusTransitionService } from '../../services/issueStatusTransitionService';
import { Request, Response } from 'express';
import { Issue } from '../../models/issue';
import { ObjectId } from 'mongodb'; // Used for _id generation in tests
import httpMocks from 'node-mocks-http';
import { triggerWebhooks } from '../../services/webhookService';
import { formatIssueResponse } from '../../utils/jsonTransformer';
import { createMockDbConnection } from '../../mocks/sqlite3.mock';

// Mock external dependencies
jest.mock('../../services/webhookService', () => ({}));

jest.mock('../../services/issueKeyService');
jest.mock('../../services/issueStatusTransitionService');

// Mock the DatabaseService *and* its potential underlying connection source
const mockDbConnection = createMockDbConnection();
jest.mock('../../config/db', () => ({
    getDBConnection: jest.fn().mockResolvedValue(mockDbConnection),
    closeDBConnection: jest.fn().mockResolvedValue(undefined)
}));
const mockDatabaseServiceInstance = {
    run: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(undefined),
    all: jest.fn().mockResolvedValue([]),
    getSingleValue: jest.fn().mockResolvedValue(undefined),
    setSingleValue: jest.fn().mockResolvedValue(undefined),
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    ensureTableExists: jest.fn().mockResolvedValue(undefined),
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    getDbInstance: jest.fn().mockReturnValue(mockDbConnection) // Return the mocked connection
};
jest.mock('../../services/databaseService', () => {
    return {DatabaseService: jest.fn().mockImplementation(() => mockDatabaseServiceInstance)};
});

const mockTriggerWebhooks = triggerWebhooks as jest.Mock;

type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; };

describe('IssueController - updateIssue', () => {
    let controller: IssueController;
    let mockRequest: httpMocks.MockRequest<Request>;
    let mockResponse: httpMocks.MockResponse<Response>;
    const mockNext: jest.Mock = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        Object.values(mockDatabaseServiceInstance).forEach(mockFn => mockFn.mockClear());
        controller = new IssueController(
            new DatabaseService(),
            new IssueKeyService(),
            new IssueStatusTransitionService()
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

        mockDatabaseServiceInstance.get.mockResolvedValue(existingDbIssue);
        mockDatabaseServiceInstance.run.mockResolvedValue(undefined);
        mockDatabaseServiceInstance.get.mockResolvedValue(updatedDbIssue); // Return updated issue

        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = issueData;
        await controller.updateIssue(mockRequest as Request, mockResponse as Response);

        expect(mockDatabaseServiceInstance.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', [issueKey]);
        expect(mockDatabaseServiceInstance.run).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE issues SET'),
            expect.arrayContaining([
                issueData.summary, issueData.description, issueData.status, expect.any(String), issueKey
            ])
        );
        expect(mockDatabaseServiceInstance.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', [issueKey]);
        expect(mockResponse.statusCode).toBe(200);
        const expectedFormattedIssue = formatIssueResponse(updatedDbIssue);
        expect(JSON.parse(mockResponse._getData())).toEqual(expectedFormattedIssue);
        expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
        expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expectedFormattedIssue);
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 if issue to update is not found', async () => {
        mockDatabaseServiceInstance.get.mockResolvedValue(undefined);
        mockRequest.params = { issueIdOrKey: 'NON-EXISTENT' };
        mockRequest.body = { summary: 'Attempted update' };
        await controller.updateIssue(mockRequest as Request, mockResponse as Response);

        expect(mockDatabaseServiceInstance.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', ['NON-EXISTENT']);
        expect(mockDatabaseServiceInstance.run).not.toHaveBeenCalled();
        expect(mockResponse.statusCode).toBe(404);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Issue not found' });
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 if database get (initial) fails', async () => {
        const error = new Error('DB error');
        mockDatabaseServiceInstance.get.mockRejectedValue(error);
        mockRequest.params = { issueIdOrKey: 'ANY' };
        mockRequest.body = { summary: 'Update attempt' };
        await controller.updateIssue(mockRequest as Request, mockResponse as Response);

        expect(mockDatabaseServiceInstance.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', ['ANY']);
        expect(mockDatabaseServiceInstance.run).not.toHaveBeenCalled();
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

        mockDatabaseServiceInstance.get.mockResolvedValue(existingDbIssue);
        mockDatabaseServiceInstance.run.mockRejectedValue(error);

        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = issueData;
        await controller.updateIssue(mockRequest as Request, mockResponse as Response);

        expect(mockDatabaseServiceInstance.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', [issueKey]);
        expect(mockDatabaseServiceInstance.run).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE issues SET'),
            expect.arrayContaining([
                issueData.summary, issueData.description, issueData.status, expect.any(String), issueKey
            ])
        );
        expect(mockDatabaseServiceInstance.get).toHaveBeenCalledTimes(1);
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

        mockDatabaseServiceInstance.get.mockResolvedValueOnce(existingDbIssue);
        mockDatabaseServiceInstance.run.mockResolvedValue(undefined);
        mockDatabaseServiceInstance.get.mockRejectedValueOnce(error);

        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = issueData;
        await controller.updateIssue(mockRequest as Request, mockResponse as Response);

        expect(mockDatabaseServiceInstance.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', [issueKey]);
        expect(mockDatabaseServiceInstance.run).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE issues SET'),
            expect.arrayContaining([
                issueData.summary, issueData.description, issueData.status, expect.any(String), issueKey
            ])
        );
        expect(mockDatabaseServiceInstance.get).toHaveBeenCalledTimes(2);
        expect(mockResponse.statusCode).toBe(500);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to update issue' });
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });
});