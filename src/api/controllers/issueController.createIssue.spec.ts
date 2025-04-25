// src/api/controllers/issueController.createIssue.spec.ts

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

describe('IssueController - createIssue', () => {
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
        mockDatabaseServiceInstance.run.mockResolvedValue(undefined); // Mock run for INSERT
        mockDatabaseServiceInstance.get.mockResolvedValue(createdDbIssue); // Mock get for SELECT after insert

        mockRequest.body = issueData;
        await controller.createIssue(mockRequest as Request, mockResponse as Response);

        expect(IssueKeyService.prototype.getNextIssueKey).toHaveBeenCalled();
        expect(mockDatabaseServiceInstance.run).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO issues'),
            expect.arrayContaining([
                issueData.issuetype, issueData.summary, issueData.description, null, issueKey, 'To Do', expect.any(String), expect.any(String)
            ])
        );
        expect(mockDatabaseServiceInstance.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', [issueKey]);
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
        expect(mockDatabaseServiceInstance.run).not.toHaveBeenCalled();
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 if issue key generation fails', async () => {
        const error = new Error('Key generation failed');
        (IssueKeyService.prototype.getNextIssueKey as jest.Mock).mockRejectedValue(error);
        mockRequest.body = { issuetype: 'task', summary: 'Test', description: 'Desc' };

        await controller.createIssue(mockRequest as Request, mockResponse as Response);

        expect(IssueKeyService.prototype.getNextIssueKey).toHaveBeenCalled();
        expect(mockDatabaseServiceInstance.run).not.toHaveBeenCalled();
        expect(mockResponse.statusCode).toBe(500);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to create issue' });
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 500 if database insert fails', async () => {
        const issueData = { issuetype: 'bug', summary: 'Error case', description: 'DB fail' };
        const error = new Error('Database insert error');
        (IssueKeyService.prototype.getNextIssueKey as jest.Mock).mockResolvedValue('TASK-ERR');
        mockDatabaseServiceInstance.run.mockRejectedValue(error);

        mockRequest.body = issueData;
        await controller.createIssue(mockRequest as Request, mockResponse as Response);

        expect(IssueKeyService.prototype.getNextIssueKey).toHaveBeenCalled();
        expect(mockDatabaseServiceInstance.run).toHaveBeenCalled();
        expect(mockDatabaseServiceInstance.get).not.toHaveBeenCalled();
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
        mockDatabaseServiceInstance.run.mockResolvedValue(undefined); // INSERT succeeds
        mockDatabaseServiceInstance.get.mockRejectedValue(error); // SELECT fails

        mockRequest.body = issueData;
        await controller.createIssue(mockRequest as Request, mockResponse as Response);

        expect(IssueKeyService.prototype.getNextIssueKey).toHaveBeenCalled();
        expect(mockDatabaseServiceInstance.run).toHaveBeenCalled();
        expect(mockDatabaseServiceInstance.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', [issueKey]);
        expect(mockResponse.statusCode).toBe(500);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to create issue' });
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled();
    });
});