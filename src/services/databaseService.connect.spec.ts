// src/services/databaseService.connect.spec.ts

import { DatabaseService } from './databaseService';
import { getDBConnection, IDatabaseConnection } from '../config/db';
import { createMockDbConnection } from '../mocks/sqlite3.mock';
import { jest } from '@jest/globals';

// Mock the module that provides the connection
jest.mock('../config/db', () => ({
    ...jest.requireActual('../config/db'), // Keep actual parts if needed
    getDBConnection: jest.fn(), // Mock the function that returns the connection
    closeDBConnection: jest.fn().mockResolvedValue(undefined),
}));

// Type assertion for the mocked function
const mockGetDBConnection = getDBConnection as jest.Mock;

describe('DatabaseService.connect', () => {
    let databaseService: DatabaseService;
    let mockDb: jest.Mocked<IDatabaseConnection>;

    beforeEach(() => {
        // Create a fresh mock for IDatabaseConnection
        mockDb = createMockDbConnection();

        // Configure getDBConnection to return this mock
        mockGetDBConnection.mockResolvedValue(mockDb);

        databaseService = new DatabaseService();

        // Reset mocks before test
        jest.clearAllMocks();
        // Reconfigure getDBConnection for the connect call
        mockGetDBConnection.mockResolvedValue(mockDb);
    });

    it('should call getDBConnection and ensureTableExists during connect', async () => {
        // Arrange
        const ensureTableExistsSpy = jest.spyOn(databaseService, 'ensureTableExists');

        // Act
        await databaseService.connect();

        // Assert
        expect(mockGetDBConnection).toHaveBeenCalledTimes(1);
        expect(ensureTableExistsSpy).toHaveBeenCalledTimes(4);
        expect(ensureTableExistsSpy).toHaveBeenCalledWith('settings', expect.any(String));
        expect(ensureTableExistsSpy).toHaveBeenCalledWith('issues', expect.any(String));
        expect(ensureTableExistsSpy).toHaveBeenCalledWith('issue_links', expect.any(String));
        expect(ensureTableExistsSpy).toHaveBeenCalledWith('webhooks', expect.any(String));
    });
});