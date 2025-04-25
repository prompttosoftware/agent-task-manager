// src/services/databaseService.beginTransaction.spec.ts

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

describe('DatabaseService.beginTransaction', () => {
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
        // Reconfigure getDBConnection for the implicit connect call
        mockGetDBConnection.mockResolvedValue(mockDb);
    });

    it('should call db.run with BEGIN TRANSACTION', async () => {
        // Arrange
        const expectedSql = 'BEGIN TRANSACTION';

        // Act
        await databaseService.beginTransaction();

        // Assert
        expect(mockGetDBConnection).toHaveBeenCalledTimes(1);
        expect(mockDb.run).toHaveBeenCalledTimes(1);
        expect(mockDb.run).toHaveBeenCalledWith(expectedSql);
    });

    it('should handle errors from db.run', async () => {
        // Arrange
        const expectedError = new Error('Database error');
        mockDb.run.mockRejectedValue(expectedError);

        // Act & Assert
        await expect(databaseService.beginTransaction()).rejects.toThrow(expectedError);
        expect(mockGetDBConnection).toHaveBeenCalledTimes(1);
        expect(mockDb.run).toHaveBeenCalledTimes(1);
    });
});