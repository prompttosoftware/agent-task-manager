import { createWebhook, triggerWebhooks, deleteWebhook } from './webhookService';
import { getDBConnection } from '../config/db';
import axios from 'axios';
import { Webhook } from '../models/webhook';

// Mock the database connection module
jest.mock('../config/db', () => ({
    getDBConnection: jest.fn()
}));

// Mock axios
jest.mock('axios');

describe('webhookService', () => {
    let mockGetDBConnection: jest.Mock;
    let mockAxios: jest.Mocked<typeof axios>;

    beforeEach(() => {
        mockGetDBConnection = jest.mocked(getDBConnection);
        mockAxios = jest.mocked(axios, true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createWebhook', () => {
        it('should create a new webhook', async () => {
            const webhookData = { url: 'http://example.com/new', events: 'issue_created' };
            const mockRunResult = { lastID: 1, changes: 1 };
            const mockRun = jest.fn().mockResolvedValue(mockRunResult);

            mockGetDBConnection.mockResolvedValue({
                run: mockRun,
                all: jest.fn(),
                get: jest.fn(),
                close: jest.fn(),
                exec: jest.fn()
            });

            const result = await createWebhook(webhookData);

            expect(mockRun).toHaveBeenCalledWith(expect.any(String), webhookData.url, webhookData.events);
            expect(result).toEqual({ id: mockRunResult.lastID, url: webhookData.url, events: webhookData.events });
        });

        it('should handle errors during webhook creation', async () => {
            const webhookData = { url: 'http://example.com/new', events: 'issue_created' };
            const dbError = new Error('Database error');
            mockGetDBConnection.mockRejectedValue(dbError);

            await expect(createWebhook(webhookData)).rejects.toThrow('Database error');
        });
    });

    describe('deleteWebhook', () => {
        it('should successfully delete a webhook', async () => {
            const webhookId = '123';
            const mockRunResult = { changes: 1 };
            const mockRun = jest.fn().mockResolvedValue(mockRunResult);

            mockGetDBConnection.mockResolvedValue({
                run: mockRun,
                all: jest.fn(),
                get: jest.fn(),
                close: jest.fn(),
                exec: jest.fn()
            });

            await deleteWebhook(webhookId);

            expect(mockRun).toHaveBeenCalledWith(expect.any(String), webhookId);
        });

        it('should handle the case when a webhook with the specified ID does not exist', async () => {
            const webhookId = '456';
            const mockRunResult = { changes: 0 }; // No rows affected
            const mockRun = jest.fn().mockResolvedValue(mockRunResult);

            mockGetDBConnection.mockResolvedValue({
                run: mockRun,
                all: jest.fn(),
                get: jest.fn(),
                close: jest.fn(),
                exec: jest.fn()
            });

            await deleteWebhook(webhookId);

            expect(mockRun).toHaveBeenCalledWith(expect.any(String), webhookId);
            // Add an assertion to check if the lack of deletion is handled correctly (e.g., no error thrown)
            // Or if you want to throw an error when no rows are deleted, you can adjust the function and test for that.
        });

        it('should handle errors during webhook deletion', async () => {
            const webhookId = '789';
            const dbError = new Error('Database error');
            mockGetDBConnection.mockRejectedValue(dbError);

            await expect(deleteWebhook(webhookId)).rejects.toThrow('Database error');
        });
    });

    describe('triggerWebhooks', () => {
        const mockIssueData = { id: 1, title: 'Test Issue' };

        it('should trigger the correct webhooks based on the event type', async () => {
            const eventType = 'issue_created';
            const mockWebhooks: Webhook[] = [
                { id: 1, url: 'http://example.com/webhook1', events: ['issue_created'], secret: '' },
                { id: 2, url: 'http://example.com/webhook2', events: ['issue_updated'], secret: '' },
                { id: 3, url: 'http://example.com/webhook3', events: ['issue_created', 'issue_updated'], secret: '' },
                { id: 4, url: 'http://example.com/webhook4', events: ['issue_deleted'], secret: '' }
            ];

            mockGetDBConnection.mockResolvedValue({
                all: jest.fn().mockResolvedValue(mockWebhooks),
                run: jest.fn(),
                get: jest.fn(),
                close: jest.fn(),
                exec: jest.fn()
            });

            mockAxios.post.mockResolvedValue({ status: 200 });

            await triggerWebhooks(eventType, mockIssueData);

            expect(mockGetDBConnection).toHaveBeenCalledTimes(1);
            expect(mockAxios.post).toHaveBeenCalledTimes(2); // Only webhook1 and webhook3 should be called
            expect(mockAxios.post).toHaveBeenCalledWith('http://example.com/webhook1', expect.any(Object), expect.any(Object));
            expect(mockAxios.post).toHaveBeenCalledWith('http://example.com/webhook3', expect.any(Object), expect.any(Object));
        });

        it('should send the correct payload to each webhook', async () => {
            const eventType = 'issue_created';
            const mockWebhook: Webhook[] = [{ id: 1, url: 'http://example.com/webhook1', events: ['issue_created'], secret: '' }];

            mockGetDBConnection.mockResolvedValue({
                all: jest.fn().mockResolvedValue(mockWebhook),
                run: jest.fn(),
                get: jest.fn(),
                close: jest.fn(),
                exec: jest.fn()
            });

            mockAxios.post.mockResolvedValue({ status: 200 });

            await triggerWebhooks(eventType, mockIssueData);

            expect(mockAxios.post).toHaveBeenCalledWith(
                'http://example.com/webhook1',
                expect.objectContaining({
                    webhookEvent: eventType,
                    issue: mockIssueData,
                }),
                expect.any(Object)
            );
        });

        it('should handle successful webhook call', async () => {
            const eventType = 'issue_created';
            const mockWebhook: Webhook[] = [{ id: 1, url: 'http://example.com/webhook1', events: ['issue_created'], secret: '' }];

            mockGetDBConnection.mockResolvedValue({
                all: jest.fn().mockResolvedValue(mockWebhook),
                run: jest.fn(),
                get: jest.fn(),
                close: jest.fn(),
                exec: jest.fn()
            });

            mockAxios.post.mockResolvedValue({ status: 200 });

            await triggerWebhooks(eventType, mockIssueData);

            expect(mockAxios.post).toHaveBeenCalledTimes(1);

        });

        it('should handle failed webhook calls and retry logic', async () => {
            const eventType = 'issue_created';
            const mockWebhook: Webhook[] = [{ id: 1, url: 'http://example.com/webhook1', events: ['issue_created'], secret: '' }];

            mockGetDBConnection.mockResolvedValue({
                all: jest.fn().mockResolvedValue(mockWebhook),
                run: jest.fn(),
                get: jest.fn(),
                close: jest.fn(),
                exec: jest.fn()
            });

            mockAxios.post.mockRejectedValue(new Error('Network error'));

            await triggerWebhooks(eventType, mockIssueData);

            expect(mockAxios.post).toHaveBeenCalledTimes(4); // 1 initial call + 3 retries
        });

        it('should handle server errors (500 status code) during webhook calls and retry logic', async () => {
            const eventType = 'issue_created';
            const mockWebhook: Webhook[] = [{ id: 1, url: 'http://example.com/webhook1', events: ['issue_created'], secret: '' }];

            mockGetDBConnection.mockResolvedValue({
                all: jest.fn().mockResolvedValue(mockWebhook),
                run: jest.fn(),
                get: jest.fn(),
                close: jest.fn(),
                exec: jest.fn()
            });

            mockAxios.post.mockRejectedValue({
                response: {
                    status: 500,
                    data: 'Internal Server Error'
                }
            });

            await triggerWebhooks(eventType, mockIssueData);

            expect(mockAxios.post).toHaveBeenCalledTimes(4); // 1 initial call + 3 retries
        });

        it('should handle no webhooks registered for the event type', async () => {
            const eventType = 'issue_created';

            mockGetDBConnection.mockResolvedValue({
                all: jest.fn().mockResolvedValue([]), // No webhooks returned
                run: jest.fn(),
                get: jest.fn(),
                close: jest.fn(),
                exec: jest.fn()
            });

            await triggerWebhooks(eventType, mockIssueData);

            expect(mockAxios.post).not.toHaveBeenCalled(); // Ensure no webhooks are called
        });

        it('should handle errors during fetching webhooks from the database', async () => {
            const eventType = 'issue_created';
            const dbError = new Error('Database error');

            mockGetDBConnection.mockRejectedValue(dbError);

            await triggerWebhooks(eventType, mockIssueData);

            // Expect no axios calls to have happened.
            expect(mockAxios.post).not.toHaveBeenCalled();
        });

         it('should not trigger webhooks if event is a substring of the registered event', async () => {
            const eventType = 'issue';
            const mockWebhooks: Webhook[] = [
                { id: 1, url: 'http://example.com/webhook1', events: ['issue_created'], secret: '' },
            ];

            mockGetDBConnection.mockResolvedValue({
                all: jest.fn().mockResolvedValue(mockWebhooks),
                run: jest.fn(),
                get: jest.fn(),
                close: jest.fn(),
                exec: jest.fn()
            });

            mockAxios.post.mockResolvedValue({ status: 200 });

            await triggerWebhooks(eventType, mockIssueData);

            expect(mockAxios.post).not.toHaveBeenCalled();
        });
    });
});