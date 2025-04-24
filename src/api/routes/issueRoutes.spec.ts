import supertest from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { createMock } from '@golevelup/ts-jest';
import { DatabaseService } from '../../services/databaseService';
import { IssueKeyService } from '../../services/issueKeyService';
import { IssueStatusTransitionService } from '../../services/issueStatusTransitionService';
import { formatIssueResponse } from '../../utils/jsonTransformer';
import { triggerWebhooks } from '../../services/webhookService';
import { Issue } from '../../models/issue';

// Define an interface for potential custom properties on Request
interface CustomRequest extends Request {
    databaseService?: DatabaseService;
    issueKeyService?: IssueKeyService;
    issueStatusTransitionService?: IssueStatusTransitionService;
}


// Mock services *before* importing routes/controller
const mockDatabaseService = createMock<DatabaseService>();
const mockIssueKeyService = createMock<IssueKeyService>();
const mockIssueStatusTransitionService = createMock<IssueStatusTransitionService>();

// Mock the modules - this intercepts imports within the routes/controllers
jest.mock('../../services/databaseService', () => ({
  DatabaseService: jest.fn(() => mockDatabaseService)
}));
// Mock the singleton export if it exists and is used
jest.mock('../../services/database', () => ({
    databaseService: mockDatabaseService
}));
jest.mock('../../services/issueKeyService', () => ({
    // If IssueKeyService is used as a class:
    // IssueKeyService: jest.fn(() => mockIssueKeyService)
    // If IssueKeyService is used as a singleton instance export named 'issueKeyService':
    issueKeyService: mockIssueKeyService
}));
jest.mock('../../services/issueStatusTransitionService', () => ({
    // If IssueStatusTransitionService is used as a class:
    // IssueStatusTransitionService: jest.fn(() => mockIssueStatusTransitionService)
    // If IssueStatusTransitionService is used as a singleton instance export:
    issueStatusTransitionService: mockIssueStatusTransitionService
}));
jest.mock('../../services/webhookService', () => ({
    triggerWebhooks: jest.fn(),
}));

// Now import the routes AFTER mocks are set up
import issueRoutes from './issueRoutes';

const mockTriggerWebhooks = triggerWebhooks as jest.Mock;

// Create Express app for testing
const app = express();
app.use(express.json());

// Middleware to attach mocked services to the request object
// This simulates how services might be injected or made available in a real app
// (e.g., via app.locals, dependency injection container, or custom middleware)
// This directly addresses the request to have `issueKeyService` on the `request` object context.
app.use((req: CustomRequest, res: Response, next: NextFunction) => {
    // Option 1: Attach directly to req (if app uses this pattern)
    // req.databaseService = mockDatabaseService;
    // req.issueKeyService = mockIssueKeyService;
    // req.issueStatusTransitionService = mockIssueStatusTransitionService;

    // Option 2: Attach to req.app.locals (common pattern)
    req.app.locals.databaseService = mockDatabaseService;
    req.app.locals.issueKeyService = mockIssueKeyService;
    req.app.locals.issueStatusTransitionService = mockIssueStatusTransitionService;
    next();
});


// Mount the actual routes AFTER the middleware
app.use('/rest/api/3/issue', issueRoutes);

type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; _id: string; };

