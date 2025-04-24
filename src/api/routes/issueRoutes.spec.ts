import supertest from 'supertest';
import express from 'express';
import { createMock } from '@golevelup/ts-jest';
import { DatabaseService } from '../../services/databaseService';
import { IssueKeyService } from '../../services/issueKeyService';
import { IssueStatusTransitionService } from '../../services/issueStatusTransitionService';
import { formatIssueResponse } from '../../utils/jsonTransformer';
import { triggerWebhooks } from '../../services/webhookService';
import { Issue } from '../../models/issue';

// Mock services *before* importing routes/controller
const mockDatabaseService = createMock<DatabaseService>();
const mockIssueKeyService = createMock<IssueKeyService>();
const mockIssueStatusTransitionService = createMock<IssueStatusTransitionService>();

jest.mock('../../services/databaseService', () => ({
  DatabaseService: jest.fn(() => mockDatabaseService)
}));
jest.mock('../../services/database', () => ({ // Mock the singleton export
    databaseService: mockDatabaseService
}));
jest.mock('../../services/issueKeyService', () => ({
    IssueKeyService: jest.fn(() => mockIssueKeyService)
}));
jest.mock('../../services/issueStatusTransitionService', () => ({
    IssueStatusTransitionService: jest.fn(() => mockIssueStatusTransitionService)
}));
jest.mock('../../services/webhookService', () => ({
    triggerWebhooks: jest.fn(),
}));

// Now import the routes AFTER mocks are set up
import issueRoutes from './issueRoutes';

const mockTriggerWebhooks = triggerWebhooks as jest.Mock;
const app = express();
app.use(express.json());
app.use('/rest/api/3/issue', issueRoutes); // Use the actual routes

type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; _id: string; };

