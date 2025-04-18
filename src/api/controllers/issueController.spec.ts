import { issueController } from './issueController';
import { Request, Response, NextFunction } from 'express';
import { IssueKeyService } from '../../services/issueKeyService';
import { DatabaseService } from '../../services/databaseService';
import * as webhookService from '../../services/webhookService';
import { getDBConnection } from '../../config/db';

jest.mock('../../services/issueKeyService');
jest.mock('../../services/databaseService');
jest.mock('../../services/webhookService');

const mockRequest = {
    body: {},
    params: {},
    query: {}
} as unknown as Request;
const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis()
} as unknown as Response;
const mockNext = jest.fn() as NextFunction;

const mockDB = {
    all: jest.fn(),
    run: jest.fn(),
    get: jest.fn()
};

jest.mock('../../config/db', () => ({
    getDBConnection: jest.fn(() => mockDB)
}));

describe('IssueController', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockDB.all.mockClear();
        mockDB.run.mockClear();
        mockDB.get.mockClear();
    });

    it('should create an issue with valid data', async () => {
        (IssueKeyService.prototype.getNextIssueKey as jest.Mock).mockResolvedValue('PROJECT-123');
        (mockDB.run as jest.Mock).mockImplementation((sql, params, callback) => {
          if (sql.includes('INSERT INTO Issues')) {
            callback(null, { lastID: 1 });
          } else {
            callback(null, undefined);
          }
        });

        mockRequest.body = { fields: { issuetype: { name: 'Task' }, summary: 'Test Issue' } };

        await issueController.createIssue(mockRequest, mockResponse, mockNext);

        expect(IssueKeyService.prototype.getNextIssueKey).toHaveBeenCalled();
        expect(mockDB.run).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return 400 if required fields are missing', async () => {
        mockRequest.body = { fields: { summary: '', issuetype: { name: '' } } };
        await issueController.createIssue(mockRequest, mockResponse, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Title and Issue Type are required' });
    });

    it('should handle database errors during issue creation', async () => {
        mockRequest.body = { fields: { issuetype: { name: 'Task' }, summary: 'Test Issue' } };
        (IssueKeyService.prototype.getNextIssueKey as jest.Mock).mockRejectedValue(new Error('Database error'));

        await issueController.createIssue(mockRequest, mockResponse, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Database error creating issue' });
    });

    it('should get an issue by key', async () => {
        mockRequest.params = { key: 'PROJECT-123' };
        (mockDB.get as jest.Mock).mockImplementation((sql, params, callback) => {
            if (sql.includes('SELECT * FROM Issues WHERE key = ?')) {
                callback(null, { id: 1, key: 'PROJECT-123', title: 'Test Issue', type: 'Task' });
            } else {
                callback(null, undefined);
            }
        });

        await issueController.searchIssues(mockRequest, mockResponse, mockNext);

        expect(mockDB.get).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ issues: expect.arrayContaining([{ id: 1, key: 'PROJECT-123', title: 'Test Issue', type: 'Task' }]) }));
    });

    it('should update an issue', async () => {
        mockRequest.params = { key: 'PROJECT-123' };
        mockRequest.body = { fields: { summary: 'Updated Summary' } };
        (mockDB.run as jest.Mock).mockImplementation((sql, params, callback) => {
            callback(null, { changes: 1 });
        });

        await issueController.updateIssue(mockRequest, mockResponse, mockNext);

        expect(mockDB.run).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Issue updated' });
    });

    it('should delete an issue', async () => {
        mockRequest.params = { key: 'PROJECT-123' };
        (mockDB.run as jest.Mock).mockResolvedValue(undefined);

        await issueController.deleteIssue(mockRequest, mockResponse, mockNext);

        expect(mockDB.run).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(204);
    });

    it('should get all issues', async () => {
        (mockDB.all as jest.Mock).mockImplementation((sql, params, callback) => {
          if (sql.includes('SELECT * FROM Issues')) {
            callback(null, [{ id: 1, key: 'PROJECT-123', title: 'Test', type: 'Task' }]);
          } else {
            callback(null, []);
          }
        });

        await issueController.getAllIssues(mockRequest, mockResponse, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith([{ id: 1, key: 'PROJECT-123', title: 'Test', type: 'Task' }]);
    });

    it('should create a webhook', async () => {
        mockRequest.body = { url: 'http://example.com', events: ['issue_created'] };
        (webhookService.createWebhook as jest.Mock).mockResolvedValue({ id: '123', url: 'http://example.com', events: ['issue_created'] });

        await issueController.createWebhook(mockRequest, mockResponse, mockNext);

        expect(webhookService.createWebhook).toHaveBeenCalledWith({ url: 'http://example.com', events: ['issue_created'] });
        expect(mockResponse.status).toHaveBeenCalledWith(201);
        expect(mockResponse.json).toHaveBeenCalledWith({ id: '123', url: 'http://example.com', events: ['issue_created'] });
    });

    it('should delete a webhook', async () => {
        mockRequest.params = { webhookId: '123' };
        (webhookService.deleteWebhook as jest.Mock).mockResolvedValue(undefined);

        await issueController.deleteWebhook(mockRequest, mockResponse, mockNext);

        expect(webhookService.deleteWebhook).toHaveBeenCalledWith('123');
        expect(mockResponse.status).toHaveBeenCalledWith(204);
    });

    it('should link issues', async () => {
        mockRequest.body = { type: { name: 'Relates' }, inwardIssue: { key: 'PROJECT-123' }, outwardIssue: { key: 'PROJECT-456' } };
        (mockDB.run as jest.Mock).mockResolvedValue(undefined);

        await issueController.linkIssues(mockRequest, mockResponse, mockNext);

        expect(mockDB.run).toHaveBeenCalled();
        expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should get webhooks', async () => {
        (mockDB.all as jest.Mock).mockImplementation((sql, params, callback) => {
          if (sql.includes('SELECT id, url, events FROM Webhooks')) {
            callback(null, [{ id: '1', url: 'http://example.com', events: ['issue_created'] }]);
          } else {
            callback(null, []);
          }
        });

        await issueController.getWebhooks(mockRequest, mockResponse, mockNext);

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith(expect.arrayContaining([{ id: '1', url: 'http://example.com', events: ['issue_created'] }]));
    });

    it('should search issues using JQL (parameterized query)', async () => {
            mockRequest.query = { jql: 'status = "Open"' };
            const expectedSql = 'SELECT Issues.* FROM Issues INNER JOIN Statuses ON Issues.status_id = Statuses.id WHERE Issues.status_id = ?'; //Example
            const expectedParams = ['OpenStatusId']; //Example - how you would get the status id

            (mockDB.all as jest.Mock).mockImplementation((sql, params, callback) => {
                if (sql === expectedSql && JSON.stringify(params) === JSON.stringify(expectedParams)) {
                  callback(null, [{ id: 1, key: 'PROJECT-123', title: 'Test Issue', type: 'Task' }]);
                } else {
                  callback(null, []);
                }
            });

            await issueController.searchIssues(mockRequest, mockResponse, mockNext);

            expect(mockDB.all).toHaveBeenCalledWith(expectedSql, expectedParams); // Verify correct params were passed.
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({issues: expect.arrayContaining([{ id: 1, key: 'PROJECT-123', title: 'Test Issue', type: 'Task' }])}));
        });
});