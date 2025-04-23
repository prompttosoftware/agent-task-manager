import supertest from 'supertest';
import express from 'express';
import issueRoutes from './issueRoutes';
import { IssueController } from '../controllers/issueController';
import { DatabaseService } from '../../services/databaseService';
import { IssueKeyService } from '../../services/issueKeyService';
import { IssueStatusTransitionService } from '../../services/issueStatusTransitionService';
import { formatIssueResponse } from '../../utils/jsonTransformer';
import { triggerWebhooks } from '../../services/webhookService';
import { Issue } from '../../models/issue';

jest.mock('../../services/webhookService', () => ({
    triggerWebhooks: jest.fn(),
}));

const mockTriggerWebhooks = triggerWebhooks as jest.Mock;

// Create a new express app and use json middleware
const app = express();
app.use(express.json());

type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; };

describe('issueRoutes', () => {
    let request: supertest.SuperTest<supertest.Test>;
    let mockDatabaseService: jest.Mocked<DatabaseService>;
    let mockIssueKeyService: jest.Mocked<IssueKeyService>;
    let mockIssueStatusTransitionService: jest.Mocked<IssueStatusTransitionService>;
    let issueController: IssueController;

    beforeEach(() => {
        // Reset mocks for all services
        mockDatabaseService = {
            connect: jest.fn(),
            disconnect: jest.fn(),
            run: jest.fn(),
            get: jest.fn(),
            all: jest.fn(),
            ensureTableExists: jest.fn(),
            getSingleValue: jest.fn(),
            setSingleValue: jest.fn(),
            beginTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
        } as any;

        mockIssueKeyService = {
            getNextIssueKey: jest.fn(),
        } as any;

        mockIssueStatusTransitionService = {
            isValidTransition: jest.fn(),
        } as any;

        issueController = new IssueController(
            mockDatabaseService,
            mockIssueKeyService,
            mockIssueStatusTransitionService
        );

        // Override the default issueController with the mocked version
        app.use((req, res, next) => {
            req.issueController = issueController;
            next();
        });

        // Re-mount routes with the mocked controller available in request
        app.use('/rest/api/3/issue', issueRoutes);

        request = supertest(app);

        mockTriggerWebhooks.mockClear();
    });

    describe('POST /', () => {
        it('should create a new issue with valid data and return 201', async () => {
            const issueData = {
                issuetype: 'task',
                summary: 'Test issue',
                description: 'Test description',
                key: 'TASK-1'
            };

            const issueKey = 'PROJ-1';
            const now = new Date().toISOString();
            const createdDbIssue: DbIssue = {
                _id: 'some-object-id',
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

            mockIssueKeyService.getNextIssueKey.mockResolvedValue(issueKey);
            mockDatabaseService.run.mockResolvedValue(undefined);
            mockDatabaseService.get.mockResolvedValue(createdDbIssue);

            const response = await request
                .post('/rest/api/3/issue')
                .send(issueData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer validToken');

            expect(response.status).toBe(201);
            expect(response.body).toEqual(formatIssueResponse(createdDbIssue));
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_created', formatIssueResponse(createdDbIssue));
        });

        it('should return 400 for missing required fields', async () => {
            const invalidIssueData = {
                summary: 'Test issue',
                description: 'Test description',
            };

            const response = await request
                .post('/rest/api/3/issue')
                .send(invalidIssueData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Missing required fields' });
        });
    });

    describe('GET /:issueIdOrKey', () => {
        it('should get an issue by ID and return 200', async () => {
            const issueId = '1';
            const now = new Date().toISOString();
            const dbIssue: DbIssue = {
                _id: 'some-object-id',
                id: 1,
                issuetype: 'task',
                summary: 'Test issue',
                description: 'Test description',
                key: 'PROJECT-123',
                status: 'In Progress',
                assignee_key: null,
                created_at: now,
                updated_at: now
            };

            mockDatabaseService.get.mockResolvedValue(dbIssue);

            const response = await request.get(`/rest/api/3/issue/${issueId}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(formatIssueResponse(dbIssue));
        });

        it('should get an issue by key and return 200', async () => {
            const issueKey = 'PROJECT-123';
            const now = new Date().toISOString();
            const dbIssue: DbIssue = {
                _id: 'some-object-id',
                id: 1,
                issuetype: 'task',
                summary: 'Test issue',
                description: 'Test description',
                key: issueKey,
                status: 'In Progress',
                assignee_key: null,
                created_at: now,
                updated_at: now
            };
            mockDatabaseService.get.mockResolvedValue(dbIssue);

            const response = await request.get(`/rest/api/3/issue/${issueKey}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(formatIssueResponse(dbIssue));
        });

        it('should return 404 if issue is not found', async () => {
            const issueIdOrKey = 'nonexistent';
            mockDatabaseService.get.mockResolvedValue(undefined);

            const response = await request.get(`/rest/api/3/issue/${issueIdOrKey}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Issue not found' });
        });
    });

    describe('PUT /:issueIdOrKey', () => {
        it('should update an issue and return 204', async () => {
            const issueKey = 'PROJECT-123';
            const now = new Date().toISOString();
            const updateData = {
                summary: 'Updated issue summary',
                description: 'Updated description',
                status: 'In Progress'
            };

            const preUpdateDbIssue: DbIssue = {
                _id: 'some-object-id',
                id: 1,
                issuetype: 'task',
                summary: 'Original Summary',
                description: 'Original Description',
                key: issueKey,
                status: 'To Do',
                assignee_key: null,
                created_at: now,
                updated_at: now
            };

            const postUpdateDbIssue: DbIssue = {
                ...preUpdateDbIssue,
                summary: updateData.summary,
                description: updateData.description,
                status: updateData.status!,
                updated_at: new Date().toISOString()
            };
            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
            mockIssueStatusTransitionService.isValidTransition.mockReturnValue(true);
            mockDatabaseService.run.mockResolvedValue(undefined);
            mockDatabaseService.get.mockResolvedValueOnce(postUpdateDbIssue);

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(updateData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer validToken');

            expect(response.status).toBe(204);
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', formatIssueResponse(postUpdateDbIssue));
        });

        it('should return 404 if issue to update is not found', async () => {
            const issueIdOrKey = 'nonexistent';
            const updateData = { summary: 'Updated summary' };
            mockDatabaseService.get.mockResolvedValue(undefined);

            const response = await request
                .put(`/rest/api/3/issue/${issueIdOrKey}`)
                .send(updateData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Issue not found' });
        });

        it('should return 400 if no valid fields to update are provided', async () => {
            const issueKey = 'PROJECT-123';
            const now = new Date().toISOString();
            const preUpdateDbIssue: DbIssue = {
                _id: 'some-object-id',
                id: 1,
                issuetype: 'task',
                summary: 'Original Summary',
                description: 'Original Description',
                key: issueKey,
                status: 'To Do',
                assignee_key: null,
                created_at: now,
                updated_at: now
            };
            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
            const invalidUpdateData = { invalidField: 'Invalid data' };

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(invalidUpdateData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'No valid fields to update provided' });
        });

        it('should return 400 for invalid status transition', async () => {
            const issueKey = 'PROJECT-123';
            const now = new Date().toISOString();
            const updateData = { status: 'Done' };
            const preUpdateDbIssue: DbIssue = {
                _id: 'some-object-id',
                id: 1,
                issuetype: 'task',
                summary: 'Original Summary',
                description: 'Original Description',
                key: issueKey,
                status: 'To Do',
                assignee_key: null,
                created_at: now,
                updated_at: now
            };
            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
            mockIssueStatusTransitionService.isValidTransition.mockReturnValue(false);

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(updateData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: `Invalid status transition from 'To Do' to 'Done'` });
        });
    });

    describe('DELETE /:issueIdOrKey', () => {
        it('should delete an issue and return 204', async () => {
            const issueKey = 'PROJECT-123';
            const now = new Date().toISOString();
            const dbIssue: DbIssue = {
                _id: 'some-object-id',
                id: 1,
                issuetype: 'task',
                summary: 'Test issue to delete',
                description: 'Test description',
                key: issueKey,
                status: 'Done',
                assignee_key: null,
                created_at: now,
                updated_at: now
            };
            mockDatabaseService.get.mockResolvedValue(dbIssue);
            mockDatabaseService.run.mockResolvedValue(undefined);

            const response = await request
                .delete(`/rest/api/3/issue/${issueKey}`)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json')
                .set('Authorization', 'Bearer validToken');

            expect(response.status).toBe(204);
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_deleted', formatIssueResponse(dbIssue));
        });

        it('should return 404 if issue to delete is not found', async () => {
            const issueIdOrKey = 'nonexistent';
            mockDatabaseService.get.mockResolvedValue(undefined);

            const response = await request.delete(`/rest/api/3/issue/${issueIdOrKey}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Issue not found' });
        });
    });

    describe('Error Handling', () => {
        it('should return 500 for database error during issue creation', async () => {
            const issueData = {
                issuetype: 'task',
                summary: 'Test issue',
                description: 'Test description',
                key: 'TASK-1'
            };

            mockIssueKeyService.getNextIssueKey.mockImplementation(() => {
                throw new Error('Database error');
            });

            const response = await request
                .post('/rest/api/3/issue')
                .send(issueData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to create issue' });
        });

        it('should return 500 for database error during issue retrieval', async () => {
            const issueIdOrKey = '1';

            mockDatabaseService.get.mockImplementation(() => {
                throw new Error('Database error');
            });

            const response = await request.get(`/rest/api/3/issue/${issueIdOrKey}`);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to retrieve issue' });
        });

        it('should return 500 for database error during issue update', async () => {
            const issueKey = 'PROJECT-123';
            const updateData = { summary: 'Updated summary' };
            const now = new Date().toISOString();
            const preUpdateDbIssue: DbIssue = {
                _id: 'some-object-id',
                id: 1,
                issuetype: 'task',
                summary: 'Original Summary',
                description: 'Original Description',
                key: issueKey,
                status: 'To Do',
                assignee_key: null,
                created_at: now,
                updated_at: now
            };

            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
            mockDatabaseService.run.mockImplementation(() => {
                throw new Error('Database error');
            });

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(updateData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to update issue' });
        });

        it('should return 500 for database error during issue deletion', async () => {
            const issueIdOrKey = '1';

            mockDatabaseService.get.mockImplementation(() => {
                throw new Error('Database error');
            });

            const response = await request.delete(`/rest/api/3/issue/${issueIdOrKey}`);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to delete issue' });
        });
    });

    describe('Transition Issue', () => {
        it('should transition an issue status and return 204', async () => {
            const issueKey = 'PROJECT-456';
            const now = new Date().toISOString();
            const newStatus = 'In Progress';

            const preUpdateDbIssue: DbIssue = {
                _id: 'some-object-id',
                id: 2,
                issuetype: 'bug',
                summary: 'Bug to transition',
                description: 'Description',
                key: issueKey,
                status: 'To Do',
                assignee_key: null,
                created_at: now,
                updated_at: now
            };

            const postUpdateDbIssue: DbIssue = {
                ...preUpdateDbIssue,
                status: newStatus,
                assignee_key: null,
                updated_at: new Date().toISOString()
            };

            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
            mockIssueStatusTransitionService.isValidTransition.mockReturnValue(true);
            mockDatabaseService.run.mockResolvedValue(undefined);
            mockDatabaseService.get.mockResolvedValueOnce(postUpdateDbIssue);

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send({ status: newStatus })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(204);
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', formatIssueResponse(postUpdateDbIssue));
        });
    });

    describe('Update Assignee', () => {
        it('should update an issue assignee and return 204', async () => {
            const issueKey = 'PROJECT-789';
            const now = new Date().toISOString();
            const newAssigneeKey = 'user-123';

            const preUpdateDbIssue: DbIssue = {
                _id: 'some-object-id',
                id: 3,
                issuetype: 'story',
                summary: 'Story to assign',
                description: 'Description',
                key: issueKey,
                status: 'In Progress',
                assignee_key: null,
                created_at: now,
                updated_at: now
            };

            const postUpdateDbIssue: DbIssue = {
                ...preUpdateDbIssue,
                assignee_key: newAssigneeKey,
                updated_at: new Date().toISOString()
            };

            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
            mockDatabaseService.run.mockResolvedValue(undefined);
            mockDatabaseService.get.mockResolvedValueOnce(postUpdateDbIssue);

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send({ assignee_key: newAssigneeKey })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(204);
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', formatIssueResponse(postUpdateDbIssue));
        });
    });

    describe('Add Attachment', () => {
        it('should add an attachment to an issue and return 200', async () => {
            const issueKey = 'PROJECT-101';
            const now = new Date().toISOString();
            const attachmentData = {
                filename: 'screenshot.png',
                url: 'http://example.com/screenshot.png'
            };
            const newAttachmentId = 5;

            const preUpdateDbIssue: DbIssue = {
                _id: 'some-object-id',
                id: 4,
                issuetype: 'task',
                summary: 'Task for attachment',
                description: 'Description',
                key: issueKey,
                status: 'To Do',
                assignee_key: null,
                created_at: now,
                updated_at: now
            };
            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
            mockDatabaseService.run.mockResolvedValue({ lastID: newAttachmentId } as any);

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(attachmentData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(200);
        });
    });
    describe('Link Issues', () => {
        it('should link two issues and return 201', async () => {
            const sourceIssueKey = 'PROJECT-SRC-1';
            const linkedIssueKey = 'PROJECT-LINK-2';
            const linkType = 'blocks';
            const now = new Date().toISOString();

            const sourceDbIssue: DbIssue = {
                _id: 'some-object-id', id: 10, key: sourceIssueKey, issuetype: 'task', summary: 'Source', description: '', status: 'To Do', assignee_key: null, created_at: now, updated_at: now
            };
            const linkedDbIssue: DbIssue = {
                _id: 'some-object-id', id: 11, key: linkedIssueKey, issuetype: 'bug', summary: 'Linked', description: '', status: 'Open', assignee_key: null, created_at: now, updated_at: now
            };

            const mockLinkId = 15;
            mockDatabaseService.get.mockResolvedValueOnce(sourceDbIssue);
            mockDatabaseService.get.mockResolvedValueOnce(linkedDbIssue);
            mockDatabaseService.run.mockResolvedValueOnce({ lastID: mockLinkId } as any);

            const response = await request
                .put(`/rest/api/3/issue/${sourceIssueKey}`)
                .send({ linkedIssueKey, linkType })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(201);
        });
    });
});