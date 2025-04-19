import { IssueController } from './issueController';
import { DatabaseService } from '../../services/databaseService';
import { IssueKeyService } from '../../services/issueKeyService';
import * as WebhookService from '../../services/webhookService';
import { Request, Response } from 'express';
import { Issue } from '../../models/issue';
import { ObjectId } from 'mongodb';
import { MockRequest, MockResponse } from '@jest-mock/express';
//import sqlite3 from 'sqlite3';
import { createMock } from '@golevelup/ts-jest';
import { Mocked } from 'jest-mock';



// Mock the WebhookService
const mockWebhookService: jest.Mocked<typeof WebhookService> = {
    triggerWebhooks: jest.fn(),
    createWebhook: jest.fn(),
    deleteWebhook: jest.fn()
}

describe('IssueController', () => {
    let controller: IssueController;
    let mockRequest: MockRequest;
    let mockResponse: MockResponse;
    const mockNext = jest.fn();

    const mockDatabaseService = createMock<DatabaseService>();
    const mockIssueKeyService = createMock<IssueKeyService>();


    beforeEach(() => {
        mockDatabaseService.get.mockReset();
        mockDatabaseService.run.mockReset();
        mockIssueKeyService.getNextIssueKey.mockReset();
        mockWebhookService.triggerWebhooks.mockReset();
        mockDatabaseService.ensureTableExists.mockReset();
        mockDatabaseService.getSingleValue.mockReset();
        mockDatabaseService.setSingleValue.mockReset();
        mockDatabaseService.beginTransaction.mockReset();
        mockDatabaseService.commitTransaction.mockReset();
        mockDatabaseService.rollbackTransaction.mockReset();
        mockDatabaseService.connect.mockReset();
        mockDatabaseService.disconnect.mockReset();
        mockDatabaseService.all.mockReset();
        mockNext.mockReset();

        controller = new IssueController(
            mockDatabaseService,
            mockIssueKeyService,
            mockWebhookService
        );

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
            _id: new ObjectId().toHexString() // Added _id
        };

        const issueId = new ObjectId().toHexString();
        const issueKey = 'TASK-1';

        const createdIssue: Issue = {
            _id: issueId,
            issuetype: issueData.issuetype,
            summary: issueData.summary,
            description: issueData.description,
        };

        mockDatabaseService.get.mockResolvedValue(createdIssue);
        mockDatabaseService.run.mockResolvedValue(undefined);
        mockIssueKeyService.getNextIssueKey.mockResolvedValue(issueKey);
        mockDatabaseService.run.mockImplementation((sql: string, params: any[]) => {
            return Promise.resolve({ changes: 1 });
        });


        mockRequest.body = issueData;
        await controller.createIssue(mockRequest as any as Request, mockResponse as any as Response, mockNext); // Added mockNext

        expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalled();
        expect(mockDatabaseService.run).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO issues'), [
            issueData.issuetype,
            issueData.summary,
            issueData.description,
            issueKey
        ]);
        expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [issueKey]);
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

        mockDatabaseService.get.mockResolvedValue(issueData);

        mockRequest.params = {
            issueIdOrKey: 'PROJECT-123'
        };
        await controller.getIssue(mockRequest as any as Request, mockResponse as any as Response);

        expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE key = ?'), ['PROJECT-123']);
        expect(mockResponse._getJSON()).toEqual(issueData);
    });

    it('should update an issue', async () => {
        const issueData: Issue = {
            _id: new ObjectId().toHexString(),
            issuetype: 'task',
            summary: 'Updated issue',
            description: 'Updated description',
        };

        mockDatabaseService.get.mockResolvedValue(issueData);
        mockDatabaseService.run.mockResolvedValue(undefined);

        mockRequest.params = {
            issueIdOrKey: 'PROJECT-123'
        };
        mockRequest.body = { ...issueData };
        await controller.updateIssue(mockRequest as any as Request, mockResponse as any as Response);

        expect(mockDatabaseService.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE issues SET'), [
            issueData.issuetype,
            issueData.summary,
            issueData.description,
            'PROJECT-123'
        ]);
        expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE key = ?'), ['PROJECT-123']);
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

        mockDatabaseService.get.mockResolvedValue(issueData);
        mockDatabaseService.run.mockResolvedValue(undefined);

        mockRequest.params = {
            issueIdOrKey: 'PROJECT-123'
        };
        await controller.deleteIssue(mockRequest as any as Request, mockResponse as any as Response);

        expect(mockDatabaseService.run).toHaveBeenCalledWith('DELETE FROM issues WHERE key = ?', ['PROJECT-123']);
        expect(mockResponse.statusCode).toBe(204);
        expect(mockResponse._isEndCalled()).toBe(true);
        expect(mockWebhookService.triggerWebhooks).toHaveBeenCalledWith('jira:issue_deleted', issueData);
    });
});