import { createWebhook } from './webhookService';
import { getDBConnection } from '../config/db';

jest.mock('../config/db', () => ({
    getDBConnection: jest.fn()
}));

describe('webhookService', () => {
    let mockGetDBConnection: jest.Mock;

    beforeEach(() => {
        mockGetDBConnection = jest.mocked(getDBConnection);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a new webhook', async () => {
        const webhookData = { url: 'http://example.com/new', events: 'issue.created' };
        const mockContext = { lastID: 0 }; // Define context object
        const mockRun = jest.fn().mockImplementation(function(sql, params, callback) {
          // Simulate sqlite3 setting lastID on the context object
          mockContext.lastID = 1; // Set the ID here
          // Call the original callback with the mock context as 'this'
          callback.call(mockContext, null);
        });
        mockGetDBConnection.mockResolvedValue({ run: mockRun });

        const result = await createWebhook(webhookData);

        expect(mockRun).toHaveBeenCalledWith(expect.any(String), [webhookData.url, webhookData.events], expect.any(Function));
        expect(result).toEqual({ id: 1, url: webhookData.url, events: webhookData.events });
    });

    it('should handle errors during webhook creation', async () => {
        const webhookData = { url: 'http://example.com/new', events: 'issue.created' };
        mockGetDBConnection.mockRejectedValue(new Error('Database error'));

        await expect(createWebhook(webhookData)).rejects.toThrow('Database error');
    });
});