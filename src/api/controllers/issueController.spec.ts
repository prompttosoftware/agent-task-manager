import { IssueController } from './issueController';
import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../../services/databaseService';
import { Issue } from '../../models/issue';
import { IssueKeyService } from '../../services/issueKeyService';

jest.mock('../../services/databaseService');
jest.mock('../../services/issueKeyService');

const mockRequest = { body: {}, params: {}, query: {} } as unknown as Request;
const mockResponse = { 
    status: jest.fn().mockReturnThis(), 
    json: jest.fn().mockReturnThis(), 
    send: jest.fn().mockReturnThis()
} as unknown as Response;

describe('IssueController', () => {
    let mockDatabaseService: jest.Mocked<DatabaseService>;
    let mockIssueKeyService: jest.Mocked<IssueKeyService>;
    let controller: IssueController;

    beforeEach(() => {
        mockDatabaseService = new DatabaseService() as jest.Mocked<DatabaseService>;
        mockIssueKeyService = { getNextIssueKey: jest.fn().mockResolvedValue('TASK-1') } as jest.Mocked<IssueKeyService>;
        controller = new IssueController(mockDatabaseService, mockIssueKeyService);
    });

    describe('createIssue', () => {
        it('should create an issue successfully', async () => {
            const issueData: Issue = {
                issuetype: 'Task',
                summary: 'Test Issue',
                description: 'Test Description',
            };
            mockRequest.body = issueData;
            mockDatabaseService.run.mockResolvedValue(undefined);
            mockDatabaseService.get.mockResolvedValue({ 
                id: 1,
                issuetype: 'Task',
                summary: 'Test Issue',
                description: 'Test Description',
                key: 'TASK-1'
            });

            await controller.createIssue(mockRequest, mockResponse);

            expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalled();
            expect(mockDatabaseService.run).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO issues'),
                expect.arrayContaining([
                    issueData.issuetype,
                    issueData.summary,
                    issueData.description,
                    issueData.parentKey,
                    'TASK-1'
                ])
            );
            expect(mockResponse.status).toHaveBeenCalledWith(201);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({ id: 1, key: 'TASK-1', self: '/rest/api/3/issue/TASK-1', fields: { summary: 'Test Issue' }, assignee_key: undefined, summary: 'Test Issue' }));
        });

        it('should return 400 if required fields are missing', async () => {
            mockRequest.body = {
                issuetype: '',
                summary: '',
                description: ''
            };

            await controller.createIssue(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(400);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
        });

        it('should handle database errors during issue creation', async () => {
            const issueData: Issue = {
                issuetype: 'Task',
                summary: 'Test Issue',
                description: 'Test Description',
            };
            mockRequest.body = issueData;
            mockDatabaseService.run.mockRejectedValue(new Error('Database error'));

            await controller.createIssue(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to create issue' });
        });

        it('should handle failure to retrieve the newly created issue', async () => {
            const issueData: Issue = {
                issuetype: 'Task',
                summary: 'Test Issue',
                description: 'Test Description',
            };
            mockRequest.body = issueData;
            mockDatabaseService.run.mockResolvedValue(undefined);
            mockDatabaseService.get.mockResolvedValue(undefined);

            await controller.createIssue(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to retrieve newly created issue' });
        });
    });

    describe('deleteIssue', () => {
        it('should delete an issue by ID successfully', async () => {
            mockRequest.params = { issueIdOrKey: '123' };
            mockDatabaseService.run.mockResolvedValue(undefined);

            await controller.deleteIssue(mockRequest, mockResponse);

            expect(mockDatabaseService.run).toHaveBeenCalledWith('DELETE FROM issues WHERE id = ?', ['123']);
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        it('should delete an issue by key successfully', async () => {
            mockRequest.params = { issueIdOrKey: 'TASK-1' };
            mockDatabaseService.run.mockResolvedValue(undefined);

            await controller.deleteIssue(mockRequest, mockResponse);

            expect(mockDatabaseService.run).toHaveBeenCalledWith('DELETE FROM issues WHERE key = ?', ['TASK-1']);
            expect(mockResponse.status).toHaveBeenCalledWith(204);
            expect(mockResponse.send).toHaveBeenCalled();
        });

        it('should handle database errors during issue deletion', async () => {
            mockRequest.params = { issueIdOrKey: '123' };
            mockDatabaseService.run.mockRejectedValue(new Error('Database error'));

            await controller.deleteIssue(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to delete issue' });
        });
    });

    describe('getIssue', () => {
        it('should get an issue by ID successfully', async () => {
            mockRequest.params = { issueIdOrKey: '1' };
            const mockIssue = { id: 1, issuetype: 'Task', summary: 'Test Issue', description: 'Test Description', key: 'TASK-1' };
            mockDatabaseService.get.mockResolvedValue(mockIssue);

            await controller.getIssue(mockRequest, mockResponse);

            expect(mockDatabaseService.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE id = ?', ['1']);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                id: 1,
                issuetype: 'Task',
                summary: 'Test Issue',
                description: 'Test Description',
                key: 'TASK-1',
                self: '/rest/api/3/issue/TASK-1',
                fields: {
                    summary: 'Test Issue'
                }
            }));
        });

        it('should get an issue by key successfully', async () => {
            mockRequest.params = { issueIdOrKey: 'TASK-1' };
            const mockIssue = { id: 1, issuetype: 'Task', summary: 'Test Issue', description: 'Test Description', key: 'TASK-1' };
            mockDatabaseService.get.mockResolvedValue(mockIssue);

            await controller.getIssue(mockRequest, mockResponse);

            expect(mockDatabaseService.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', ['TASK-1']);
            expect(mockResponse.status).toHaveBeenCalledWith(200);
            expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
                id: 1,
                issuetype: 'Task',
                summary: 'Test Issue',
                description: 'Test Description',
                key: 'TASK-1',
                self: '/rest/api/3/issue/TASK-1',
                fields: {
                    summary: 'Test Issue'
                }
            }));
        });

        it('should return 404 if issue is not found', async () => {
            mockRequest.params = { issueIdOrKey: '999' };
            mockDatabaseService.get.mockResolvedValue(undefined);

            await controller.getIssue(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(404);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Issue not found' });
        });

        it('should handle database errors during issue retrieval', async () => {
            mockRequest.params = { issueIdOrKey: '1' };
            mockDatabaseService.get.mockRejectedValue(new Error('Database error'));

            await controller.getIssue(mockRequest, mockResponse);

            expect(mockResponse.status).toHaveBeenCalledWith(500);
            expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Failed to retrieve issue' });
        });
    });
});