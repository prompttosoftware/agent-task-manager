import { createWebhook } from './webhookService';
import { getDBConnection } from '../config/db';

// Mock the database connection module
jest.mock('../config/db', () => ({
    getDBConnection: jest.fn()
}));

describe('webhookService', () => {
    // Declare the mockGetDBConnection variable with its mock type
    let mockGetDBConnection: jest.Mock;

    beforeEach(() => {
        // Assign the mocked function to the variable before each test
        mockGetDBConnection = jest.mocked(getDBConnection);
    });

    afterEach(() => {
        // Clear all mock states after each test
        jest.clearAllMocks();
    });

    it('should create a new webhook', async () => {
        const webhookData = { url: 'http://example.com/new', events: 'issue.created' };

        // Define the mock RunResult object that the promise should resolve with
        const mockRunResult = { lastID: 1, changes: 1 };

        // Create the mock 'run' function. It should return a Promise that resolves
        // with an object containing the lastID and changes properties, mimicking
        // the behavior of the promisified db.run method.
        const mockRun = jest.fn().mockResolvedValue(mockRunResult);

        // Configure the mock getDBConnection to return an object containing the mock 'run' function
        mockGetDBConnection.mockResolvedValue({
            run: mockRun,
            // Add other methods if needed by other service functions, e.g., all, get
            all: jest.fn(),
            get: jest.fn(),
            close: jest.fn(),
            exec: jest.fn()
        });

        // Call the function under test
        const result = await createWebhook(webhookData);

        // Assert that the mock 'run' function was called with the correct SQL and parameters
        // MODIFIED: Pass individual arguments instead of an array
        expect(mockRun).toHaveBeenCalledWith(expect.any(String), webhookData.url, webhookData.events);
        // Assert that the result matches the expected webhook object, using the lastID from the mock result
        expect(result).toEqual({ id: mockRunResult.lastID, url: webhookData.url, events: webhookData.events });
    });

    it('should handle errors during webhook creation', async () => {
        const webhookData = { url: 'http://example.com/new', events: 'issue.created' };
        // Configure the mock getDBConnection to reject with an error
        const dbError = new Error('Database error');
        mockGetDBConnection.mockRejectedValue(dbError);

        // Assert that calling createWebhook rejects with the expected error
        await expect(createWebhook(webhookData)).rejects.toThrow('Database error');
    });

    // Add more tests for other functions like deleteWebhook and triggerWebhooks if needed
});