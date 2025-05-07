import supertest from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { createMock } from '@golevelup/ts-jest';
// Import services to be mocked
import { DatabaseService } from '../../services/databaseService';
import { IssueKeyService } from '../../services/issueKeyService';
import { IssueStatusTransitionService } from '../../services/issueStatusTransitionService';
import { triggerWebhooks } from '../../services/webhookService';
// Import utility and model
import { formatIssueResponse } from '../../utils/jsonTransformer';
import { Issue } from '../../models/issue';
// --- Mock Dependencies BEFORE Importing Controller/Routes ---
// Create mock instances using @golevelup/ts-jest for convenience
const mockDatabaseService = createMock<DatabaseService>();
const mockIssueKeyService = createMock<IssueKeyService>();
const mockIssueStatusTransitionService = createMock<IssueStatusTransitionService>();
// Create a standard Jest mock for the standalone function
const mockTriggerWebhooks = jest.fn();
// Mock the modules themselves. This intercepts imports within the controller.
// When the actual IssueController is instantiated (likely triggered by importing issueRoutes),
// it will receive these mocked instances instead of the real ones.
jest.mock('../../services/databaseService', () => ({
    // Mock the class constructor to return our mock instance
    DatabaseService: jest.fn().mockImplementation(() => mockDatabaseService)
}));
jest.mock('../../services/issueKeyService', () => ({
    // Mock the class constructor
    IssueKeyService: jest.fn().mockImplementation(() => mockIssueKeyService)
}));
jest.mock('../../services/issueStatusTransitionService', () => ({
    // Mock the class constructor
    IssueStatusTransitionService: jest.fn().mockImplementation(() => mockIssueStatusTransitionService)
}));
jest.mock('../../services/webhookService', () => ({
    // Mock the specific exported function
    triggerWebhooks: mockTriggerWebhooks
}));
// --- Import Controller and Routes AFTER Mocks are Set Up ---
// Import the *actual* controller. Its dependencies will be mocked due to the above setup.
// Note: The instantiation logic in `issueController.ts` (if it exports an instance)
// will use the mocked services.
import { IssueController } from '../controllers/issueController'; // Import the actual controller class
import issueRoutes from './issueRoutes'; // Import the actual routes
// --- Test Setup ---
// Define a type for the expected shape of DB issues
// Ensure nullable fields match the database schema and usage
type DbIssue = Issue & {
    id: number;
    _id: string;
    key: string;
    status: string;
    assignee_key: string | null | undefined;
    created_at: string;
    updated_at: string;
    parentKey: string | null | undefined;
};
// Create Express app for testing
const app = express();
// Middleware Setup
app.use(express.json());
// !! Crucial for testing dependency injection via req.app.locals if used !!
// If the controller *did* access services via req.app.locals, this would inject mocks.
// However, based on the provided controller code using constructor injection,
// this middleware might not be strictly necessary for *this specific controller's*
// dependencies, as module-level mocking handles it. But it's good practice
// if other parts of the app use locals for DI.
app.use((req: Request, res: Response, next: NextFunction) => {
    req.app.locals.databaseService = mockDatabaseService;
    req.app.locals.issueKeyService = mockIssueKeyService;
    req.app.locals.issueStatusTransitionService = mockIssueStatusTransitionService;
    // We DO NOT add the controller itself to locals as we want the routes to use the actual controller
    next();
});
// Mount the *actual* routes. These routes use the actual IssueController instance,
// which has been instantiated with mocked services because jest.mock intercepted the service imports.
app.use('/rest/api/3/issue', issueRoutes);
// Add a generic error handler *after* routes to catch errors passed via next()
// This is useful for testing 500 error scenarios originating from the controller
app.use((err: Error & { statusCode?: number }, req: Request, res: Response, next: NextFunction) => {
    console.error('Test Error Handler Caught:', err); // Log caught errors during tests
    if (!res.headersSent) {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || 'Internal Server Error' });
    } else {
        next(err); // Delegate to default Express handler if headers sent
    }
});
// --- Test Suite ---
describe('issueRoutes Integration Tests', () => {
    let request: supertest.SuperTest<supertest.Test>;
    beforeAll(() => {
        // Instantiate supertest with the test app
        request = supertest(app);
    });
    beforeEach(() => {
        // Reset mocks before each test to ensure isolation
        jest.clearAllMocks();
        // You might need to reset specific mock implementations if they are stateful
        // e.g., mockDatabaseService.get.mockReset();
        //       mockIssueKeyService.getNextIssueKey.mockReset(); etc.
        // Using jest.clearAllMocks() is generally sufficient for clearing calls and instances.
    });
    // --- Test Cases ---
    describe('POST /rest/api/3/issue', () => {
        it('should call IssueController.createIssue and return 201 on success', async () => {
            // Arrange: Configure Mocks for the Controller's logic
            const issueData = {
                issuetype: 'task',
                summary: 'Create Test',
                description: 'Test description',
            };
            const issueKey = 'TASK-1';
            const now = new Date().toISOString();
            // Simulate the shape of the data the controller expects to retrieve after insertion
            // Use Omit carefully, ensure remaining properties match the target type
            const createdDbIssueBase: Omit<DbIssue, 'assignee_key' | 'parentKey'> = {
                _id: '653412345678901234567890',
                id: 1,
                issuetype: issueData.issuetype,
                summary: issueData.summary,
                description: issueData.description,
                key: issueKey,
                status: 'To Do', // Default status set by controller
                created_at: now,
                updated_at: now,
            };
            const createdDbIssueWithNulls: DbIssue = {
                ...createdDbIssueBase,
                assignee_key: null,
                parentKey: null
            }
            // The controller will format this before sending
            const dbIssueForFormatting: DbIssue = { ...createdDbIssueWithNulls };
            const formattedResponse = formatIssueResponse(dbIssueForFormatting); // Add dummy _id for format function
            mockIssueKeyService.getNextIssueKey.mockResolvedValue(issueKey);
            mockDatabaseService.run.mockResolvedValue(undefined); // Mock the INSERT operation
            mockDatabaseService.get.mockResolvedValue(dbIssueForFormatting); // Mock the SELECT after insert
            mockTriggerWebhooks.mockResolvedValue(undefined); // Mock webhook trigger
            // Act: Make the request
            const response = await request
                .post('/rest/api/3/issue')
                .send(issueData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');
            // Assert: Verify Response and Mock Interactions
            expect(response.status).toBe(201);
            expect(response.body).toEqual(formattedResponse); // Check the formatted response
            expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO issues'), // Check if INSERT SQL is used
                expect.arrayContaining([ // Check parameters passed to INSERT
                    issueData.issuetype,
                    issueData.summary,
                    issueData.description,
                    null, // parentKey default
                    issueKey,
                    'To Do', // status default
                    expect.any(String), // created_at
                    expect.any(String)  // updated_at
                ])
            );
            expect(mockDatabaseService.get).toHaveBeenCalledWith(
                'SELECT * FROM issues WHERE key = ?',
                [issueKey]
            );
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_created', formattedResponse);
        });
        it('should return 400 if required fields are missing (handled by controller)', async () => {
            // Arrange: Send invalid data
            const invalidIssueData = { description: 'Only description' };
            // Act
            const response = await request
                .post('/rest/api/3/issue')
                .send(invalidIssueData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');
            // Assert
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: 'Missing required fields' });
            // Verify mocks were NOT called (or only specific ones if validation happens early)
            expect(mockIssueKeyService.getNextIssueKey).not.toHaveBeenCalled();
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        });
        it('should return 500 if the controller encounters a database error during creation', async () => {
            // Arrange: Simulate a database error
            const issueData = { issuetype: 'bug', summary: 'DB Error Test', description: '...' };
            const issueKey = 'TASK-2';
            const dbError = new Error('Database connection lost');
            mockIssueKeyService.getNextIssueKey.mockResolvedValue(issueKey);
            // Simulate failure on the INSERT step
            mockDatabaseService.run.mockRejectedValue(dbError);
            // Act
            const response = await request
                .post('/rest/api/3/issue')
                .send(issueData)
                .set('Accept', 'application/json')
                .set('Content-Type', 'application/json');
            // Assert
            expect(response.status).toBe(500);
            // The controller's catch block should produce this message
            expect(response.body).toEqual({ message: 'Failed to create issue' });
            expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalledTimes(1); // Key service might still be called
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(1); // The failing call
            expect(mockDatabaseService.get).not.toHaveBeenCalled(); // Should not be called after failure
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        });
    });
    describe('GET /rest/api/3/issue/:issueIdOrKey', () => {
        it('should call IssueController.getIssue and return 200 with issue data if found by key', async () => {
            // Arrange
            const issueKey = 'PROJ-123';
            const now = new Date().toISOString();
            const dbIssue: DbIssue = { _id: '653412345678901234567890', id: 123, issuetype: 'story', summary: 'Get By Key', description: 'Test description', key: issueKey, status: 'In Progress', assignee_key: 'user-1', created_at: now, updated_at: now, parentKey: null };
            const formattedResponse = formatIssueResponse(dbIssue);

            // Mock the service call made by the controller
            mockDatabaseService.get.mockResolvedValue(dbIssue);
            // Act
            const response = await request.get(`/rest/api/3/issue/${issueKey}`);
            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual(formattedResponse);
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.get).toHaveBeenCalledWith(
                'SELECT * FROM issues WHERE key = ?', // Controller logic uses key for non-numeric input
                [issueKey]
            );
        });
        it('should call IssueController.getIssue and return 200 with issue data if found by ID', async () => {
            // Arrange
            const issueId = '456'; // ID as string, matching param type
            const now = new Date().toISOString();
            const dbIssue: DbIssue = { _id: '653412345678901234567890', id: 456, issuetype: 'bug', summary: 'Get By ID', description: 'Bug description', key: 'BUG-1', status: 'To Do', assignee_key: null, created_at: now, updated_at: now, parentKey: null };
            const formattedResponse = formatIssueResponse(dbIssue);

            mockDatabaseService.get.mockResolvedValue(dbIssue);
            // Act
            const response = await request.get(`/rest/api/3/issue/${issueId}`);
            // Assert
            expect(response.status).toBe(200);
            expect(response.body).toEqual(formattedResponse);
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.get).toHaveBeenCalledWith(
                'SELECT * FROM issues WHERE id = ?', // Controller logic uses id for numeric input
                [issueId]
            );
        });
        it('should return 404 if the issue is not found', async () => {
            // Arrange
            const issueKey = 'NONEXISTENT-KEY';
            mockDatabaseService.get.mockResolvedValue(undefined); // Simulate not found
            // Act
            const response = await request.get(`/rest/api/3/issue/${issueKey}`);
            // Assert
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Issue not found' });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.get).toHaveBeenCalledWith(
                'SELECT * FROM issues WHERE key = ?',
                [issueKey]
            );
        });
        it('should return 500 if the controller encounters a database error during retrieval', async () => {
            // Arrange
            const issueKey = 'DB-ERROR-KEY';
            const dbError = new Error('Failed to query');
            mockDatabaseService.get.mockRejectedValue(dbError);
            // Act
            const response = await request.get(`/rest/api/3/issue/${issueKey}`);
            // Assert
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to retrieve issue' }); // Controller's error message
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
        });
    });
    describe('PUT /rest/api/3/issue/:issueIdOrKey', () => {
        it('should call IssueController.updateIssue and return 204 on successful update', async () => {
            // Arrange
            const issueKey = 'PROJ-UPDATE';
            const updateData = { summary: 'Updated Summary', description: 'New description' };
            const now = new Date().toISOString();
            // Simulate issue state *before* update for controller's pre-fetch
            const preUpdateDbIssue: DbIssue = { _id: '653412345678901234567890', id: 789, issuetype: 'task', summary: 'Old Summary', description: 'Old desc', key: issueKey, status: 'To Do', assignee_key: null, created_at: now, updated_at: now, parentKey: null };
            // Simulate issue state *after* update for controller's post-fetch (for webhook)
            const postUpdateDbIssue: DbIssue = { ...preUpdateDbIssue, summary: updateData.summary, description: updateData.description, updated_at: new Date().toISOString() };
            const formattedWebhookPayload = formatIssueResponse(postUpdateDbIssue);

            mockDatabaseService.get
                .mockResolvedValueOnce(preUpdateDbIssue)   // First call (pre-fetch)
                .mockResolvedValueOnce(postUpdateDbIssue); // Second call (post-fetch for webhook)
            mockDatabaseService.run.mockResolvedValue(undefined); // Mock the UPDATE operation
            mockTriggerWebhooks.mockResolvedValue(undefined);
            // Status transition mock (assuming status is not changed, so it passes trivially or isn't called)
            mockIssueStatusTransitionService.isValidTransition.mockResolvedValue(true); // Assume valid if called
            // Act
            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(updateData);
            // Assert
            expect(response.status).toBe(204); // No content on successful PUT
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(2); // Pre-fetch and post-fetch
            expect(mockDatabaseService.get).toHaveBeenNthCalledWith(1, `SELECT * FROM issues WHERE key = ?`, [issueKey]);
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE issues SET summary = ?, description = ?, updated_at = ? WHERE key = ?'),
                expect.arrayContaining([
                    updateData.summary,
                    updateData.description,
                    expect.any(String), // updated_at
                    issueKey
                ])
            );
            expect(mockDatabaseService.get).toHaveBeenNthCalledWith(2, `SELECT * FROM issues WHERE key = ?`, [issueKey]);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', formattedWebhookPayload);
            // Ensure transition check wasn't needed/called if status wasn't in updateData
            expect(mockIssueStatusTransitionService.isValidTransition).not.toHaveBeenCalled();
        });
        it('should return 404 if the issue to update is not found', async () => {
            // Arrange
            const issueKey = 'NONEXISTENT-PUT';
            const updateData = { summary: 'Wont happen' };
            mockDatabaseService.get.mockResolvedValue(undefined); // Simulate not found on pre-fetch
            // Act
            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(updateData);
            // Assert
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Issue not found' });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1); // Only pre-fetch call
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        });
        it('should return 400 if an invalid status transition is attempted', async () => {
            // Arrange
            const issueKey = 'INVALID-TRANSITION';
            const updateData = { status: 'Done' }; // Attempting to transition
            const now = new Date().toISOString();
            const currentStatus = 'To Do';
            // Assuming the controller maps these names to IDs internally before calling the service
            const currentStatusId = 11; // Hypothetical ID for 'To Do'
            const targetStatusId = 31;  // Hypothetical ID for 'Done'

             // Simulate the current state of the issue
            const preUpdateDbIssue: DbIssue = { _id: '653412345678901234567890', id: 890, issuetype: 'task', summary: 'Transition Test', description: '', key: issueKey, status: currentStatus, assignee_key: null, created_at: now, updated_at: now, parentKey: null };

            mockDatabaseService.get.mockResolvedValue(preUpdateDbIssue); // Mock pre-fetch
            // Mock the transition service to return false for this specific transition attempt
            mockIssueStatusTransitionService.isValidTransition.mockResolvedValue(false);
            // We assume the controller will fetch status IDs based on names 'To Do' and 'Done'
            // and pass these IDs to the service. Our mock setup intercepts the service call.
            // Act
            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(updateData);
            // Assert
            expect(response.status).toBe(400);
            expect(response.body).toEqual({ message: `Invalid status transition from '${currentStatus}' to '${updateData.status}'` });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1); // Pre-fetch called
            // IMPORTANT: Verify the transition service was called correctly by the controller
            // with the *expected IDs* based on the names provided in the test data.
            expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalledTimes(1);
            // We rely on the *controller's internal logic* to map names to IDs.
            // The assertion checks if the service method was called with the IDs we *expect*
            // the controller to derive (11 and 31 in this hypothetical case).
            // The third argument (mockDatabaseService) depends on how the controller passes dependencies.
            // Adjust if the controller passes something else or no third argument.
            expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalledWith(currentStatusId, targetStatusId);
            expect(mockDatabaseService.run).not.toHaveBeenCalled(); // Update shouldn't happen
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        });
        it('should return 500 if the controller encounters a database error during update', async () => {
            // Arrange
            const issueKey = 'DB-ERROR-PUT';
            const updateData = { summary: 'Error Update' };
            const now = new Date().toISOString();
            const preUpdateDbIssue: DbIssue = { _id: '653412345678901234567890', id: 901, issuetype: 'task', summary: 'Old', description: '', key: issueKey, status: 'To Do', assignee_key: null, created_at: now, updated_at: now, parentKey: null };
            const dbError = new Error('Update failed');

            mockDatabaseService.get.mockResolvedValue(preUpdateDbIssue); // Pre-fetch succeeds
            mockDatabaseService.run.mockRejectedValue(dbError); // Simulate failure on UPDATE
            // Act
            const response = await request
                .put(`/rest/api/3/issue/${issueKey}`)
                .send(updateData);
            // Assert
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to update issue' }); // Controller's error message
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1); // Pre-fetch called
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(1); // The failing call
            expect(mockTriggerWebhooks).not.toHaveBeenCalled(); // Should not be called after failure
        });
    });
    describe('DELETE /rest/api/3/issue/:issueIdOrKey', () => {
        it('should call IssueController.deleteIssue and return 204 on successful deletion', async () => {
            // Arrange
            const issueKey = 'PROJ-DELETE';
            const now = new Date().toISOString();
            // Simulate issue state *before* deletion for controller's pre-fetch (for webhook)
            const preDeleteDbIssue: DbIssue = { _id: '653412345678901234567890', id: 1001, issuetype: 'bug', summary: 'To Be Deleted', description: '', key: issueKey, status: 'Done', assignee_key: null, created_at: now, updated_at: now, parentKey: null };
            const formattedWebhookPayload = formatIssueResponse(preDeleteDbIssue);

            mockDatabaseService.get.mockResolvedValue(preDeleteDbIssue); // Mock pre-fetch for webhook
            mockDatabaseService.run.mockResolvedValue(undefined); // Mock the DELETE operation
            mockTriggerWebhooks.mockResolvedValue(undefined);
            // Act
            const response = await request.delete(`/rest/api/3/issue/${issueKey}`);
            // Assert
            expect(response.status).toBe(204); // No content on successful DELETE
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1); // Pre-fetch for webhook
            expect(mockDatabaseService.get).toHaveBeenCalledWith(`SELECT * FROM issues WHERE key = ?`, [issueKey]);
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).toHaveBeenCalledWith(
                `DELETE FROM issues WHERE key = ?`, // Controller uses key for non-numeric
                [issueKey]
            );
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_deleted', formattedWebhookPayload);
        });
        it('should return 404 if the issue to delete is not found', async () => {
            // Arrange
            const issueKey = 'NONEXISTENT-DEL';
            mockDatabaseService.get.mockResolvedValue(undefined); // Simulate not found on pre-fetch
            // Act
            const response = await request.delete(`/rest/api/3/issue/${issueKey}`);
            // Assert
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Issue not found' });
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        });
        it('should return 500 if the controller encounters a database error during deletion', async () => {
             // Arrange
            const issueKey = 'DB-ERROR-DEL';
            const now = new Date().toISOString();
            const preDeleteDbIssue: DbIssue = { _id: '653412345678901234567890', id: 1002, issuetype: 'bug', summary: 'Delete Error', description: '', key: issueKey, status: 'Done', assignee_key: null, created_at: now, updated_at: now, parentKey: null };
            const dbError = new Error('Delete failed');

            mockDatabaseService.get.mockResolvedValue(preDeleteDbIssue); // Pre-fetch succeeds
            mockDatabaseService.run.mockRejectedValue(dbError); // Simulate failure on DELETE

            // Act
            const response = await request.delete(`/rest/api/3/issue/${issueKey}`);

            // Assert
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to delete issue' }); // Controller's error message
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1); // Pre-fetch called
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(1); // The failing call
            expect(mockTriggerWebhooks).not.toHaveBeenCalled(); // Webhook shouldn't be called on failure
        });
    });

}); // End describe 'issueRoutes Integration Tests'