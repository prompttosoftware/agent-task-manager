 // src/api/controllers/issueController.getIssue.spec.ts

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
jest.mock('../../config/db', () => ({getDBConnection: jest.fn().mockResolvedValue(mockDbConnection), closeDBConnection: jest.fn().mockResolvedValue(undefined)}));
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

describe('IssueController - getIssue', () => {
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

it('should get an issue by key', async () => {
const now = new Date().toISOString();
const dbIssue: DbIssue = {_id: new ObjectId().toHexString(), id: 1, issuetype: 'task', summary: 'Test issue', description: 'Test description', key: 'PROJECT-123', status: 'In Progress', assignee_key: null, created_at: now, updated_at: now};
mockDatabaseServiceInstance.get.mockResolvedValue(dbIssue);
mockRequest.params = { issueIdOrKey: 'PROJECT-123' };
await controller.getIssue(mockRequest as Request, mockResponse as Response);
expect(mockDatabaseServiceInstance.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', ['PROJECT-123']);
const expectedFormattedIssue = formatIssueResponse(dbIssue);
expect(mockResponse.statusCode).toBe(200);
expect(JSON.parse(mockResponse._getData())).toEqual(expectedFormattedIssue);
expect(mockTriggerWebhooks).not.toHaveBeenCalled();
expect(mockNext).not.toHaveBeenCalled();
});

it('should get an issue by ID', async () => {
const now = new Date().toISOString();
const dbIssue: DbIssue = {_id: new ObjectId().toHexString(), id: 1, issuetype: 'task', summary: 'Test issue', description: 'Test description', key: 'PROJECT-123', status: 'In Progress', assignee_key: null, created_at: now, updated_at: now};
mockDatabaseServiceInstance.get.mockResolvedValue(dbIssue);
mockRequest.params = { issueIdOrKey: '1' };
await controller.getIssue(mockRequest as Request, mockResponse as Response);
expect(mockDatabaseServiceInstance.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE id = ?', ['1']);
const expectedFormattedIssue = formatIssueResponse(dbIssue);
expect(mockResponse.statusCode).toBe(200);
expect(JSON.parse(mockResponse._getData())).toEqual(expectedFormattedIssue);
expect(mockTriggerWebhooks).not.toHaveBeenCalled();
expect(mockNext).not.toHaveBeenCalled();
});

it('should return 404 if issue not found', async () => {
mockDatabaseServiceInstance.get.mockResolvedValue(undefined);
mockRequest.params = { issueIdOrKey: 'NOT-FOUND' };
await controller.getIssue(mockRequest as Request, mockResponse as Response);
expect(mockDatabaseServiceInstance.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', ['NOT-FOUND']);
expect(mockResponse.statusCode).toBe(404);
expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Issue not found' });
expect(mockTriggerWebhooks).not.toHaveBeenCalled();
expect(mockNext).not.toHaveBeenCalled();
});

it('should return 500 if database get fails', async () => {
const error = new Error('Database get error');
mockDatabaseServiceInstance.get.mockRejectedValue(error);
mockRequest.params = { issueIdOrKey: 'FAIL-GET' };
await controller.getIssue(mockRequest as Request, mockResponse as Response);
expect(mockDatabaseServiceInstance.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', ['FAIL-GET']);
expect(mockResponse.statusCode).toBe(500);
expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to retrieve issue' });
expect(mockTriggerWebhooks).not.toHaveBeenCalled();
expect(mockNext).not.toHaveBeenCalled();
});
});