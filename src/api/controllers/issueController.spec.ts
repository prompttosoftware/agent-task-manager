import { IssueController } from './issueController';
import { DatabaseService } from '../../services/databaseService';
import { IssueKeyService } from '../../services/issueKeyService';
import * as WebhookService from '../../services/webhookService';
import { Request, Response } from 'express';
import { Issue } from '../../models/issue';
import { jest } from '@jest/globals';
import { ObjectId } from 'mongodb';
import { createMock } from '@golevelup/ts-jest';
import { Response as MockResponse, Request as MockRequest } from 'jest-express';

// Mock the webhook service
const mockWebhookService = {
    triggerWebhooks: jest.fn(),
} as jest.Mocked<typeof WebhookService>;

// Mock the IssueKeyService
const mockIssueKeyService: jest.Mocked<IssueKeyService> = {
    getNextIssueKey: jest.fn(),
} as jest.Mocked<IssueKeyService>;

// Mock the DatabaseService
const mockIssueService: jest.Mocked<DatabaseService> = createMock<DatabaseService>();

describe('IssueController', () => {
    let controller: IssueController;
    let mockRequest: MockRequest;
    let mockResponse: MockResponse;

    beforeEach(() => {
        mockIssueService.get.mockReset();
        mockIssueService.run.mockReset();
        mockIssueKeyService.getNextIssueKey.mockReset();
        mockWebhookService.triggerWebhooks.mockReset();

        controller = new IssueController(mockIssueService, mockIssueKeyService, mockWebhookService);

        mockRequest = new MockRequest();
        mockResponse = new MockResponse();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create an issue', async () => {
        const issueData = {
            issuetype: 'task',
            summary: 'Test issue',
            description: 'Test description',
        };

        const issueId = new ObjectId().toHexString();

        const createdIssue: Issue = {
            _id: issueId,
            issuetype: issueData.issuetype,
            summary: issueData.summary,
            description: issueData.description,
        };

        mockIssueService.get.mockResolvedValue(createdIssue);
        mockIssueService.run.mockResolvedValue(undefined);
        mockIssueKeyService.getNextIssueKey.mockResolvedValue('TASK-1');

        mockRequest.body = issueData;
        await controller.createIssue(mockRequest as any as Request, mockResponse as any as Response);

        expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalled();
        expect(mockIssueService.run).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO issues'), expect.anything());
        expect(mockIssueService.get).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE key = ?'), ['TASK-1']);
        expect(mockResponse.statusCode).toBe(201);
        expect(mockResponse._getJSON()).toEqual(createdIssue);
        expect(mockWebhookService.triggerWebhooks).toHaveBeenCalledWith('jira:issue_created', createdIssue);
    });

    it('should get an issue by key', async () => {
        const issueData: Issue = {
            _id: new ObjectId().toHexString(),
            issuetype: 'task',
            summary: 'Test issue',
            description: 'Test description',
        };

        mockIssueService.get.mockResolvedValue(issueData);

        mockRequest.params = { issueIdOrKey: 'PROJECT-123' };
        await controller.getIssue(mockRequest as any as Request, mockResponse as any as Response);

        expect(mockIssueService.get).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE key = ?'), ['PROJECT-123']);
        expect(mockResponse._getJSON()).toEqual(issueData);
    });

    it('should update an issue', async () => {
        const issueData: Issue = {
            _id: new ObjectId().toHexString(),
            issuetype: 'task',
            summary: 'Updated issue',
            description: 'Updated description',
        };

        mockIssueService.get.mockResolvedValue(issueData);
        mockIssueService.run.mockResolvedValue(undefined);

        mockRequest.params = { issueIdOrKey: 'PROJECT-123' };
        mockRequest.body = { ...issueData };
        await controller.updateIssue(mockRequest as any as Request, mockResponse as any as Response);

        expect(mockIssueService.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE issues SET'), expect.anything());
        expect(mockIssueService.get).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE key = ?'), ['PROJECT-123']);
        expect(mockResponse.statusCode).toBe(204);
        expect(mockResponse._isEndCalled()).toBe(true);
        expect(mockWebhookService.triggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', issueData);
    });

    it('should delete an issue', async () => {
        const issueData: Issue = {
            _id: new ObjectId().toHexString(),
            issuetype: 'task',
            summary: 'Test issue',
            description: 'Test description',
        };

        mockIssueService.get.mockResolvedValue(issueData);
        mockIssueService.run.mockResolvedValue(undefined);

        mockRequest.params = { issueIdOrKey: 'PROJECT-123' };
        await controller.deleteIssue(mockRequest as any as Request, mockResponse as any as Response);

        expect(mockIssueService.run).toHaveBeenCalledWith('DELETE FROM issues WHERE key = ?', ['PROJECT-123']);
        expect(mockResponse.statusCode).toBe(204);
        expect(mockResponse._isEndCalled()).toBe(true);
        expect(mockWebhookService.triggerWebhooks).toHaveBeenCalledWith('jira:issue_deleted', issueData);
    });
});