describe('issueRoutes', () => {
    let request: supertest.SuperTest<supertest.Test>;

    beforeEach(() => {
        request = supertest(app);
        // Reset mocks for isolation between tests
        jest.clearAllMocks(); // Clears call counts, etc.
        mockDatabaseService.get.mockReset();
        mockDatabaseService.run.mockReset();
        mockIssueKeyService.getNextIssueKey.mockReset();
        mockIssueStatusTransitionService.isValidTransition.mockReset();
        // Reset any potentially mocked methods on the singleton mocks if necessary
        // e.g., (mockIssueKeyService.someMethod as jest.Mock).mockReset();

        // It's often better to redefine default mock implementations here if needed,
        // rather than relying on unclear state from previous tests.
        // Example: mockIssueKeyService.getNextIssueKey.mockResolvedValue('DEFAULT-KEY');
    });

    // --- Test cases remain largely the same, but now trust that ---
    // --- the route handlers can access the mocked services       ---
    // --- either via import (intercepted by jest.mock)           ---
    // --- or via the request object (req.app.locals.*)            ---

    describe('POST /', () => {
        it('should create a new issue, call issueKeyService, and return 201', async () => {
            // Arrange: Set up specific mock behaviors for this test
            const issueKey = 'PROJ-1';
            const now = new Date().toISOString();
            const createdDbIssue: DbIssue = { id: 1, _id: 'some_id', issuetype: 'task', summary: 'Test issue', description: 'Test description', key: issueKey, status: 'To Do', assignee_key: null, created_at: now, updated_at: now };

            mockIssueKeyService.getNextIssueKey.mockResolvedValue(issueKey);
            // Assume run is for INSERT, get is for fetching the created issue
            mockDatabaseService.run.mockResolvedValue(undefined);
            mockDatabaseService.get.mockResolvedValue(createdDbIssue);

            const issueData = {
                issuetype: 'task',
                summary: 'Test issue',
                description: 'Test description',
            };

            // Act
            const response = await request
                .post('/rest/api/3/issue')
                .send(issueData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            // Assert
            expect(response.status).toBe(201);
            // Verify service interactions
            expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalledTimes(1); // Ensure key service was called
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(1); // Check if DB insert was called
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1); // Check if DB fetch was called
            expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('key = ?'), [issueKey]);
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_created', expect.anything()); // Check webhook trigger
            // Verify response body
            expect(response.body).toEqual(formatIssueResponse(createdDbIssue));
        });

        it('should return 400 for missing required fields', async () => {
            const invalidIssueData = {
                // Missing 'issuetype' and 'summary'
                description: 'Only description provided',
            };

            const response = await request
                .post('/rest/api/3/issue')
                .send(invalidIssueData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Missing required fields' });
            expect(mockIssueKeyService.getNextIssueKey).not.toHaveBeenCalled();
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        });

        it('should return 500 if issue key generation fails', async () => {
             const issueData = {
                 issuetype: 'bug',
                 summary: 'Key gen fail test',
                 description: 'This should fail',
             };
             mockIssueKeyService.getNextIssueKey.mockRejectedValue(new Error('Key generation error'));

             const response = await request
                 .post('/rest/api/3/issue')
                 .send(issueData)
                 .set('Accept', 'application/json')
                 .set('Content-Type', 'application/json');

             expect(response.status).toBe(500);
             expect(response.body).toEqual({ message: 'Failed to create issue' });
             expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalledTimes(1);
             expect(mockDatabaseService.run).not.toHaveBeenCalled();
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();
         });

        it('should return 500 if database insertion fails', async () => {
            const issueKey = 'PROJ-DBFAIL';
            const issueData = {
                issuetype: 'task',
                summary: 'DB fail test',
                description: 'This should fail at DB run',
            };
            mockIssueKeyService.getNextIssueKey.mockResolvedValue(issueKey);
            mockDatabaseService.run.mockRejectedValue(new Error('Database write failed'));

            const response = await request
                .post('/rest/api/3/issue')
                .send(issueData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to create issue' });
            expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.get).not.toHaveBeenCalled(); // Shouldn't try to fetch if run failed
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        });
    });

    describe('GET /:issueIdOrKey', () => {
        it('should get an issue by numeric ID and return 200', async () => {
            const issueId = '1';
            const now = new Date().toISOString();
            const dbIssue: DbIssue = { _id: 'some_id_1', id: 1, issuetype: 'task', summary: 'Get By ID', description: 'Test description', key: 'PROJECT-1', status: 'In Progress', assignee_key: null, created_at: now, updated_at: now };

            mockDatabaseService.get.mockResolvedValue(dbIssue);

            const response = await request.get(`/rest/api/3/issue/${issueId}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(formatIssueResponse(dbIssue));
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            // Check if the query correctly identified it as an ID
            expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('id = ?'), [issueId]);
        });

        it('should get an issue by string key and return 200', async () => {
            const issueKey = 'PROJECT-123';
            const now = new Date().toISOString();
            const dbIssue: DbIssue = { _id: 'some_id_123', id: 123, issuetype: 'story', summary: 'Get By Key', description: 'Test description', key: issueKey, status: 'To Do', assignee_key: 'user-1', created_at: now, updated_at: now };

            mockDatabaseService.get.mockResolvedValue(dbIssue);

            const response = await request.get(`/rest/api/3/issue/${issueKey}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(formatIssueResponse(dbIssue));
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            // Check if the query correctly identified it as a key
            expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('key = ?'), [issueKey]);
        });

        it('should return 404 if issue is not found by ID', async () => {
            const issueId = '9999';
            mockDatabaseService.get.mockResolvedValue(undefined);

            const response = await request.get(`/rest/api/3/issue/${issueId}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Issue not found' });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('id = ?'), [issueId]);
        });

        it('should return 404 if issue is not found by key', async () => {
            const issueKey = 'NONEXISTENT-KEY';
            mockDatabaseService.get.mockResolvedValue(undefined);

            const response = await request.get(`/rest/api/3/issue/${issueKey}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Issue not found' });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('key = ?'), [issueKey]);
        });

        it('should return 500 for database error during issue retrieval', async () => {
            const issueIdOrKey = 'ANY-ID';
            mockDatabaseService.get.mockRejectedValue(new Error('Database connection failed'));

            const response = await request.get(`/rest/api/3/issue/${issueIdOrKey}`);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to retrieve issue' });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
        });
    });

    describe('PUT /:issueIdOrKey', () => {
        const issueKey = 'PROJECT-123';
        const issueId = '1';
        const now = new Date().toISOString();
        const preUpdateDbIssue: DbIssue = {
            _id: 'some_id_put', id: 1,
            issuetype: 'task',
            summary: 'Original Summary',
            description: 'Original Description',
            key: issueKey,
            status: 'To Do', // Current status
            assignee_key: null,
            created_at: now,
            updated_at: now
        };

        // Mock getStatusId function (adjust IDs as per actual implementation)
        const mockGetStatusId = jest.fn((statusName: string) => {
            if (statusName === 'To Do') return 11;
            if (statusName === 'In Progress') return 21;
            if (statusName === 'Done') return 31;
            return undefined; // Or throw error for unknown status
        });
        // Assign the mock function to the mock service instance
        (mockIssueStatusTransitionService as any).getStatusId = mockGetStatusId;


        it('should update issue summary and description by key, return 204', async () => {
            const updateData = {
                summary: 'Updated issue summary',
                description: 'Updated description',
            };
            const postUpdateDbIssue: DbIssue = {
                ...preUpdateDbIssue,
                summary: updateData.summary,
                description: updateData.description,
                updated_at: new Date().toISOString() // Simulate timestamp update
            };

            // Mock sequence: get pre-update, run update, get post-update (for webhook)
            mockDatabaseService.get
                .mockResolvedValueOnce(preUpdateDbIssue) // First call finds the issue
                .mockResolvedValueOnce(postUpdateDbIssue); // Second call for webhook data
            mockDatabaseService.run.mockResolvedValue(undefined); // Update succeeds

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(updateData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(204);
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(2); // Called twice
            expect(mockDatabaseService.get).toHaveBeenNthCalledWith(1, expect.stringContaining('key = ?'), [issueKey]);
            expect(mockIssueStatusTransitionService.isValidTransition).not.toHaveBeenCalled(); // Status not changing
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE issues SET summary = ?, description = ?, updated_at = ? WHERE key = ?'),
                [updateData.summary, updateData.description, expect.any(String), issueKey]
            );
            expect(mockDatabaseService.get).toHaveBeenNthCalledWith(2, expect.stringContaining('key = ?'), [issueKey]); // Fetch again for webhook
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expect.objectContaining({
                 key: issueKey,
                 changelog: expect.arrayContaining([
                     expect.objectContaining({ field: 'summary', fromString: preUpdateDbIssue.summary, toString: updateData.summary }),
                     expect.objectContaining({ field: 'description', fromString: preUpdateDbIssue.description, toString: updateData.description })
                 ]),
                 fields: expect.objectContaining({ summary: updateData.summary }) // Check snapshot fields
            }));
        });

        it('should update issue status by ID with valid transition, return 204', async () => {
             const updateData = { status: 'In Progress' }; // Transition To Do -> In Progress
             const postUpdateDbIssue: DbIssue = {
                 ...preUpdateDbIssue,
                 status: updateData.status,
                 updated_at: new Date().toISOString()
             };

             // Mock sequence: get pre-update, validate transition, run update, get post-update
             mockDatabaseService.get
                 .mockResolvedValueOnce(preUpdateDbIssue)
                 .mockResolvedValueOnce(postUpdateDbIssue);
             mockIssueStatusTransitionService.isValidTransition.mockReturnValue(true); // Simulate valid transition
             mockDatabaseService.run.mockResolvedValue(undefined);

             const response = await request
                 .put(`/rest/api/3/issue/${issueId}`) // Using ID this time
                 .send(updateData)
                 .set('Accept', 'application/json')
                 .set('Content-Type', 'application/json');

             expect(response.status).toBe(204);
             expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
             expect(mockDatabaseService.get).toHaveBeenNthCalledWith(1, expect.stringContaining('id = ?'), [issueId]); // Found by ID
             expect(mockIssueStatusTransitionService.getStatusId).toHaveBeenCalledWith('To Do'); // Get current status ID
             expect(mockIssueStatusTransitionService.getStatusId).toHaveBeenCalledWith('In Progress'); // Get target status ID
             expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalledWith(11, 21, mockDatabaseService); // Validate 11 -> 21
             expect(mockDatabaseService.run).toHaveBeenCalledTimes(1);
             expect(mockDatabaseService.run).toHaveBeenCalledWith(
                 expect.stringContaining('UPDATE issues SET status = ?, updated_at = ? WHERE id = ?'),
                 [updateData.status, expect.any(String), issueId]
             );
             expect(mockDatabaseService.get).toHaveBeenNthCalledWith(2, expect.stringContaining('id = ?'), [issueId]); // Fetch again for webhook
             expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
             expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expect.objectContaining({
                 key: issueKey, // Webhook should still use key if possible
                 changelog: expect.arrayContaining([
                     expect.objectContaining({ field: 'status', fromString: preUpdateDbIssue.status, toString: updateData.status })
                 ]),
                 fields: expect.objectContaining({ status: expect.objectContaining({ name: updateData.status }) })
            }));
         });

        it('should return 404 if issue to update is not found', async () => {
            const nonExistentKey = 'NONEXISTENT-PUT';
            const updateData = { summary: 'Updated summary' };
            mockDatabaseService.get.mockResolvedValue(undefined); // Issue not found

            const response = await request
                .put(`/rest/api/3/issue/${nonExistentKey}`)
                .send(updateData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Issue not found' });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('key = ?'), [nonExistentKey]);
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        });

        it('should return 400 if no valid fields to update are provided', async () => {
            mockDatabaseService.get.mockResolvedValue(preUpdateDbIssue); // Issue found
            const invalidUpdateData = { invalidField: 'Invalid data', anotherField: 123 }; // No valid fields

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(invalidUpdateData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'No valid fields to update provided' });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1); // Only the initial get
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        });

        it('should return 400 for invalid status transition', async () => {
            const updateData = { status: 'Done' }; // Invalid transition from 'To Do' directly to 'Done' maybe
            mockDatabaseService.get.mockResolvedValue(preUpdateDbIssue); // Issue found, status 'To Do'
            mockIssueStatusTransitionService.isValidTransition.mockReturnValue(false); // Simulate invalid transition

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(updateData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: `Invalid status transition from 'To Do' to 'Done'` });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockIssueStatusTransitionService.getStatusId).toHaveBeenCalledWith('To Do');
            expect(mockIssueStatusTransitionService.getStatusId).toHaveBeenCalledWith('Done');
            expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalledWith(11, 31, mockDatabaseService); // Validate 11 -> 31
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        });

        it('should return 500 for database error during issue update', async () => {
            const updateData = { summary: 'Updated summary' };
            mockDatabaseService.get.mockResolvedValue(preUpdateDbIssue); // Issue found
            mockDatabaseService.run.mockRejectedValue(new Error('Database write error')); // Update fails

            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(updateData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to update issue' });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1); // Only the initial get
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        });
    });

    describe('DELETE /:issueIdOrKey', () => {
        const issueKey = 'PROJECT-DEL';
        const issueId = '5';
        const now = new Date().toISOString();
        const dbIssueToDelete: DbIssue = {
            _id: 'some_id_del', id: 5,
            issuetype: 'task',
            summary: 'Issue to delete',
            description: 'Will be deleted',
            key: issueKey,
            status: 'Done',
            assignee_key: null,
            created_at: now,
            updated_at: now
        };

        it('should delete an issue by key and return 204', async () => {
            mockDatabaseService.get.mockResolvedValue(dbIssueToDelete); // Found issue to delete
            mockDatabaseService.run.mockResolvedValue(undefined); // Deletion successful

            const response = await request
                .delete(`/rest/api/3/issue/${issueKey}`)
                .set('Accept', 'application/json');

            expect(response.status).toBe(204);
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('key = ?'), [issueKey]);
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM issues WHERE key = ?'), [issueKey]);
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            // Pass the data *before* deletion to the webhook
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_deleted', formatIssueResponse(dbIssueToDelete));
        });

         it('should delete an issue by ID and return 204', async () => {
             mockDatabaseService.get.mockResolvedValue(dbIssueToDelete); // Found issue to delete
             mockDatabaseService.run.mockResolvedValue(undefined); // Deletion successful

             const response = await request
                 .delete(`/rest/api/3/issue/${issueId}`) // Using ID
                 .set('Accept', 'application/json');

             expect(response.status).toBe(204);
             expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
             expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('id = ?'), [issueId]); // Searched by ID
             expect(mockDatabaseService.run).toHaveBeenCalledTimes(1);
             expect(mockDatabaseService.run).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM issues WHERE id = ?'), [issueId]); // Deleted by ID
             expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
             expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_deleted', formatIssueResponse(dbIssueToDelete));
         });


        it('should return 404 if issue to delete is not found', async () => {
            const nonExistentKey = 'NONEXISTENT-DEL';
            mockDatabaseService.get.mockResolvedValue(undefined); // Issue not found

            const response = await request.delete(`/rest/api/3/issue/${nonExistentKey}`);

            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Issue not found' });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        });

        it('should return 500 for database error during issue deletion', async () => {
            mockDatabaseService.get.mockResolvedValue(dbIssueToDelete); // Issue found
            mockDatabaseService.run.mockRejectedValue(new Error('Database lock error')); // Deletion fails

            const response = await request.delete(`/rest/api/3/issue/${issueKey}`);

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to delete issue' });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1); // Called get before trying run
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).not.toHaveBeenCalled(); // Webhook shouldn't fire if deletion failed
        });
    });

    // Specific Action Tests (Example: Assignee Update via PUT)
    describe('PUT /:issueIdOrKey - Specific Actions', () => {
        it('should update an issue assignee via PUT and return 204', async () => {
            const issueKey = 'PROJECT-789';
            const now = new Date().toISOString();
            const newAssigneeKey = 'user-123';

            const preUpdateDbIssue: DbIssue = {
                _id: 'some_id_assign', id: 3, issuetype: 'story', summary: 'Story to assign', description: 'Description', key: issueKey, status: 'In Progress', assignee_key: null, created_at: now, updated_at: now
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
                .send({ assignee_key: newAssigneeKey }) // Only sending assignee_key
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
                 changelog: expect.arrayContaining([
                     expect.objectContaining({ field: 'assignee', from: null, to: newAssigneeKey }) // Check changelog for assignee
                 ]),
                 fields: expect.objectContaining({ assignee: { key: newAssigneeKey } }) // Check snapshot
             }));
        });

         it('should clear an issue assignee via PUT with null and return 204', async () => {
             const issueKey = 'PROJECT-790';
             const now = new Date().toISOString();
             const currentAssigneeKey = 'user-456';

             const preUpdateDbIssue: DbIssue = {
                 _id: 'some_id_unassign', id: 4, issuetype: 'bug', summary: 'Bug to unassign', description: 'Description', key: issueKey, status: 'To Do', assignee_key: currentAssigneeKey, created_at: now, updated_at: now
             };
             const postUpdateDbIssue: DbIssue = {
                 ...preUpdateDbIssue,
                 assignee_key: null, // Assignee cleared
                 updated_at: new Date().toISOString()
             };

             mockDatabaseService.get
                 .mockResolvedValueOnce(preUpdateDbIssue)
                 .mockResolvedValueOnce(postUpdateDbIssue);
             mockDatabaseService.run.mockResolvedValue(undefined);

             const response = await request
                 .put(`/rest/api/3/issue/${issueKey}`)
                 .send({ assignee_key: null }) // Sending null for assignee_key
                 .set('Accept', 'application/json')
                 .set('Content-Type', 'application/json');

             expect(response.status).toBe(204);
             expect(mockDatabaseService.run).toHaveBeenCalledWith(
                  expect.stringContaining('UPDATE issues SET assignee_key = ?, updated_at = ? WHERE key = ?'),
                  [null, expect.any(String), issueKey]
              );
             expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
             expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expect.objectContaining({
                  key: issueKey,
                  changelog: expect.arrayContaining([
                      expect.objectContaining({ field: 'assignee', from: currentAssigneeKey, to: null }) // Check changelog
                  ]),
                  fields: expect.objectContaining({ assignee: null }) // Check snapshot
              }));
         });
    });

});