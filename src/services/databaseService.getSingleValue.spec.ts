// src/services/databaseService.getSingleValue.spec.ts

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

describe('DatabaseService.getSingleValue', () => {
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

    it('should call db.get with the correct SQL and parameters', async () => {
        // Arrange
        const tableName = 'settings';
        const key = 'theme';
        const expectedSql = `SELECT value FROM ${tableName} WHERE key = ?`;
        const expectedParams = [key];
        const mockResult = { value: 'dark' };
        mockDb.get.mockResolvedValue(mockResult);

        // Act
        const result = await databaseService.getSingleValue(tableName, key);

        // Assert
        expect(mockGetDBConnection).toHaveBeenCalledTimes(1);
        expect(mockDb.get).toHaveBeenCalledTimes(1);
        expect(mockDb.get).toHaveBeenCalledWith(expectedSql, expectedParams);
        expect(result).toBe(mockResult.value);
    });

    it('should return undefined if no value is found', async () => {
        // Arrange
        const tableName = 'settings';
        const key = 'nonExistentKey';
        mockDb.get.mockResolvedValue(undefined);

        // Act
        const result = await databaseService.getSingleValue(tableName, key);

        // Assert
        expect(mockGetDBConnection).toHaveBeenCalledTimes(1);
        expect(mockDb.get).toHaveBeenCalledTimes(1);
        expect(result).toBeUndefined();
    });

    it('should handle errors from db.get', async () => {
        // Arrange
        const tableName = 'settings';
        const key = 'theme';
        const expectedError = new Error('Database error');
        mockDb.get.mockRejectedValue(expectedError);

        // Act & Assert
        await expect(databaseService.getSingleValue(tableName, key)).rejects.toThrow(expectedError);
        expect(mockGetDBConnection).toHaveBeenCalledTimes(1);
        expect(mockDb.get).toHaveBeenCalledTimes(1);
    });
});