import { IssueController } from './issueController';
import { DatabaseService } from '../../services/databaseService';
import { IssueKeyService } from '../../services/issueKeyService';
import { IssueStatusTransitionService } from '../../services/issueStatusTransitionService'; // Import the service
import { Request, Response, NextFunction } from 'express';
import { Issue } from '../../models/issue';
import { ObjectId } from 'mongodb'; // Although not mongo, ObjectId is used for _id generation in tests
import httpMocks from 'node-mocks-http';
import { createMock } from '@golevelup/ts-jest';
import { triggerWebhooks } from '../../services/webhookService';
import { formatIssueResponse } from '../../utils/jsonTransformer'; // Import the formatter

// Mock the webhookService module
jest.mock('../../services/webhookService', () => ({
    triggerWebhooks: jest.fn(),
}));

// Cast the mock for type safety and autocompletion in tests
const mockTriggerWebhooks = triggerWebhooks as jest.Mock;

// Define a type for the database issue that includes the additional fields
type DbIssue = Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; };

describe('IssueController', () => {
    let controller: IssueController;
    let mockRequest: httpMocks.MockRequest<Request>;
    let mockResponse: httpMocks.MockResponse<Response>;
    const mockNext: jest.Mock = jest.fn(); // Keep mockNext for potential future use or edge cases, though controller handles most responses

    const mockDatabaseService = createMock<DatabaseService>();
    const mockIssueKeyService = createMock<IssueKeyService>();
    const mockIssueStatusTransitionService = createMock<IssueStatusTransitionService>();

    beforeEach(() => {
        // Reset mocks for all services and mockNext
        jest.resetAllMocks();
        mockDatabaseService.get.mockReset();
        mockDatabaseService.run.mockReset();
        mockDatabaseService.all.mockReset();
        mockDatabaseService.beginTransaction.mockReset();
        mockDatabaseService.commitTransaction.mockReset();
        mockDatabaseService.rollbackTransaction.mockReset();
        mockDatabaseService.ensureTableExists.mockReset();
        mockDatabaseService.getSingleValue.mockReset();
        mockDatabaseService.setSingleValue.mockReset();
        mockIssueKeyService.getNextIssueKey.mockReset();
        mockIssueStatusTransitionService.isValidTransition.mockReset();
        mockTriggerWebhooks.mockClear();
        mockNext.mockReset();


        // Instantiate IssueController with all mock services
        controller = new IssueController(
            mockDatabaseService,
            mockIssueKeyService,
            mockIssueStatusTransitionService
        );

        mockRequest = httpMocks.createRequest();
        mockResponse = httpMocks.createResponse();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    // --- getIssue ---
    describe('getIssue', () => {
        it('should get an issue by key', async () => {
            const now = new Date().toISOString();
            const dbIssue: DbIssue = {
                _id: new ObjectId().toHexString(),
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

            mockRequest.params = { issueIdOrKey: 'PROJECT-123' };
            await controller.getIssue(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', ['PROJECT-123']);
            const expectedFormattedIssue = formatIssueResponse(dbIssue);
            expect(mockResponse.statusCode).toBe(200);
            expect(JSON.parse(mockResponse._getData())).toEqual(expectedFormattedIssue);
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should get an issue by ID', async () => {
            const now = new Date().toISOString();
            const dbIssue: DbIssue = {
                _id: new ObjectId().toHexString(),
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

            mockRequest.params = { issueIdOrKey: '1' };
            await controller.getIssue(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE id = ?', ['1']);
            const expectedFormattedIssue = formatIssueResponse(dbIssue);
            expect(mockResponse.statusCode).toBe(200);
            expect(JSON.parse(mockResponse._getData())).toEqual(expectedFormattedIssue);
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 404 if issue not found', async () => {
            mockDatabaseService.get.mockResolvedValue(undefined);

            mockRequest.params = { issueIdOrKey: 'NOT-FOUND' };
            await controller.getIssue(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', ['NOT-FOUND']);
            expect(mockResponse.statusCode).toBe(404);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Issue not found' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 500 if database get fails', async () => {
            const error = new Error('Database get error');
            mockDatabaseService.get.mockRejectedValue(error);

            mockRequest.params = { issueIdOrKey: 'FAIL-GET' };
            await controller.getIssue(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', ['FAIL-GET']);
            expect(mockResponse.statusCode).toBe(500);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to retrieve issue' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled(); // Controller handles the response directly
        });
    });

    // --- createIssue ---
    describe('createIssue', () => {
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

            mockIssueKeyService.getNextIssueKey.mockResolvedValue(issueKey);
            mockDatabaseService.run.mockResolvedValue(undefined); // Mock run for INSERT
            mockDatabaseService.get.mockResolvedValue(createdDbIssue); // Mock get for SELECT after insert

            mockRequest.body = issueData;
            await controller.createIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalled();
            expect(mockDatabaseService.run).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO issues'),
                expect.arrayContaining([
                    issueData.issuetype, issueData.summary, issueData.description, null, issueKey, 'To Do', expect.any(String), expect.any(String)
                ])
            );
            expect(mockDatabaseService.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', [issueKey]);
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
            expect(mockIssueKeyService.getNextIssueKey).not.toHaveBeenCalled();
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 500 if issue key generation fails', async () => {
            const error = new Error('Key generation failed');
            mockIssueKeyService.getNextIssueKey.mockRejectedValue(error);
            mockRequest.body = { issuetype: 'task', summary: 'Test', description: 'Desc' };

            await controller.createIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalled();
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(500);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to create issue' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 500 if database insert fails', async () => {
            const issueData = { issuetype: 'bug', summary: 'Error case', description: 'DB fail' };
            const error = new Error('Database insert error');
            mockIssueKeyService.getNextIssueKey.mockResolvedValue('TASK-ERR');
            mockDatabaseService.run.mockRejectedValue(error);

            mockRequest.body = issueData;
            await controller.createIssue(mockRequest as Request, mockResponse as Response);

            expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalled();
            expect(mockDatabaseService.run).toHaveBeenCalled();
            expect(mockDatabaseService.get).not.toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(500);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to create issue' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 500 if database get after insert fails', async () => {
             const issueData = { issuetype: 'task', summary: 'Test issue', description: 'Test description' };
             const issueKey = 'PROJ-1';
             const error = new Error('Database get error');

             mockIssueKeyService.getNextIssueKey.mockResolvedValue(issueKey);
             mockDatabaseService.run.mockResolvedValue(undefined); // INSERT succeeds
             mockDatabaseService.get.mockRejectedValue(error); // SELECT fails

             mockRequest.body = issueData;
             await controller.createIssue(mockRequest as Request, mockResponse as Response);

             expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalled();
             expect(mockDatabaseService.run).toHaveBeenCalled();
             expect(mockDatabaseService.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', [issueKey]);
             expect(mockResponse.statusCode).toBe(500);
             // Note: The controller returns a specific message in this case
             expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to create issue' }); // Corrected expectation based on catch block
             expect(mockTriggerWebhooks).not.toHaveBeenCalled(); // Webhook shouldn't be triggered if get fails
             expect(mockNext).not.toHaveBeenCalled();
         });
    });

    // --- updateIssue ---
    describe('updateIssue', () => {
        const issueKey = 'PROJECT-UPD';
        const now = new Date().toISOString();
        const preUpdateDbIssue: DbIssue = {
            _id: new ObjectId().toHexString(), id: 1, issuetype: 'task', summary: 'Original', description: 'Original Desc', key: issueKey, status: 'To Do', assignee_key: null, created_at: now, updated_at: now
        };

        it('should update issue fields (no status change) and trigger webhook', async () => {
            const updateData = { summary: 'Updated Summary', description: 'Updated Desc' };
            const postUpdateDbIssue = { ...preUpdateDbIssue, ...updateData, updated_at: new Date().toISOString() };

            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue); // Pre-check
            mockDatabaseService.run.mockResolvedValueOnce(undefined); // Update
            mockDatabaseService.get.mockResolvedValueOnce(postUpdateDbIssue); // Post-check

            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = updateData;
            await controller.updateIssue(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
            expect(mockDatabaseService.get).toHaveBeenNthCalledWith(1, 'SELECT * FROM issues WHERE key = ?', [issueKey]);
            expect(mockDatabaseService.run).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE issues SET summary = ?, description = ?, updated_at = ? WHERE key = ?'),
                [updateData.summary, updateData.description, expect.any(String), issueKey]
            );
            expect(mockDatabaseService.get).toHaveBeenNthCalledWith(2, 'SELECT * FROM issues WHERE key = ?', [issueKey]);
            expect(mockIssueStatusTransitionService.isValidTransition).not.toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(204);
            expect(mockResponse._isEndCalled()).toBe(true);
            const expectedFormattedIssue = formatIssueResponse(postUpdateDbIssue);
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expectedFormattedIssue);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should update issue fields including a valid status change and trigger webhook', async () => {
            const updateData = { summary: 'Updated Summary', status: 'In Progress' };
            const postUpdateDbIssue = { ...preUpdateDbIssue, ...updateData, updated_at: new Date().toISOString() };

            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue); // Pre-check
            mockIssueStatusTransitionService.isValidTransition.mockReturnValue(true); // Validate transition
            mockDatabaseService.run.mockResolvedValueOnce(undefined); // Update
            mockDatabaseService.get.mockResolvedValueOnce(postUpdateDbIssue); // Post-check

            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = updateData;
            await controller.updateIssue(mockRequest as Request, mockResponse as Response);

            const preStatusId = controller['getStatusIdFromName'](preUpdateDbIssue.status);
            const postStatusId = controller['getStatusIdFromName'](updateData.status);
            expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalledWith(preStatusId, postStatusId, mockDatabaseService);
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
            expect(mockDatabaseService.run).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE issues SET summary = ?, status = ?, updated_at = ? WHERE key = ?'),
                [updateData.summary, updateData.status, expect.any(String), issueKey]
            );
            expect(mockResponse.statusCode).toBe(204);
            const expectedFormattedIssue = formatIssueResponse(postUpdateDbIssue);
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expectedFormattedIssue);
            expect(mockNext).not.toHaveBeenCalled();
        });

         it('should return 404 if issue to update is not found', async () => {
            mockDatabaseService.get.mockResolvedValueOnce(undefined); // Pre-check finds nothing
            mockRequest.params = { issueIdOrKey: 'NOT-FOUND' };
            mockRequest.body = { summary: 'Update Fail' };

            await controller.updateIssue(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(404);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Issue not found' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 400 if no valid fields to update are provided', async () => {
            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue); // Pre-check finds issue
            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = { invalidField: 'some value', otherInvalid: 123 }; // No allowed fields

            await controller.updateIssue(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1); // Only pre-check
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(400);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'No valid fields to update provided' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 400 if status transition is invalid', async () => {
             const updateData = { status: 'Done' }; // Invalid transition from 'To Do'

             mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue); // Pre-check
             mockIssueStatusTransitionService.isValidTransition.mockReturnValue(false); // Validate transition fails

             mockRequest.params = { issueIdOrKey: issueKey };
             mockRequest.body = updateData;
             await controller.updateIssue(mockRequest as Request, mockResponse as Response);

             const preStatusId = controller['getStatusIdFromName'](preUpdateDbIssue.status);
             const postStatusId = controller['getStatusIdFromName'](updateData.status);
             expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalledWith(preStatusId, postStatusId, mockDatabaseService);
             expect(mockDatabaseService.get).toHaveBeenCalledTimes(1); // Only pre-check
             expect(mockDatabaseService.run).not.toHaveBeenCalled();
             expect(mockResponse.statusCode).toBe(400);
             expect(JSON.parse(mockResponse._getData())).toEqual({ message: `Invalid status transition from '${preUpdateDbIssue.status}' to '${updateData.status}'` });
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();
             expect(mockNext).not.toHaveBeenCalled();
         });

        it('should return 400 if status name is invalid', async () => {
             const updateData = { status: 'InvalidStatusName' };

             mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue); // Pre-check

             mockRequest.params = { issueIdOrKey: issueKey };
             mockRequest.body = updateData;
             await controller.updateIssue(mockRequest as Request, mockResponse as Response);

             expect(mockDatabaseService.get).toHaveBeenCalledTimes(1); // Only pre-check
             expect(mockIssueStatusTransitionService.isValidTransition).not.toHaveBeenCalled();
             expect(mockDatabaseService.run).not.toHaveBeenCalled();
             expect(mockResponse.statusCode).toBe(400);
             expect(JSON.parse(mockResponse._getData())).toEqual({ message: `Invalid status name provided: Current='${preUpdateDbIssue.status}', Target='${updateData.status}'` });
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();
             expect(mockNext).not.toHaveBeenCalled();
         });

        it('should return 500 if database get (pre-check) fails', async () => {
             const error = new Error('DB Get Error');
             mockDatabaseService.get.mockRejectedValueOnce(error);
             mockRequest.params = { issueIdOrKey: issueKey };
             mockRequest.body = { summary: 'Fail' };

             await controller.updateIssue(mockRequest as Request, mockResponse as Response);

             expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
             expect(mockDatabaseService.run).not.toHaveBeenCalled();
             expect(mockResponse.statusCode).toBe(500);
             expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to update issue' });
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();
             expect(mockNext).not.toHaveBeenCalled();
         });

        it('should return 500 if database update fails', async () => {
            const updateData = { summary: 'Updated Summary' };
            const error = new Error('DB Update Error');

            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue); // Pre-check
            mockDatabaseService.run.mockRejectedValueOnce(error); // Update fails

            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = updateData;
            await controller.updateIssue(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(500);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to update issue' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 500 if database get (post-update) fails', async () => {
            const updateData = { summary: 'Updated Summary' };
            const error = new Error('DB Get After Update Error');

            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue); // Pre-check
            mockDatabaseService.run.mockResolvedValueOnce(undefined); // Update succeeds
            mockDatabaseService.get.mockRejectedValueOnce(error); // Post-check fails

            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = updateData;
            await controller.updateIssue(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
            expect(mockDatabaseService.run).toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(500);
            // Corrected Expectation: Expect the generic error message from the catch block
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to update issue' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled(); // No webhook if post-update get fails
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    // --- deleteIssue ---
    describe('deleteIssue', () => {
        const issueKey = 'PROJECT-DEL';
        const now = new Date().toISOString();
        const dbIssue: DbIssue = {
            _id: new ObjectId().toHexString(), id: 1, issuetype: 'task', summary: 'To Delete', description: '', key: issueKey, status: 'Done', assignee_key: null, created_at: now, updated_at: now
        };

        it('should delete an issue and trigger webhook', async () => {
            mockDatabaseService.get.mockResolvedValueOnce(dbIssue); // Pre-check
            mockDatabaseService.run.mockResolvedValueOnce(undefined); // Delete

            mockRequest.params = { issueIdOrKey: issueKey };
            await controller.deleteIssue(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', [issueKey]);
            expect(mockDatabaseService.run).toHaveBeenCalledWith('DELETE FROM issues WHERE key = ?', [issueKey]);
            expect(mockResponse.statusCode).toBe(204);
            expect(mockResponse._isEndCalled()).toBe(true);
            const expectedFormattedIssue = formatIssueResponse(dbIssue);
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_deleted', expectedFormattedIssue);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 404 if issue to delete is not found', async () => {
            mockDatabaseService.get.mockResolvedValueOnce(undefined); // Pre-check fails
            mockRequest.params = { issueIdOrKey: 'NOT-FOUND' };

            await controller.deleteIssue(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledWith('SELECT * FROM issues WHERE key = ?', ['NOT-FOUND']);
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(404);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Issue not found' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 500 if database get (pre-check) fails', async () => {
            const error = new Error('DB Get Error');
            mockDatabaseService.get.mockRejectedValueOnce(error);
            mockRequest.params = { issueIdOrKey: issueKey };

            await controller.deleteIssue(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalled();
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(500);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to delete issue' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 500 if database delete fails', async () => {
            const error = new Error('DB Delete Error');
            mockDatabaseService.get.mockResolvedValueOnce(dbIssue); // Pre-check succeeds
            mockDatabaseService.run.mockRejectedValueOnce(error); // Delete fails

            mockRequest.params = { issueIdOrKey: issueKey };
            await controller.deleteIssue(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalled();
            expect(mockDatabaseService.run).toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(500);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to delete issue' });
            // Webhook might or might not be triggered depending on where the error occurs relative to the trigger call.
            // Based on current code, it triggers *after* successful delete, so it shouldn't be called here.
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    // --- transitionIssue ---
    describe('transitionIssue', () => {
        const issueKey = 'PROJECT-TRAN';
        const now = new Date().toISOString();
        const preUpdateDbIssue: DbIssue = {
             _id: new ObjectId().toHexString(), id: 2, issuetype: 'bug', summary: 'Bug to transition', description: 'Desc', key: issueKey, status: 'To Do', assignee_key: null, created_at: now, updated_at: now
        };
        const newStatus = 'In Progress';
        const postUpdateDbIssue = { ...preUpdateDbIssue, status: newStatus, updated_at: new Date().toISOString() };

        it('should transition an issue status with valid transition and trigger webhook', async () => {
            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue); // Pre-check
            mockIssueStatusTransitionService.isValidTransition.mockReturnValue(true); // Validate transition
            mockDatabaseService.run.mockResolvedValueOnce(undefined); // Update status
            mockDatabaseService.get.mockResolvedValueOnce(postUpdateDbIssue); // Post-check

            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = { transition: { name: newStatus } };
            await controller.transitionIssue(mockRequest as Request, mockResponse as Response);

            const preStatusId = controller['getStatusIdFromName'](preUpdateDbIssue.status);
            const postStatusId = controller['getStatusIdFromName'](newStatus);
            expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalledWith(preStatusId, postStatusId, mockDatabaseService);
            expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
            expect(mockDatabaseService.run).toHaveBeenCalledWith(
                'UPDATE issues SET status = ?, updated_at = ? WHERE key = ?',
                [newStatus, expect.any(String), issueKey]
            );
            expect(mockResponse.statusCode).toBe(204);
            expect(mockResponse._isEndCalled()).toBe(true);
            const expectedFormattedIssue = formatIssueResponse(postUpdateDbIssue);
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expectedFormattedIssue);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 400 if transition name is missing in body', async () => {
            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = { transition: {} }; // Missing 'name'
            await controller.transitionIssue(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.statusCode).toBe(400);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Missing transition name in request body' });
            expect(mockDatabaseService.get).not.toHaveBeenCalled();
            expect(mockIssueStatusTransitionService.isValidTransition).not.toHaveBeenCalled();
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

         it('should return 404 if issue to transition is not found', async () => {
            mockDatabaseService.get.mockResolvedValueOnce(undefined); // Pre-check fails
            mockRequest.params = { issueIdOrKey: 'NOT-FOUND' };
            mockRequest.body = { transition: { name: newStatus } };

            await controller.transitionIssue(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockIssueStatusTransitionService.isValidTransition).not.toHaveBeenCalled();
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(404);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Issue not found' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 400 if status name is invalid', async () => {
            const invalidStatus = 'InvalidStatusName';
            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue); // Pre-check ok

            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = { transition: { name: invalidStatus } };
            await controller.transitionIssue(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockIssueStatusTransitionService.isValidTransition).not.toHaveBeenCalled();
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(400);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: `Invalid status name provided: Current='${preUpdateDbIssue.status}', Target='${invalidStatus}'` });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

         it('should return 400 if status transition is invalid', async () => {
             const invalidTargetStatus = 'Done'; // Assume invalid from 'To Do'
             mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue); // Pre-check ok
             mockIssueStatusTransitionService.isValidTransition.mockReturnValue(false); // Invalid transition

             mockRequest.params = { issueIdOrKey: issueKey };
             mockRequest.body = { transition: { name: invalidTargetStatus } };
             await controller.transitionIssue(mockRequest as Request, mockResponse as Response);

             const preStatusId = controller['getStatusIdFromName'](preUpdateDbIssue.status);
             const postStatusId = controller['getStatusIdFromName'](invalidTargetStatus);
             expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalledWith(preStatusId, postStatusId, mockDatabaseService);
             expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
             expect(mockDatabaseService.run).not.toHaveBeenCalled();
             expect(mockResponse.statusCode).toBe(400);
             expect(JSON.parse(mockResponse._getData())).toEqual({ message: `Invalid status transition from '${preUpdateDbIssue.status}' to '${invalidTargetStatus}'` });
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();
             expect(mockNext).not.toHaveBeenCalled();
         });

         it('should return 500 if database get (pre-check) fails', async () => {
             const error = new Error('DB Get Error');
             mockDatabaseService.get.mockRejectedValueOnce(error);
             mockRequest.params = { issueIdOrKey: issueKey };
             mockRequest.body = { transition: { name: newStatus } };

             await controller.transitionIssue(mockRequest as Request, mockResponse as Response);

             expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
             expect(mockDatabaseService.run).not.toHaveBeenCalled();
             expect(mockResponse.statusCode).toBe(500);
             expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to transition issue' });
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();
             expect(mockNext).not.toHaveBeenCalled();
         });

         it('should return 500 if database update fails', async () => {
             const error = new Error('DB Update Error');
             mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
             mockIssueStatusTransitionService.isValidTransition.mockReturnValue(true);
             mockDatabaseService.run.mockRejectedValueOnce(error); // Update fails

             mockRequest.params = { issueIdOrKey: issueKey };
             mockRequest.body = { transition: { name: newStatus } };
             await controller.transitionIssue(mockRequest as Request, mockResponse as Response);

             expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
             expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalled();
             expect(mockDatabaseService.run).toHaveBeenCalled();
             expect(mockResponse.statusCode).toBe(500);
             expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to transition issue' });
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();
             expect(mockNext).not.toHaveBeenCalled();
         });

          it('should return 500 if database get (post-update) fails', async () => {
             const error = new Error('DB Get Post-Update Error');
             mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
             mockIssueStatusTransitionService.isValidTransition.mockReturnValue(true);
             mockDatabaseService.run.mockResolvedValueOnce(undefined); // Update succeeds
             mockDatabaseService.get.mockRejectedValueOnce(error); // Post-check fails

             mockRequest.params = { issueIdOrKey: issueKey };
             mockRequest.body = { transition: { name: newStatus } };
             await controller.transitionIssue(mockRequest as Request, mockResponse as Response);

             expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
             expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalled();
             expect(mockDatabaseService.run).toHaveBeenCalled();
             expect(mockResponse.statusCode).toBe(500);
             // Corrected Expectation: Expect the generic error message from the catch block
             expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to transition issue' });
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();
             expect(mockNext).not.toHaveBeenCalled();
         });
    });

    // --- updateAssignee ---
    describe('updateAssignee', () => {
        const issueKey = 'PROJECT-ASGN';
        const now = new Date().toISOString();
        const preUpdateDbIssue: DbIssue = {
             _id: new ObjectId().toHexString(), id: 3, issuetype: 'story', summary: 'Story to assign', description: 'Desc', key: issueKey, status: 'In Progress', assignee_key: null, created_at: now, updated_at: now
        };
        const newAssigneeKey = 'user-123';
        const postUpdateDbIssue = { ...preUpdateDbIssue, assignee_key: newAssigneeKey, updated_at: new Date().toISOString() };

        it('should update an issue assignee and trigger webhook', async () => {
            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue); // Pre-check
            mockDatabaseService.run.mockResolvedValueOnce(undefined); // Update assignee
            mockDatabaseService.get.mockResolvedValueOnce(postUpdateDbIssue); // Post-check

            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = { assignee: newAssigneeKey };
            await controller.updateAssignee(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
            expect(mockDatabaseService.run).toHaveBeenCalledWith(
                'UPDATE issues SET assignee_key = ?, updated_at = ? WHERE key = ?',
                [newAssigneeKey, expect.any(String), issueKey]
            );
            expect(mockResponse.statusCode).toBe(204);
            expect(mockResponse._isEndCalled()).toBe(true);
            const expectedFormattedIssue = formatIssueResponse(postUpdateDbIssue);
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expectedFormattedIssue);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should unassign an issue (assignee=null) and trigger webhook', async () => {
            const assignedIssue: DbIssue = { ...preUpdateDbIssue, assignee_key: 'user-old' };
            const unassignedIssue = { ...preUpdateDbIssue, assignee_key: null, updated_at: new Date().toISOString() };

            mockDatabaseService.get.mockResolvedValueOnce(assignedIssue); // Pre-check
            mockDatabaseService.run.mockResolvedValueOnce(undefined); // Update assignee
            mockDatabaseService.get.mockResolvedValueOnce(unassignedIssue); // Post-check

            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = { assignee: null }; // Set assignee to null
            await controller.updateAssignee(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
            expect(mockDatabaseService.run).toHaveBeenCalledWith(
                'UPDATE issues SET assignee_key = ?, updated_at = ? WHERE key = ?',
                [null, expect.any(String), issueKey]
            );
            expect(mockResponse.statusCode).toBe(204);
            const expectedFormattedIssue = formatIssueResponse(unassignedIssue);
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expectedFormattedIssue);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 400 if assignee key is missing in body', async () => {
             mockRequest.params = { issueIdOrKey: issueKey };
             mockRequest.body = {}; // Missing 'assignee'
             await controller.updateAssignee(mockRequest as Request, mockResponse as Response);

             expect(mockResponse.statusCode).toBe(400);
             expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Missing assignee key in request body (use null to unassign)' });
             expect(mockDatabaseService.get).not.toHaveBeenCalled();
             expect(mockDatabaseService.run).not.toHaveBeenCalled();
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();
             expect(mockNext).not.toHaveBeenCalled();
        });

         it('should return 404 if issue to update assignee is not found', async () => {
            mockDatabaseService.get.mockResolvedValueOnce(undefined); // Pre-check fails
            mockRequest.params = { issueIdOrKey: 'NOT-FOUND' };
            mockRequest.body = { assignee: newAssigneeKey };

            await controller.updateAssignee(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(404);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Issue not found' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 500 if database get (pre-check) fails', async () => {
            const error = new Error('DB Get Error');
            mockDatabaseService.get.mockRejectedValueOnce(error);
            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = { assignee: newAssigneeKey };

            await controller.updateAssignee(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(500);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to update assignee' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 500 if database update fails', async () => {
            const error = new Error('DB Update Error');
            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue); // Pre-check ok
            mockDatabaseService.run.mockRejectedValueOnce(error); // Update fails

            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = { assignee: newAssigneeKey };
            await controller.updateAssignee(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(500);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to update assignee' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

         it('should return 500 if database get (post-update) fails', async () => {
            const error = new Error('DB Get Post-Update Error');
            mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue); // Pre-check ok
            mockDatabaseService.run.mockResolvedValueOnce(undefined); // Update ok
            mockDatabaseService.get.mockRejectedValueOnce(error); // Post-check fails

            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = { assignee: newAssigneeKey };
            await controller.updateAssignee(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
            expect(mockDatabaseService.run).toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(500);
             // Corrected Expectation: Expect the generic error message from the catch block
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to update assignee' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    // --- addAttachment ---
    describe('addAttachment', () => {
        const issueKey = 'PROJECT-ATCH';
        const now = new Date().toISOString();
        const dbIssue: DbIssue = {
             _id: new ObjectId().toHexString(), id: 4, issuetype: 'task', summary: 'Task for attachment', description: 'Desc', key: issueKey, status: 'To Do', assignee_key: null, created_at: now, updated_at: now
        };
        const attachmentData = { filename: 'screenshot.png', url: 'http://example.com/screenshot.png' };
        const newAttachmentId = 5;
        const postUpdateDbIssue = { ...dbIssue, updated_at: new Date().toISOString() };


        it('should add an attachment, update issue timestamp, return attachment details, and trigger webhook', async () => {
            mockDatabaseService.get.mockResolvedValueOnce(dbIssue); // Issue check
            mockDatabaseService.run
                .mockResolvedValueOnce({ lastID: newAttachmentId } as any) // INSERT attachment
                .mockResolvedValueOnce(undefined); // UPDATE issue
            mockDatabaseService.get.mockResolvedValueOnce(postUpdateDbIssue); // Post-update issue check

            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = attachmentData;
            await controller.addAttachment(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
            expect(mockDatabaseService.get).toHaveBeenNthCalledWith(1, 'SELECT * FROM issues WHERE key = ?', [issueKey]);
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(2);
            expect(mockDatabaseService.run).toHaveBeenNthCalledWith(1,
                'INSERT INTO attachments (issue_key, filename, url, created_at) VALUES (?, ?, ?, ?)',
                [issueKey, attachmentData.filename, attachmentData.url, expect.any(String)]
            );
            expect(mockDatabaseService.run).toHaveBeenNthCalledWith(2,
                'UPDATE issues SET updated_at = ? WHERE key = ?',
                [expect.any(String), issueKey]
            );
             expect(mockDatabaseService.get).toHaveBeenNthCalledWith(2, 'SELECT * FROM issues WHERE key = ?', [issueKey]);

            expect(mockResponse.statusCode).toBe(200);
            const responseData = JSON.parse(mockResponse._getData());
            expect(responseData.id).toBe(newAttachmentId);
            expect(responseData.filename).toBe(attachmentData.filename);
            expect(responseData.content).toBe(attachmentData.url); // Controller maps url to content
            expect(responseData.created).toEqual(expect.any(String));

            const expectedFormattedIssue = formatIssueResponse(postUpdateDbIssue);
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            // Webhook payload includes the updated issue, potentially extra context if needed
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expect.objectContaining({ key: issueKey }));
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 400 if filename or url is missing', async () => {
            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = { filename: 'only_name.txt' }; // Missing URL
            await controller.addAttachment(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.statusCode).toBe(400);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Missing attachment filename or url in request body' });
            expect(mockDatabaseService.get).not.toHaveBeenCalled();
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 404 if issue is not found', async () => {
            mockDatabaseService.get.mockResolvedValueOnce(undefined); // Issue check fails
            mockRequest.params = { issueIdOrKey: 'NOT-FOUND' };
            mockRequest.body = attachmentData;

            await controller.addAttachment(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(404);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Issue not found' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

         it('should return 500 if database get (issue check) fails', async () => {
            const error = new Error('DB Get Error');
            mockDatabaseService.get.mockRejectedValueOnce(error); // Issue check fails
            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = attachmentData;

            await controller.addAttachment(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(500);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to add attachment' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 500 if database insert (attachment) fails', async () => {
             const error = new Error('DB Insert Error');
             mockDatabaseService.get.mockResolvedValueOnce(dbIssue); // Issue check ok
             mockDatabaseService.run.mockRejectedValueOnce(error); // INSERT attachment fails

             mockRequest.params = { issueIdOrKey: issueKey };
             mockRequest.body = attachmentData;
             await controller.addAttachment(mockRequest as Request, mockResponse as Response);

             expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
             expect(mockDatabaseService.run).toHaveBeenCalledTimes(1); // Only the INSERT
             expect(mockResponse.statusCode).toBe(500);
             expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to add attachment' });
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();
             expect(mockNext).not.toHaveBeenCalled();
         });

        it('should return 500 if database update (issue timestamp) fails', async () => {
            const error = new Error('DB Update Error');
            mockDatabaseService.get.mockResolvedValueOnce(dbIssue); // Issue check ok
            mockDatabaseService.run
                .mockResolvedValueOnce({ lastID: newAttachmentId } as any) // INSERT attachment ok
                .mockRejectedValueOnce(error); // UPDATE issue fails

            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = attachmentData;
            await controller.addAttachment(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(2); // Both runs attempted
            expect(mockResponse.statusCode).toBe(500);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to add attachment' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

         it('should return 500 if database get (post-update issue) fails', async () => {
            const error = new Error('DB Get Post-Update Error');
            mockDatabaseService.get.mockResolvedValueOnce(dbIssue); // Issue check ok
            mockDatabaseService.run
                .mockResolvedValueOnce({ lastID: newAttachmentId } as any) // INSERT attachment ok
                .mockResolvedValueOnce(undefined); // UPDATE issue ok
             mockDatabaseService.get.mockRejectedValueOnce(error); // Post-update get fails


            mockRequest.params = { issueIdOrKey: issueKey };
            mockRequest.body = attachmentData;
            await controller.addAttachment(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(2);
            expect(mockResponse.statusCode).toBe(500);
             // Corrected Expectation: Expect the generic error message from the catch block
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to add attachment' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    // --- linkIssues ---
    describe('linkIssues', () => {
        const sourceIssueKey = 'PROJECT-SRC-1';
        const linkedIssueKey = 'PROJECT-LINK-2';
        const linkType = 'blocks';
        const now = new Date().toISOString();
        const sourceDbIssue: DbIssue = {
             _id: new ObjectId().toHexString(), id: 10, key: sourceIssueKey, issuetype: 'task', summary: 'Source', description: '', status: 'To Do', assignee_key: null, created_at: now, updated_at: now
        };
        const linkedDbIssue: DbIssue = {
            _id: new ObjectId().toHexString(), id: 11, key: linkedIssueKey, issuetype: 'bug', summary: 'Linked', description: '', status: 'Open', assignee_key: null, created_at: now, updated_at: now
        };
        const mockLinkId = 15;
        const updatedTimestamp = new Date().toISOString();
        const updatedSourceDbIssue = { ...sourceDbIssue, updated_at: updatedTimestamp };
        const updatedLinkedDbIssue = { ...linkedDbIssue, updated_at: updatedTimestamp };

        it('should link two issues, update timestamps, return success, and trigger webhook', async () => {
            mockDatabaseService.get
                .mockResolvedValueOnce(sourceDbIssue) // Get source
                .mockResolvedValueOnce(linkedDbIssue) // Get linked
                .mockResolvedValueOnce(updatedSourceDbIssue) // Get updated source
                .mockResolvedValueOnce(updatedLinkedDbIssue); // Get updated linked
            mockDatabaseService.run
                .mockResolvedValueOnce({ lastID: mockLinkId } as any) // INSERT link
                .mockResolvedValueOnce(undefined) // UPDATE source
                .mockResolvedValueOnce(undefined); // UPDATE linked

            mockRequest.params = { issueIdOrKey: sourceIssueKey };
            mockRequest.body = { linkedIssueKey, linkType };
            await controller.linkIssues(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(4);
            expect(mockDatabaseService.get).toHaveBeenNthCalledWith(1, 'SELECT * FROM issues WHERE key = ?', [sourceIssueKey]);
            expect(mockDatabaseService.get).toHaveBeenNthCalledWith(2, 'SELECT * FROM issues WHERE key = ?', [linkedIssueKey]);
            expect(mockDatabaseService.get).toHaveBeenNthCalledWith(3, 'SELECT * FROM issues WHERE key = ?', [sourceIssueKey]);
            expect(mockDatabaseService.get).toHaveBeenNthCalledWith(4, 'SELECT * FROM issues WHERE key = ?', [linkedIssueKey]);
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(3);
            expect(mockDatabaseService.run).toHaveBeenNthCalledWith(1, 'INSERT INTO issue_links (source_issue_key, linked_issue_key, link_type) VALUES (?, ?, ?)', [sourceIssueKey, linkedIssueKey, linkType]);
            expect(mockDatabaseService.run).toHaveBeenNthCalledWith(2, 'UPDATE issues SET updated_at = ? WHERE key = ?', [expect.any(String), sourceIssueKey]);
            expect(mockDatabaseService.run).toHaveBeenNthCalledWith(3, 'UPDATE issues SET updated_at = ? WHERE key = ?', [expect.any(String), linkedIssueKey]);

            expect(mockResponse.statusCode).toBe(201);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Issues linked successfully' });

            const expectedWebhookPayload = {
                 webhookEvent: 'jira:issuelink_created',
                 issueLink: {
                     id: mockLinkId,
                     sourceIssueId: sourceDbIssue.id,
                     destinationIssueId: linkedDbIssue.id,
                     issueLinkType: { name: linkType, id: 0, inward: 'linked to', outward: 'links' }
                 },
            };
            expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
            expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issuelink_created', expect.objectContaining(expectedWebhookPayload));
             const actualPayload = mockTriggerWebhooks.mock.calls[0][1];
             expect(actualPayload.timestamp).toBeCloseTo(Date.now(), -3); // Check if timestamp is recent
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 400 if linkedIssueKey or linkType is missing', async () => {
            mockRequest.params = { issueIdOrKey: sourceIssueKey };
            mockRequest.body = { linkType }; // Missing linkedIssueKey
            await controller.linkIssues(mockRequest as Request, mockResponse as Response);

            expect(mockResponse.statusCode).toBe(400);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Missing linkedIssueKey or linkType in request body' });
            expect(mockDatabaseService.get).not.toHaveBeenCalled();
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 404 if source issue not found', async () => {
             mockDatabaseService.get.mockResolvedValueOnce(undefined); // Source not found
             mockRequest.params = { issueIdOrKey: 'NOT-FOUND-SRC' };
             mockRequest.body = { linkedIssueKey, linkType };

             await controller.linkIssues(mockRequest as Request, mockResponse as Response);

             expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
             expect(mockDatabaseService.run).not.toHaveBeenCalled();
             expect(mockResponse.statusCode).toBe(404);
             expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Source issue not found' });
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();
             expect(mockNext).not.toHaveBeenCalled();
         });

        it('should return 404 if linked issue not found', async () => {
             mockDatabaseService.get
                 .mockResolvedValueOnce(sourceDbIssue) // Source found
                 .mockResolvedValueOnce(undefined); // Linked not found
             mockRequest.params = { issueIdOrKey: sourceIssueKey };
             mockRequest.body = { linkedIssueKey: 'NOT-FOUND-LINK', linkType };

             await controller.linkIssues(mockRequest as Request, mockResponse as Response);

             expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
             expect(mockDatabaseService.run).not.toHaveBeenCalled();
             expect(mockResponse.statusCode).toBe(404);
             expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Linked issue not found' });
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();
             expect(mockNext).not.toHaveBeenCalled();
         });

         it('should return 400 if link already exists (UNIQUE constraint fail)', async () => {
             const error = new Error('UNIQUE constraint failed: issue_links.source_issue_key, issue_links.linked_issue_key, issue_links.link_type');
             mockDatabaseService.get
                 .mockResolvedValueOnce(sourceDbIssue) // Get source
                 .mockResolvedValueOnce(linkedDbIssue); // Get linked
             mockDatabaseService.run.mockRejectedValueOnce(error); // INSERT link fails with UNIQUE constraint

             mockRequest.params = { issueIdOrKey: sourceIssueKey };
             mockRequest.body = { linkedIssueKey, linkType };
             await controller.linkIssues(mockRequest as Request, mockResponse as Response);

             expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
             expect(mockDatabaseService.run).toHaveBeenCalledTimes(1); // Only the INSERT link
             expect(mockResponse.statusCode).toBe(400);
             expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Issue link already exists' });
             expect(mockTriggerWebhooks).not.toHaveBeenCalled();
             expect(mockNext).not.toHaveBeenCalled();
         });

        it('should return 500 if database get (source issue) fails', async () => {
            const error = new Error('DB Get Source Error');
            mockDatabaseService.get.mockRejectedValueOnce(error); // Get source fails
            mockRequest.params = { issueIdOrKey: sourceIssueKey };
            mockRequest.body = { linkedIssueKey, linkType };

            await controller.linkIssues(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(500);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to link issues' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 500 if database get (linked issue) fails', async () => {
            const error = new Error('DB Get Linked Error');
            mockDatabaseService.get
                .mockResolvedValueOnce(sourceDbIssue) // Source ok
                .mockRejectedValueOnce(error); // Get linked fails
            mockRequest.params = { issueIdOrKey: sourceIssueKey };
            mockRequest.body = { linkedIssueKey, linkType };

            await controller.linkIssues(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
            expect(mockDatabaseService.run).not.toHaveBeenCalled();
            expect(mockResponse.statusCode).toBe(500);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to link issues' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should return 500 if database insert (link) fails (non-UNIQUE error)', async () => {
            const error = new Error('DB Insert Link Error');
            mockDatabaseService.get
                .mockResolvedValueOnce(sourceDbIssue) // Get source
                .mockResolvedValueOnce(linkedDbIssue); // Get linked
            mockDatabaseService.run.mockRejectedValueOnce(error); // INSERT link fails

            mockRequest.params = { issueIdOrKey: sourceIssueKey };
            mockRequest.body = { linkedIssueKey, linkType };
            await controller.linkIssues(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(1);
            expect(mockResponse.statusCode).toBe(500);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to link issues' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
            expect(mockNext).not.toHaveBeenCalled();
        });

         it('should return 500 if database update (issue timestamp) fails', async () => {
            const error = new Error('DB Update Timestamp Error');
            mockDatabaseService.get
                .mockResolvedValueOnce(sourceDbIssue) // Get source
                .mockResolvedValueOnce(linkedDbIssue); // Get linked
            mockDatabaseService.run
                .mockResolvedValueOnce({ lastID: mockLinkId } as any) // INSERT link ok
                .mockRejectedValueOnce(error); // UPDATE source fails (or linked, the first one fails)

            mockRequest.params = { issueIdOrKey: sourceIssueKey };
            mockRequest.body = { linkedIssueKey, linkType };
            await controller.linkIssues(mockRequest as Request, mockResponse as Response);

            expect(mockDatabaseService.get).toHaveBeenCalledTimes(2); // Gets before updates
            expect(mockDatabaseService.run).toHaveBeenCalledTimes(2); // INSERT link + failing UPDATE
            expect(mockResponse.statusCode).toBe(500);
            expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to link issues' });
            expect(mockTriggerWebhooks).not.toHaveBeenCalled(); // Should not trigger if updates fail
            expect(mockNext).not.toHaveBeenCalled();
        });

         it('should return 500 if database get (post-update) fails', async () => { // Corrected test name and expectation
             const error = new Error('DB Get Post-Update Error');
             mockDatabaseService.get
                 .mockResolvedValueOnce(sourceDbIssue) // Get source
                 .mockResolvedValueOnce(linkedDbIssue) // Get linked
                 .mockRejectedValueOnce(error); // Get updated source fails
             // Note: The second post-update get won't even be called if the first fails.
             mockDatabaseService.run
                 .mockResolvedValueOnce({ lastID: mockLinkId } as any) // INSERT link
                 .mockResolvedValueOnce(undefined) // UPDATE source
                 .mockResolvedValueOnce(undefined); // UPDATE linked

             mockRequest.params = { issueIdOrKey: sourceIssueKey };
             mockRequest.body = { linkedIssueKey, linkType };
             await controller.linkIssues(mockRequest as Request, mockResponse as Response);

             expect(mockDatabaseService.get).toHaveBeenCalledTimes(3); // source, linked, failed updated source
             expect(mockDatabaseService.run).toHaveBeenCalledTimes(3); // insert, update, update
             // Corrected Expectation: Expect 500 and the generic error message
             expect(mockResponse.statusCode).toBe(500);
             expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to link issues' });
             expect(mockTriggerWebhooks).not.toHaveBeenCalled(); // Webhook should fail
             expect(mockNext).not.toHaveBeenCalled();
         });

    });
});
