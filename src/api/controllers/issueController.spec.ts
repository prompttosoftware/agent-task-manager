import { IssueController } from './issueController';
import { DatabaseService } from '../../services/databaseService';
import { IssueKeyService } from '../../services/issueKeyService';
import { IssueStatusTransitionService } from '../../services/issueStatusTransitionService'; // Import the service
import { Request, Response, NextFunction } from 'express';
import { Issue } from '../../models/issue';
import { ObjectId } from 'mongodb';
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
    const mockNext: jest.Mock = jest.fn();

    const mockDatabaseService = createMock<DatabaseService>();
    const mockIssueKeyService = createMock<IssueKeyService>();
    // Create a mock for IssueStatusTransitionService
    const mockIssueStatusTransitionService = createMock<IssueStatusTransitionService>();


    beforeEach(() => {
        // Reset mocks for all services
        mockDatabaseService.get.mockReset();
        mockDatabaseService.run.mockReset();
        mockIssueKeyService.getNextIssueKey.mockReset();
        mockDatabaseService.ensureTableExists.mockReset();
        mockDatabaseService.getSingleValue.mockReset();
        mockDatabaseService.setSingleValue.mockReset();
        mockDatabaseService.beginTransaction.mockReset();
        mockDatabaseService.commitTransaction.mockReset();
        mockDatabaseService.rollbackTransaction.mockReset();
        mockDatabaseService.connect.mockReset();
        mockDatabaseService.disconnect.mockReset();
        mockDatabaseService.all.mockReset();
        mockIssueStatusTransitionService.isValidTransition.mockReset(); // Reset the new mock

        (mockNext as jest.Mock).mockReset();
        mockTriggerWebhooks.mockClear(); // Reset mock calls before each test

        // Instantiate IssueController with all three mock services
        controller = new IssueController(
            mockDatabaseService,
            mockIssueKeyService,
            mockIssueStatusTransitionService // Pass the new mock service
        );

        mockRequest = httpMocks.createRequest();
        mockResponse = httpMocks.createResponse();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should create an issue and trigger webhook', async () => {
        const issueData = {
            issuetype: 'task',
            summary: 'Test issue',
            description: 'Test description',
            key: 'TASK-1' // Added key but controller generates new one
        };

        const issueId = new ObjectId().toHexString();
        const issueKey = 'PROJ-1';
        const now = new Date().toISOString();

        const createdDbIssue: DbIssue = {
            _id: issueId, // This might not actually be set by DB insert, formatIssueResponse uses it
            id: 1, // Example DB primary key ID
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
        // Mock run for INSERT
        mockDatabaseService.run.mockResolvedValue(undefined);
        // Mock get for SELECT after insert
        mockDatabaseService.get.mockResolvedValue(createdDbIssue);

        mockRequest.body = issueData;
        await controller.createIssue(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalled();
        expect(mockDatabaseService.run).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO issues'),
            expect.arrayContaining([ // Check specific elements loosely
                issueData.issuetype,
                issueData.summary,
                issueData.description,
                null, // parentKey
                issueKey,
                'To Do', // status
                expect.any(String), // created_at
                expect.any(String) // updated_at
            ])
        );
        expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [issueKey]);
        expect(mockResponse.statusCode).toBe(201);

        const expectedFormattedIssue = formatIssueResponse(createdDbIssue);
        expect(JSON.parse(mockResponse._getData())).toEqual(expectedFormattedIssue);

        // Assert webhook call
        expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
        expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_created', expectedFormattedIssue);
        expect(mockNext).not.toHaveBeenCalled(); // Should not call next on success
    });


    it('should get an issue by key', async () => {
        const now = new Date().toISOString();
        const dbIssue: DbIssue = {
            _id: new ObjectId().toHexString(), // Needed for formatIssueResponse
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

        mockRequest.params = {
            issueIdOrKey: 'PROJECT-123'
        };
        await controller.getIssue(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE key = ?'), ['PROJECT-123']);
        const expectedFormattedIssue = formatIssueResponse(dbIssue);
        expect(JSON.parse(mockResponse._getData())).toEqual(expectedFormattedIssue);
        // No webhook trigger for get
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled(); // Should not call next on success
    });

    it('should update an issue and trigger webhook', async () => {
        const issueKey = 'PROJECT-123';
        const now = new Date().toISOString();
        const updateData = {
            summary: 'Updated issue summary',
            description: 'Updated description',
            status: 'In Progress' // Include status update for transition check
        };

        const preUpdateDbIssue: DbIssue = {
            _id: new ObjectId().toHexString(),
            id: 1,
            issuetype: 'task',
            summary: 'Original Summary',
            description: 'Original Description',
            key: issueKey,
            status: 'To Do', // Original status
            assignee_key: null,
            created_at: now,
            updated_at: now
        };
        const postUpdateDbIssue: DbIssue = {
            ...preUpdateDbIssue,
            summary: updateData.summary,
            description: updateData.description,
            status: updateData.status!, // Updated status
            updated_at: new Date().toISOString() // Should be updated
        };

        // Mock get for pre-update check
        mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);

        // Mock isValidTransition implementation to return true
        mockIssueStatusTransitionService.isValidTransition.mockReturnValue(true);

        // Mock run for UPDATE
        mockDatabaseService.run.mockResolvedValue(undefined);
        // Mock get for SELECT after update
        mockDatabaseService.get.mockResolvedValueOnce(postUpdateDbIssue);

        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = updateData;
        await controller.updateIssue(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        // Expect transition validation to be called
        const preUpdateStatusId = controller['getStatusIdFromName'](preUpdateDbIssue.status);
        const postUpdateStatusId = controller['getStatusIdFromName'](updateData.status!);

        expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalledWith(preUpdateStatusId!, postUpdateStatusId!); // 'To Do' (11) to 'In Progress' (21)

        expect(mockDatabaseService.run).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE issues SET summary = ?, description = ?, status = ?, updated_at = ? WHERE key = ?'),
            expect.arrayContaining([
                updateData.summary,
                updateData.description,
                updateData.status,
                expect.any(String), // updated_at
                issueKey
            ])
        );
        // Called twice: once for pre-check, once for post-update retrieval
        expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
        expect(mockDatabaseService.get).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [issueKey]);
        expect(mockDatabaseService.get).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [issueKey]);
        expect(mockResponse.statusCode).toBe(204);
        expect(mockResponse._isEndCalled()).toBe(true);

        // Assert webhook call
        const expectedFormattedIssue = formatIssueResponse(postUpdateDbIssue);
        expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
        expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expectedFormattedIssue);
        expect(mockNext).not.toHaveBeenCalled(); // Should not call next on success
    });

    it('should prevent update issue with invalid status transition', async () => {
        const issueKey = 'PROJECT-INVALID';
        const now = new Date().toISOString();
        const updateData = {
            status: 'Done' // Invalid transition from 'To Do' directly to 'Done' in default rules
        };

        const preUpdateDbIssue: DbIssue = {
            _id: new ObjectId().toHexString(),
            id: 1,
            issuetype: 'task',
            summary: 'Original Summary',
            description: 'Original Description',
            key: issueKey,
            status: 'To Do', // Original status
            assignee_key: null,
            created_at: now,
            updated_at: now
        };

        // Mock get for pre-update check
        mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
        // Mock transition validation to return false
        mockIssueStatusTransitionService.isValidTransition.mockReturnValue(false);

        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = updateData;
        await controller.updateIssue(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        // Expect transition validation to be called
        const preUpdateStatusId = controller['getStatusIdFromName'](preUpdateDbIssue.status);
        const postUpdateStatusId = controller['getStatusIdFromName'](updateData.status!);
        expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalledWith(preUpdateStatusId!, postUpdateStatusId!); // 'To Do' (11) to 'Done' (31)

        // Ensure UPDATE was NOT called
        expect(mockDatabaseService.run).not.toHaveBeenCalled();
        // Ensure only the initial GET was called
        expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
        expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [issueKey]);

        // Expect a 400 error response
        expect(mockResponse.statusCode).toBe(400);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: "Invalid status transition from 'To Do' to 'Done'" });
        expect(mockResponse._isEndCalled()).toBe(true);

        // Assert no webhook call
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled(); // Controller handles response directly
    });


    it('should delete an issue and trigger webhook', async () => {
        const issueKey = 'PROJECT-123';
        const now = new Date().toISOString();
        const dbIssue: DbIssue = {
            _id: new ObjectId().toHexString(),
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

        // Mock get for pre-delete check
        mockDatabaseService.get.mockResolvedValue(dbIssue);
        // Mock run for DELETE
        mockDatabaseService.run.mockResolvedValue(undefined);

        mockRequest.params = { issueIdOrKey: issueKey };
        await controller.deleteIssue(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [issueKey]);
        expect(mockDatabaseService.run).toHaveBeenCalledWith('DELETE FROM issues WHERE key = ?', [issueKey]);
        expect(mockResponse.statusCode).toBe(204);
        expect(mockResponse._isEndCalled()).toBe(true);

        // Assert webhook call with pre-delete data
        const expectedFormattedIssue = formatIssueResponse(dbIssue);
        expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
        expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_deleted', expectedFormattedIssue);
        expect(mockNext).not.toHaveBeenCalled(); // Should not call next on success
    });

    it('should transition an issue status and trigger webhook', async () => {
        const issueKey = 'PROJECT-456';
        const now = new Date().toISOString();
        const newStatus = 'In Progress';

        const preUpdateDbIssue: DbIssue = {
            _id: new ObjectId().toHexString(),
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
            updated_at: new Date().toISOString() // Should be updated
        };

        // Mock get for pre-update check
        mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);

         // Mock isValidTransition implementation to return true
        mockIssueStatusTransitionService.isValidTransition.mockReturnValue(true);

        // Mock run for UPDATE status
        mockDatabaseService.run.mockResolvedValue(undefined);
        // Mock get for SELECT after update
        mockDatabaseService.get.mockResolvedValueOnce(postUpdateDbIssue);

        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = { transition: { name: newStatus } };
        await controller.transitionIssue(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        // Assert that the transition service was called with correct IDs
        const preUpdateStatusId = controller['getStatusIdFromName'](preUpdateDbIssue.status);
        const postUpdateStatusId = controller['getStatusIdFromName'](newStatus);
        expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalledWith(preUpdateStatusId!, postUpdateStatusId!); // 'To Do' (11) to 'In Progress' (21)

        expect(mockDatabaseService.run).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE issues SET status = ?, updated_at = ? WHERE key = ?'),
            [newStatus, expect.any(String), issueKey]
        );
        expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
        expect(mockDatabaseService.get).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [issueKey]);
        expect(mockDatabaseService.get).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [issueKey]);
        expect(mockResponse.statusCode).toBe(204);
        expect(mockResponse._isEndCalled()).toBe(true);

        // Assert webhook call
        const expectedFormattedIssue = formatIssueResponse(postUpdateDbIssue);
        expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
        expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expectedFormattedIssue);
        expect(mockNext).not.toHaveBeenCalled(); // Should not call next on success
    });

    it('should prevent invalid issue status transition', async () => {
        const issueKey = 'PROJECT-456';
        const now = new Date().toISOString();
        const invalidNewStatus = 'Done'; // Assume this is invalid from 'To Do'

        const preUpdateDbIssue: DbIssue = {
            _id: new ObjectId().toHexString(),
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

        // Mock get for pre-update check
        mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
        // Mock the transition validation to return false
        mockIssueStatusTransitionService.isValidTransition.mockReturnValue(false);

        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = { transition: { name: invalidNewStatus } };
        await controller.transitionIssue(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        // Assert that the transition service was called
        const preUpdateStatusId = controller['getStatusIdFromName'](preUpdateDbIssue.status);
        const postUpdateStatusId = controller['getStatusIdFromName'](invalidNewStatus);
        expect(mockIssueStatusTransitionService.isValidTransition).toHaveBeenCalledWith(preUpdateStatusId!, postUpdateStatusId!); // 'To Do' (11) to 'Done' (31)

        // Assert that the database run was NOT called
        expect(mockDatabaseService.run).not.toHaveBeenCalled();
        // Assert only one GET call was made
        expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);

        // Assert response is 400 Bad Request
        expect(mockResponse.statusCode).toBe(400);
        expect(JSON.parse(mockResponse._getData())).toEqual({
            message: "Invalid status transition from 'To Do' to 'Done'"
        });
        expect(mockResponse._isEndCalled()).toBe(true);

        // Assert webhook was NOT called
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled(); // Controller handles response directly
    });

    it('should update an issue assignee and trigger webhook', async () => {
        const issueKey = 'PROJECT-789';
        const now = new Date().toISOString();
        const newAssigneeKey = 'user-123';

        const preUpdateDbIssue: DbIssue = {
            _id: new ObjectId().toHexString(),
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
            updated_at: new Date().toISOString() // Should be updated
        };

        // Mock get for pre-update check
        mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
        // Mock run for UPDATE assignee
        mockDatabaseService.run.mockResolvedValue(undefined);
        // Mock get for SELECT after update
        mockDatabaseService.get.mockResolvedValueOnce(postUpdateDbIssue);

        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = { assignee: newAssigneeKey };
        await controller.updateAssignee(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        expect(mockDatabaseService.run).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE issues SET assignee_key = ?, updated_at = ? WHERE key = ?'),
            [newAssigneeKey, expect.any(String), issueKey]
        );
        expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
        expect(mockDatabaseService.get).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [issueKey]);
        expect(mockDatabaseService.get).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [issueKey]);
        expect(mockResponse.statusCode).toBe(204);
        expect(mockResponse._isEndCalled()).toBe(true);

        // Assert webhook call
        const expectedFormattedIssue = formatIssueResponse(postUpdateDbIssue);
        expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
        expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expectedFormattedIssue);
        expect(mockNext).not.toHaveBeenCalled(); // Should not call next on success
    });

     it('should add an attachment to an issue and trigger webhook', async () => {
        const issueKey = 'PROJECT-101';
        const now = new Date().toISOString();
        const attachmentData = {
            filename: 'screenshot.png',
            url: 'http://example.com/screenshot.png'
        };
        const newAttachmentId = 5;

        const preUpdateDbIssue: DbIssue = {
            _id: new ObjectId().toHexString(),
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
         const postUpdateDbIssue: DbIssue = {
             ...preUpdateDbIssue,
             assignee_key: null,
             updated_at: new Date().toISOString() // Should be updated
         };


        // Mock get for issue check
        mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
        // Mock run for INSERT attachment (return lastID)
        mockDatabaseService.run.mockResolvedValueOnce({ lastID: newAttachmentId } as any);
        // Mock run for UPDATE issue updated_at
        mockDatabaseService.run.mockResolvedValueOnce(undefined);
         // Mock get for SELECT issue after update
         mockDatabaseService.get.mockResolvedValueOnce(postUpdateDbIssue);


        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = attachmentData;
        await controller.addAttachment(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        // Check INSERT attachment call
        expect(mockDatabaseService.run).toHaveBeenCalledWith(
            'INSERT INTO attachments (issue_key, filename, url, created_at) VALUES (?, ?, ?, ?)',
            [issueKey, attachmentData.filename, attachmentData.url, expect.any(String)]
        );
        // Check UPDATE issue call
        expect(mockDatabaseService.run).toHaveBeenCalledWith(
            'UPDATE issues SET updated_at = ? WHERE key = ?',
            [expect.any(String), issueKey]
        );
         // Check get issue calls (once before, once after)
        expect(mockDatabaseService.get).toHaveBeenCalledTimes(2);
        expect(mockDatabaseService.get).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [issueKey]);
        expect(mockDatabaseService.get).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [issueKey]);


        expect(mockResponse.statusCode).toBe(200);
        const responseData = JSON.parse(mockResponse._getData());
        expect(responseData.id).toBe(newAttachmentId);
        expect(responseData.filename).toBe(attachmentData.filename);
        expect(responseData.content).toBe(attachmentData.url);

        // Assert webhook call
        const expectedFormattedIssue = formatIssueResponse(postUpdateDbIssue);
        expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
        expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expectedFormattedIssue);
        expect(mockNext).not.toHaveBeenCalled(); // Should not call next on success
    });

     it('should link two issues and trigger webhook', async () => {
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

         const updatedTimestamp = new Date().toISOString();
         const updatedSourceDbIssue: DbIssue = { ...sourceDbIssue, updated_at: updatedTimestamp };
         const updatedLinkedDbIssue: DbIssue = { ...linkedDbIssue, updated_at: updatedTimestamp };


        // Mock get for source issue check
        mockDatabaseService.get.mockResolvedValueOnce(sourceDbIssue);
        // Mock get for linked issue check
        mockDatabaseService.get.mockResolvedValueOnce(linkedDbIssue);
        // Mock run for INSERT link (return lastID for webhook)
        const mockLinkId = 15;
        mockDatabaseService.run.mockResolvedValueOnce({ lastID: mockLinkId } as any);
        // Mock run for UPDATE source issue
        mockDatabaseService.run.mockResolvedValueOnce(undefined);
        // Mock run for UPDATE linked issue
        mockDatabaseService.run.mockResolvedValueOnce(undefined);
         // Mock get for updated source issue
         mockDatabaseService.get.mockResolvedValueOnce(updatedSourceDbIssue);
         // Mock get for updated linked issue
         mockDatabaseService.get.mockResolvedValueOnce(updatedLinkedDbIssue);


        mockRequest.params = { issueIdOrKey: sourceIssueKey };
        mockRequest.body = { linkedIssueKey, linkType };
        await controller.linkIssues(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);


        // Check get calls (source, linked, updated source, updated linked)
        expect(mockDatabaseService.get).toHaveBeenCalledTimes(4);
        expect(mockDatabaseService.get).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [sourceIssueKey]);
        expect(mockDatabaseService.get).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [linkedIssueKey]);
         expect(mockDatabaseService.get).toHaveBeenNthCalledWith(3, 'SELECT * FROM issues WHERE key = ?', [sourceIssueKey]);
         expect(mockDatabaseService.get).toHaveBeenNthCalledWith(4, 'SELECT * FROM issues WHERE key = ?', [linkedIssueKey]);


        // Check run calls (insert link, update source, update linked)
        expect(mockDatabaseService.run).toHaveBeenCalledTimes(3);
        expect(mockDatabaseService.run).toHaveBeenNthCalledWith(1, 'INSERT INTO issue_links (source_issue_key, linked_issue_key, link_type) VALUES (?, ?, ?)', [sourceIssueKey, linkedIssueKey, linkType]);
        expect(mockDatabaseService.run).toHaveBeenNthCalledWith(2, 'UPDATE issues SET updated_at = ? WHERE key = ?', [expect.any(String), sourceIssueKey]);
        expect(mockDatabaseService.run).toHaveBeenNthCalledWith(3, 'UPDATE issues SET updated_at = ? WHERE key = ?', [expect.any(String), linkedIssueKey]);

        expect(mockResponse.statusCode).toBe(201);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Issues linked successfully' });

        // Assert webhook call
        const expectedWebhookPayload = {
            timestamp: expect.any(Number), // Allow any timestamp generated by Date.now()
            webhookEvent: 'jira:issuelink_created',
            issueLink: {
                id: mockLinkId, // Check the mock link ID
                sourceIssueId: sourceDbIssue.id,
                destinationIssueId: linkedDbIssue.id,
                issueLinkType: {
                    name: linkType,
                    // The controller uses hardcoded values here
                    id: 0,
                    inward: 'linked to',
                    outward: 'links',
                }
            },
        };
        expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
        expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issuelink_created', expect.objectContaining(expectedWebhookPayload));
         // Check timestamp separately if needed more precisely
         const actualPayload = mockTriggerWebhooks.mock.calls[0][1];
         expect(actualPayload.timestamp).toBeCloseTo(Date.now(), -3); // Check if timestamp is recent (within ~1 second)
         expect(mockNext).not.toHaveBeenCalled(); // Should not call next on success
    });


    it('should handle errors during creation and call next', async () => {
        const error = new Error('Database insert error');
        mockIssueKeyService.getNextIssueKey.mockResolvedValue('TASK-ERR'); // Assume key generation succeeds
        mockDatabaseService.run.mockRejectedValue(error); // Mock INSERT failure

        mockRequest.body = {
            issuetype: 'bug',
            summary: 'Error case',
            description: 'Testing error handling',
            key: 'TEST-ERR' // included but controller uses generated key
        };

        await controller.createIssue(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalled();
        expect(mockDatabaseService.run).toHaveBeenCalled(); // Verify insert was attempted
        expect(mockDatabaseService.get).not.toHaveBeenCalled(); // SELECT should not happen on insert error
        // Verify the controller passed the error to the error handler
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to create issue: Database insert error' }));
        expect(mockResponse.statusCode).not.toBe(500); // Should not be set by controller directly
        expect(mockResponse._isEndCalled()).toBe(false); // Response should not be ended by controller
        // No webhook trigger on error
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
    });

    it('should call next with error if getIssue fails', async () => {
        const error = new Error('Database get error');
        mockDatabaseService.get.mockRejectedValue(error);

        mockRequest.params = { issueIdOrKey: 'FAIL-GET' };
        await controller.getIssue(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE key = ?'), ['FAIL-GET']);
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to retrieve issue: Database get error' }));
        expect(mockResponse._isEndCalled()).toBe(false);
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
    });

    it('should call next with error if updateIssue fails', async () => {
         const issueKey = 'PROJECT-UPDATE-FAIL';
         const now = new Date().toISOString();
         const updateData = { summary: 'Update Fail' };
         const error = new Error('Database update error');

         const preUpdateDbIssue: DbIssue = {
             _id: new ObjectId().toHexString(), id: 1, key: issueKey, status: 'To Do', issuetype: 'task', summary: 'Old', description: '', assignee_key: null, created_at: now, updated_at: now
         };

         mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
         mockIssueStatusTransitionService.isValidTransition.mockReturnValue(true); // Assume valid transition
         mockDatabaseService.run.mockRejectedValue(error); // Mock UPDATE failure

         mockRequest.params = { issueIdOrKey: issueKey };
         mockRequest.body = updateData;
         await controller.updateIssue(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

         expect(mockDatabaseService.get).toHaveBeenCalledTimes(1); // Only pre-check get
         expect(mockDatabaseService.run).toHaveBeenCalled(); // Verify update was attempted
         expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
         expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to update issue: Database update error' }));
         expect(mockResponse._isEndCalled()).toBe(false);
         expect(mockTriggerWebhooks).not.toHaveBeenCalled();
     });

    it('should call next with error if deleteIssue fails', async () => {
        const issueKey = 'PROJECT-DELETE-FAIL';
        const now = new Date().toISOString();
        const error = new Error('Database delete error');
        const dbIssue: DbIssue = {
            _id: new ObjectId().toHexString(), id: 1, key: issueKey, status: 'Done', issuetype: 'task', summary: 'To Delete', description: '', assignee_key: null, created_at: now, updated_at: now
        };

        mockDatabaseService.get.mockResolvedValueOnce(dbIssue);
        mockDatabaseService.run.mockRejectedValue(error); // Mock DELETE failure

        mockRequest.params = { issueIdOrKey: issueKey };
        await controller.deleteIssue(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
        expect(mockDatabaseService.run).toHaveBeenCalledWith('DELETE FROM issues WHERE key = ?', [issueKey]);
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        expect(mockNext).toHaveBeenCalledWith(expect.objectContaining({ message: 'Failed to delete issue: Database delete error' }));
        expect(mockResponse._isEndCalled()).toBe(false);
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
    });

    // 1. Test the `getIssue` method with a non-existent issue ID, expecting a 404 response.
    it('should return 404 for non-existent issue', async () => {
        mockDatabaseService.get.mockResolvedValue(undefined); // Simulate issue not found

        mockRequest.params = { issueIdOrKey: 'NONEXISTENT' };
        await controller.getIssue(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE key = ?'), ['NONEXISTENT']);
        expect(mockResponse.statusCode).toBe(404);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Issue not found' });
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled(); // Controller handles 404 directly
    });

    // 2. Test the `updateIssue` method, updating only the `assignee_key` field.
    it('should update only the assignee_key field', async () => {
        const issueKey = 'PROJECT-ASSIGNEE';
        const now = new Date().toISOString();
        const newAssigneeKey = 'user-456';
        const updateData = { assignee_key: newAssigneeKey };

        const preUpdateDbIssue: DbIssue = {
            _id: new ObjectId().toHexString(),
            id: 5,
            issuetype: 'task',
            summary: 'Assignee Test',
            description: 'Testing assignee update',
            key: issueKey,
            status: 'To Do',
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
        mockDatabaseService.run.mockResolvedValueOnce(undefined);
        mockDatabaseService.get.mockResolvedValueOnce(postUpdateDbIssue);
        // No status transition, so no need to mock isValidTransition

        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = updateData;
        await controller.updateIssue(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        expect(mockDatabaseService.run).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE issues SET assignee_key = ?, updated_at = ? WHERE key = ?'),
            [newAssigneeKey, expect.any(String), issueKey]
        );
        expect(mockResponse.statusCode).toBe(204);
        expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
        const expectedFormattedIssue = formatIssueResponse(postUpdateDbIssue);
        expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expectedFormattedIssue);
        expect(mockNext).not.toHaveBeenCalled(); // Should not call next on success
    });

    it('should return 400 if status name is invalid during update', async () => {
        const issueKey = 'PROJECT-NULL';
        const now = new Date().toISOString();
        const updateData = {
            status: 'Invalid Status' // Provide an invalid status name
        };

        const preUpdateDbIssue: DbIssue = {
             _id: new ObjectId().toHexString(),
             id: 6,
             issuetype: 'task',
             summary: 'Status Test',
             description: 'Testing invalid status update',
             key: issueKey,
             status: 'To Do', // Valid current status
             assignee_key: null,
             created_at: now,
             updated_at: now
         };

        // Mock get for pre-update check
        mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
        // No need to mock transition service as it shouldn't be reached
        // No need to mock run or subsequent get as update should fail

        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = updateData;
        await controller.updateIssue(mockRequest as Request, mockResponse as Response, mockNext as NextFunction);

        // Ensure only the initial GET was called
        expect(mockDatabaseService.get).toHaveBeenCalledTimes(1);
        expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [issueKey]);

        // Ensure UPDATE was NOT called
        expect(mockDatabaseService.run).not.toHaveBeenCalled();

        // Expect a 400 error response
        expect(mockResponse.statusCode).toBe(400);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: "Invalid status name provided: Current='To Do', Target='Invalid Status'" });
        expect(mockResponse._isEndCalled()).toBe(true);

        // Assert no webhook call
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        expect(mockNext).not.toHaveBeenCalled(); // Controller handles response directly
    });
});
