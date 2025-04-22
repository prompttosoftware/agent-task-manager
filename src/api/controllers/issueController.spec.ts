import { IssueController } from './issueController';
import { DatabaseService } from '../../services/databaseService';
import { IssueKeyService } from '../../services/issueKeyService';
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


describe('IssueController', () => {
    let controller: IssueController;
    let mockRequest: httpMocks.MockRequest<Request>;
    let mockResponse: httpMocks.MockResponse<Response>;
    const mockNext: jest.Mock = jest.fn();

    const mockDatabaseService = createMock<DatabaseService>();
    const mockIssueKeyService = createMock<IssueKeyService>();


    beforeEach(() => {
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
        (mockNext as jest.Mock).mockReset();
        mockTriggerWebhooks.mockClear(); // Reset mock calls before each test

        controller = new IssueController(
            mockDatabaseService,
            mockIssueKeyService
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

        const createdDbIssue: Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; } = {
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
        await controller.createIssue(mockRequest as any as Request, mockResponse as any as Response);

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
    });


    it('should get an issue by key', async () => {
        const now = new Date().toISOString();
        const dbIssue: Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; } = {
            _id: new ObjectId().toHexString(), // Needed for formatIssueResponse
            id: 1,
            issuetype: 'task',
            summary: 'Test issue',
            description: 'Test description',
            key: 'PROJECT-123',
            status: 'In Progress',
            created_at: now,
            updated_at: now
        };

        mockDatabaseService.get.mockResolvedValue(dbIssue);

        mockRequest.params = {
            issueIdOrKey: 'PROJECT-123'
        };
        await controller.getIssue(mockRequest as any as Request, mockResponse as any as Response);

        expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE key = ?'), ['PROJECT-123']);
        const expectedFormattedIssue = formatIssueResponse(dbIssue);
        expect(JSON.parse(mockResponse._getData())).toEqual(expectedFormattedIssue);
        // No webhook trigger for get
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
    });

    it('should update an issue and trigger webhook', async () => {
        const issueKey = 'PROJECT-123';
        const now = new Date().toISOString();
        const updateData = {
            summary: 'Updated issue summary',
            description: 'Updated description',
        };

        const preUpdateDbIssue: Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; } = {
            _id: new ObjectId().toHexString(),
            id: 1,
            issuetype: 'task',
            summary: 'Original Summary',
            description: 'Original Description',
            key: issueKey,
            status: 'To Do',
            created_at: now,
            updated_at: now
        };
        const postUpdateDbIssue: Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; } = {
            ...preUpdateDbIssue,
            summary: updateData.summary,
            description: updateData.description,
            updated_at: new Date().toISOString() // Should be updated
        };

        // Mock get for pre-update check
        mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
        // Mock run for UPDATE
        mockDatabaseService.run.mockResolvedValue(undefined);
        // Mock get for SELECT after update
        mockDatabaseService.get.mockResolvedValueOnce(postUpdateDbIssue);

        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = updateData;
        await controller.updateIssue(mockRequest as any as Request, mockResponse as any as Response);

        expect(mockDatabaseService.run).toHaveBeenCalledWith(
            expect.stringContaining('UPDATE issues SET summary = ?, description = ?, updated_at = ? WHERE key = ?'),
            expect.arrayContaining([
                updateData.summary,
                updateData.description,
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
    });

    it('should delete an issue and trigger webhook', async () => {
        const issueKey = 'PROJECT-123';
        const now = new Date().toISOString();
        const dbIssue: Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; } = {
            _id: new ObjectId().toHexString(),
            id: 1,
            issuetype: 'task',
            summary: 'Test issue to delete',
            description: 'Test description',
            key: issueKey,
            status: 'Done',
            created_at: now,
            updated_at: now
        };

        // Mock get for pre-delete check
        mockDatabaseService.get.mockResolvedValue(dbIssue);
        // Mock run for DELETE
        mockDatabaseService.run.mockResolvedValue(undefined);

        mockRequest.params = { issueIdOrKey: issueKey };
        await controller.deleteIssue(mockRequest as any as Request, mockResponse as any as Response);

        expect(mockDatabaseService.get).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE key = ?'), [issueKey]);
        expect(mockDatabaseService.run).toHaveBeenCalledWith('DELETE FROM issues WHERE key = ?', [issueKey]);
        expect(mockResponse.statusCode).toBe(204);
        expect(mockResponse._isEndCalled()).toBe(true);

        // Assert webhook call with pre-delete data
        const expectedFormattedIssue = formatIssueResponse(dbIssue);
        expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
        expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_deleted', expectedFormattedIssue);
    });

    it('should transition an issue status and trigger webhook', async () => {
        const issueKey = 'PROJECT-456';
        const now = new Date().toISOString();
        const newStatus = 'In Progress';

        const preUpdateDbIssue: Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; } = {
            _id: new ObjectId().toHexString(),
            id: 2,
            issuetype: 'bug',
            summary: 'Bug to transition',
            description: 'Description',
            key: issueKey,
            status: 'To Do',
            created_at: now,
            updated_at: now
        };
        const postUpdateDbIssue: Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; } = {
            ...preUpdateDbIssue,
            status: newStatus,
            updated_at: new Date().toISOString() // Should be updated
        };

        // Mock get for pre-update check
        mockDatabaseService.get.mockResolvedValueOnce(preUpdateDbIssue);
        // Mock run for UPDATE status
        mockDatabaseService.run.mockResolvedValue(undefined);
        // Mock get for SELECT after update
        mockDatabaseService.get.mockResolvedValueOnce(postUpdateDbIssue);

        mockRequest.params = { issueIdOrKey: issueKey };
        mockRequest.body = { transition: { name: newStatus } };
        await controller.transitionIssue(mockRequest as any as Request, mockResponse as any as Response);

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
    });

    it('should update an issue assignee and trigger webhook', async () => {
        const issueKey = 'PROJECT-789';
        const now = new Date().toISOString();
        const newAssigneeKey = 'user-123';

        const preUpdateDbIssue: Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; } = {
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
        const postUpdateDbIssue: Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; } = {
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
        await controller.updateAssignee(mockRequest as any as Request, mockResponse as any as Response);

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
    });

     it('should add an attachment to an issue and trigger webhook', async () => {
        const issueKey = 'PROJECT-101';
        const now = new Date().toISOString();
        const attachmentData = {
            filename: 'screenshot.png',
            url: 'http://example.com/screenshot.png'
        };
        const newAttachmentId = 5;

        const preUpdateDbIssue: Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; } = {
            _id: new ObjectId().toHexString(),
            id: 4,
            issuetype: 'task',
            summary: 'Task for attachment',
            description: 'Description',
            key: issueKey,
            status: 'To Do',
            created_at: now,
            updated_at: now
        };
         const postUpdateDbIssue: Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; } = {
             ...preUpdateDbIssue,
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
        await controller.addAttachment(mockRequest as any as Request, mockResponse as any as Response);

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
        // The controller adds the formatted issue inside an object for this specific webhook trigger
        expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
        expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issue_updated', expectedFormattedIssue);
    });

     it('should link two issues and trigger webhook', async () => {
        const sourceIssueKey = 'PROJECT-SRC-1';
        const linkedIssueKey = 'PROJECT-LINK-2';
        const linkType = 'blocks';
        const now = new Date().toISOString();

        const sourceDbIssue: Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; } = {
            _id: new ObjectId().toHexString(), id: 10, key: sourceIssueKey, issuetype: 'task', summary: 'Source', description: '', status: 'To Do', created_at: now, updated_at: now
        };
        const linkedDbIssue: Issue & { id: number; key: string; status: string; assignee_key?: string | null; created_at: string; updated_at: string; } = {
            _id: new ObjectId().toHexString(), id: 11, key: linkedIssueKey, issuetype: 'bug', summary: 'Linked', description: '', status: 'Open', created_at: now, updated_at: now
        };

         const updatedTimestamp = new Date().toISOString();
         const updatedSourceDbIssue = { ...sourceDbIssue, updated_at: updatedTimestamp };
         const updatedLinkedDbIssue = { ...linkedDbIssue, updated_at: updatedTimestamp };


        // Mock get for source issue check
        mockDatabaseService.get.mockResolvedValueOnce(sourceDbIssue);
        // Mock get for linked issue check
        mockDatabaseService.get.mockResolvedValueOnce(linkedDbIssue);
        // Mock run for INSERT link
        mockDatabaseService.run.mockResolvedValueOnce(undefined);
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
        await controller.linkIssues(mockRequest as any as Request, mockResponse as any as Response);


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
                id: 0, // Hardcoded in controller
                sourceIssueId: sourceDbIssue.id,
                destinationIssueId: linkedDbIssue.id,
                issueLinkType: {
                    name: linkType,
                }
            },
        };
        expect(mockTriggerWebhooks).toHaveBeenCalledTimes(1);
        expect(mockTriggerWebhooks).toHaveBeenCalledWith('jira:issuelink_created', expect.objectContaining(expectedWebhookPayload));
         // Check timestamp separately if needed more precisely
         const actualPayload = mockTriggerWebhooks.mock.calls[0][1];
         expect(actualPayload.timestamp).toBeCloseTo(Date.now(), -3); // Check if timestamp is recent (within ~1 second)

    });


    it('should handle errors during creation and respond with 500', async () => {
        const error = new Error('Database insert error');
        mockIssueKeyService.getNextIssueKey.mockResolvedValue('TASK-ERR'); // Assume key generation succeeds
        mockDatabaseService.run.mockRejectedValue(error); // Mock INSERT failure

        mockRequest.body = {
            issuetype: 'bug',
            summary: 'Error case',
            description: 'Testing error handling',
            key: 'TEST-ERR' // included but controller uses generated key
        };

        await controller.createIssue(mockRequest as any as Request, mockResponse as any as Response);

        expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalled();
        expect(mockDatabaseService.run).toHaveBeenCalled(); // Verify insert was attempted
        expect(mockDatabaseService.get).not.toHaveBeenCalled(); // SELECT should not happen on insert error
        // Verify the controller sent the error response itself
        expect(mockResponse.statusCode).toBe(500);
        expect(JSON.parse(mockResponse._getData())).toEqual({ message: 'Failed to create issue' });
        expect(mockNext).not.toHaveBeenCalled(); // Controller handles response
        // No webhook trigger on error
        expect(mockTriggerWebhooks).not.toHaveBeenCalled();
    });
});