describe('issueRoutes', () => {
    let request: supertest.SuperTest<supertest.Test>;

    beforeEach(() => {
        request = supertest(app);
        // Reset mocks
        jest.clearAllMocks();
        mockDatabaseService.get.mockReset();
        mockDatabaseService.run.mockReset();
        mockIssueKeyService.getNextIssueKey.mockReset();
        mockIssueStatusTransitionService.isValidTransition.mockReset();
        // Add specific mock implementations for each test case
    });

    // --- Keep test cases, but adjust expectations based on correct mocking ---
    describe('POST /', () => {
        it('should create a new issue...', async () => {
            // Arrange: Set up mock service return values
            const issueKey = 'PROJ-1';
            const now = new Date().toISOString();
            const createdDbIssue: DbIssue = { id: 1, _id: 'some_id', issuetype: 'task', summary: 'Test issue', description: 'Test description', key: issueKey, status: 'To Do', assignee_key: null, created_at: now, updated_at: now };
            mockIssueKeyService.getNextIssueKey.mockResolvedValue(issueKey);
            mockDatabaseService.run.mockResolvedValue(undefined);
            mockDatabaseService.get.mockResolvedValue(createdDbIssue);

            const issueData = {
                issuetype: 'task',
                summary: 'Test issue',
                description: 'Test description',
            };
            // Act
            const response = await request.post('/rest/api/3/issue').send(issueData); // ...
            // Assert
            expect(response.status).toBe(201);
            expect(mockDatabaseService.run).toHaveBeenCalled(); // Check if mocked service methods were called
            expect(mockDatabaseService.get).toHaveBeenCalled();
            expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('key = ?'), [issueKey]);
            expect(response.body).toEqual(formatIssueResponse(createdDbIssue));
            // ... other assertions
        });
        it('should return 400 for missing required fields', async () => {
            const invalidIssueData = {
                summary: 'Test issue',
            };

            const response = await request
                .post('/rest/api/3/issue')
                .send(invalidIssueData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Missing required fields' });
        });
        // ... other POST tests
    });
    describe('GET /:issueIdOrKey', () => {
        it('should get an issue by ID and return 200', async () => {
            const issueId = '1';
            const now = new Date().toISOString();
            const dbIssue: DbIssue = { _id: 'some_id', id: 1, issuetype: 'task', summary: 'Test issue', description: 'Test description', key: 'PROJECT-123', status: 'In Progress', assignee_key: null, created_at: now, updated_at: now };

            mockDatabaseService.get.mockResolvedValue(dbIssue);

            const response = await request.get(`/rest/api/3/issue/${issueId}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(formatIssueResponse(dbIssue));
            expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('id = ?'), [issueId]);
        });

        it('should get an issue by key and return 200', async () => {
            const issueKey = 'PROJECT-123';
            const now = new Date().toISOString();
            const dbIssue: DbIssue = { _id: 'some_id', id: 1, issuetype: 'task', summary: 'Test issue', description: 'Test description', key: issueKey, status: 'In Progress', assignee_key: null, created_at: now, updated_at: now };

            mockDatabaseService.get.mockResolvedValue(dbIssue);

            const response = await request.get(`/rest/api/3/issue/${issueKey}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(formatIssueResponse(dbIssue));
            expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('key = ?'), [issueKey]);
        });

        it('should return 404 if issue is not found', async () => {
            const issueIdOrKey = 'nonexistent-999';

            mockDatabaseService.get.mockResolvedValue(undefined);

            const response = await request.get(`/rest/api/3/issue/${issueIdOrKey}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Issue not found' });
            // Check it tried to fetch by key (assuming string means key)
             expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('key = ?'), [issueIdOrKey]);
        });
    });

    describe('PUT /:issueIdOrKey', () => {
        it('should update an issue and return 204', async () => {
            const issueKey = 'PROJECT-123';
            const now = new Date().toISOString();
            const updateData = {
                summary: 'Updated issue summary',
                description: 'Updated description',
                status: 'In Progress' // Valid status change
            };

            const preUpdateDbIssue: DbIssue = {
                _id: 'some_id', id: 1,
                issuetype: 'task',
                summary: 'Original Summary',
                description: 'Original Description',
                key: issueKey,
                status: 'To Do', // Current status
                assignee_key: null,
                created_at: now,
                updated_at: now
            };

            const postUpdateDbIssue: DbIssue = {
                _id: 'some_id', id: 1,
                issuetype: 'task',
                summary: updateData.summary,
                description: updateData.description,
                key: issueKey,
                status: updateData.status,
                assignee_key: null,
                created_at: now,
                updated_at: now
            };

            // Mock sequence: get pre-update, validate transition, run update, get post-update
            mockDatabaseService.get
                .mockResolvedValueOnce(preUpdateDbIssue)
                .mockResolvedValueOnce(postUpdateDbIssue);

            (mockIssueStatusTransitionService.isValidTransition as jest.Mock).mockReturnValue(true);

            mockDatabaseService.run.mockResolvedValue(undefined);

            // Mock the getStatusId method
            (mockIssueStatusTransitionService as any).getStatusId = jest.fn((statusName: string) => {
                if (statusName === 'To Do') return 11;
                if (statusName === 'In Progress') return 21;
                if (statusName === 'Done') return 31;
                return undefined;
            });

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(updateData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(204); // Standard for successful PUT with no body response
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(2); // Once before update, once after
            expect(mockDatabaseService.get).toHaveBeenNthCalledWith(1, expect.stringContaining('key = ?'), [issueKey]);
            // Assuming status IDs: 'To Do' -> 11, 'In Progress' -> 21
            expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalledWith(11, 21, mockDatabaseService);
            expect(mockDatabaseService.run).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE issues SET summary = ?, description = ?, status = ?, updated_at = ? WHERE key = ?'),
                [updateData.summary, updateData.description, updateData.status, expect.any(String), issueKey]
            );
             expect(mockDatabaseService.get).toHaveBeenNthCalledWith(2, expect.stringContaining('key = ?'), [issueKey]);
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expect.objectContaining({
                 id: preUpdateDbIssue.id,
                 key: preUpdateDbIssue.key,
                 fields: expect.objectContaining({
                     summary: updateData.summary,
                     description: updateData.description,
                     status: expect.objectContaining({ name: updateData.status })
                 })
            }));

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
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).not.toHaveBeenCalled();

        });

        it('should return 400 if no valid fields to update are provided', async () => {
            const issueKey = 'PROJECT-123';
            const now = new Date().toISOString();
            const preUpdateDbIssue: DbIssue = { _id: 'some_id', id: 1, issuetype: 'task', summary: 'Original Summary', description: 'Original Description', key: issueKey, status: 'To Do', assignee_key: null, created_at: now, updated_at: now
            };

            mockDatabaseService.get.mockResolvedValue(preUpdateDbIssue);
            const invalidUpdateData = { invalidField: 'Invalid data' }; // No valid fields

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(invalidUpdateData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'No valid fields to update provided' });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();

        });

        it('should return 400 for invalid status transition', async () => {
            const issueKey = 'PROJECT-123';
            const now = new Date().toISOString();
            const updateData = { status: 'Done' }; // Assume invalid transition from 'To Do'
            const preUpdateDbIssue: DbIssue = { _id: 'some_id', id: 1, issuetype: 'task', summary: 'Original Summary', description: 'Original Description', key: issueKey, status: 'To Do', assignee_key: null, created_at: now, updated_at: now
            };

            mockDatabaseService.get.mockResolvedValue(preUpdateDbIssue);

            (mockIssueStatusTransitionService.isValidTransition as jest.Mock).mockReturnValue(false); // Simulate invalid transition
            (mockIssueStatusTransitionService as any).getStatusId = jest.fn((statusName: string) => {
                if (statusName === 'To Do') return 11;
                if (statusName === 'In Progress') return 21;
                if (statusName === 'Done') return 31;
                return undefined;
            });

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(updateData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: `Invalid status transition from 'To Do' to 'Done'` });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
             // Assuming status IDs: 'To Do' -> 11, 'Done' -> 31
            expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalledWith(11, 31, mockDatabaseService);
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();

        });
    });

    describe('DELETE /:issueIdOrKey', () => {
        it('should delete an issue and return 204', async () => {
            const issueKey = 'PROJECT-123';
            const now = new Date().toISOString();
            const dbIssue: DbIssue = { _id: 'some_id', id: 1, issuetype: 'task', summary: 'Test issue to delete', description: 'Test description', key: issueKey, status: 'Done', assignee_key: null, created_at: now, updated_at: now
            };

            mockDatabaseService.get.mockResolvedValue(dbIssue);
            mockDatabaseService.run.mockResolvedValue(undefined);

            const response = await request
                .delete(`/rest/api/3/issue/${issueKey}`)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(204);
            expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('key = ?'), [issueKey]);
            expect(mockDatabaseService.run).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM issues WHERE key = ?'), [issueKey]);
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_deleted', formatIssueResponse(dbIssue));

        });

        it('should return 404 if issue to delete is not found', async () => {
            const issueIdOrKey = 'nonexistent';

            mockDatabaseService.get.mockResolvedValue(undefined);

            const response = await request.delete(`/rest/api/3/issue/${issueIdOrKey}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Issue not found' });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).not.toHaveBeenCalled();

        });
    });

    describe('Error Handling', () => {
        it('should return 500 for database error during issue creation', async () => {
            const issueData = {
                issuetype: 'task',
                summary: 'Test issue',
                description: 'Test description',
            };

            (mockIssueKeyService.getNextIssueKey as jest.Mock).mockResolvedValue('PROJ-ERR');
            mockDatabaseService.run.mockRejectedValue(new Error('Database connection lost'));

            const response = await request
                .post('/rest/api/3/issue')
                .send({
                     issuetype: issueData.issuetype,
                     summary: issueData.summary,
                     description: issueData.description,
                 })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to create issue' });
            expect(mockDatabaseService.get).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();

        });

         it('should return 500 for database error during issue creation (key gen fails)', async () => {
             const issueData = {
                 issuetype: 'task',
                 summary: 'Test issue',
                 description: 'Test description',
             };

             (mockIssueKeyService.getNextIssueKey as jest.Mock).mockRejectedValue(new Error('Key service error'));

             const response = await request
                 .post('/rest/api/3/issue')
                 .send(issueData)
                 .set('Accept', 'application/json')
                 .set('Content-Type', 'application/json');

             expect(response.status).toBe(500);
             expect(response.body).toEqual({ message: 'Failed to create issue' });
             expect(mockDatabaseService.run).not.toHaveBeenCalled();
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();

         });


        it('should return 500 for database error during issue retrieval', async () => {
            const issueIdOrKey = '1';
            mockDatabaseService.get.mockRejectedValue(new Error('Database timeout'));

            const response = await request.get(`/rest/api/3/issue/${issueIdOrKey}`);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to retrieve issue' });
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();

        });

        it('should return 500 for database error during issue update', async () => {
            const issueKey = 'PROJECT-123';
            const updateData = { summary: 'Updated summary' };
            const now = new Date().toISOString();
            const preUpdateDbIssue: DbIssue = { _id: 'some_id', id: 1, issuetype: 'task', summary: 'Original Summary', description: 'Original Description', key: issueKey, status: 'To Do', assignee_key: null, created_at: now, updated_at: now
            };

            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
            mockDatabaseService.run.mockRejectedValue(new Error('Database write error'));

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(updateData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to update issue' });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1); // Only the first GET mock call
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();

        });

        it('should return 500 for database error during issue deletion', async () => {
            const issueKey = 'PROJECT-DEL-ERR';
             const now = new Date().toISOString();
             const dbIssue: DbIssue = { _id: 'some_id', id: 1, issuetype: 'task', summary: 'To Delete', description: '', key: issueKey, status: 'Done', assignee_key: null, created_at: now, updated_at: now
             };

            mockDatabaseService.get.mockResolvedValueOnce(dbIssue);
            mockDatabaseService.run.mockRejectedValue(new Error('Database lock error'));

            const response = await request.delete(`/rest/api/3/issue/${issueKey}`);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to delete issue' });
             expect(mockDatabaseService.get).toHaveBeenCalledTimes(1); // Only the first GET mock call
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();

        });
    });

    describe('PUT /:issueIdOrKey - Specific Actions (if applicable)', () => {
        it('should update an issue assignee via PUT and return 204', async () => {
            const issueKey = 'PROJECT-789';
            const now = new Date().toISOString();
            const newAssigneeKey = 'user-123';

            const preUpdateDbIssue: DbIssue = {
                _id: 'some_id', id: 3, issuetype: 'story', summary: 'Story to assign', description: 'Description', key: issueKey, status: 'In Progress', assignee_key: null, created_at: now, updated_at: now
            };
            const postUpdateDbIssue: DbIssue = {
                ...preUpdateDbIssue,
                assignee_key: newAssigneeKey,
                updated_at: new Date().toISOString() // Simulate update
            };

            mockDatabaseService.get
                .mockResolvedValueOnce(preUpdateDbIssue)
                .mockResolvedValueOnce(postUpdateDbIssue);
            mockDatabaseService.run.mockResolvedValue(undefined);

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send({ assignee_key: newAssigneeKey })
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(204);
            expect(mockDatabaseService.run).toHaveBeenCalledWith(
                 expect.stringContaining('UPDATE issues SET assignee_key = ?, updated_at = ? WHERE key = ?'),
                 [newAssigneeKey, expect.any(String), issueKey]
             );
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expect.objectContaining({
                 key: issueKey,
                 fields: expect.objectContaining({ assignee: { key: newAssigneeKey } })
             }));

        });
    });

});
