// src/services/databaseService.all.spec.ts

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

describe('DatabaseService.all', () => {
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

    it('should call db.all with the provided SQL and params', async () => {
        // Arrange
        const sql = 'SELECT * FROM test';
        const params: any[] = [];
        const expectedResult = [{ id: 1, value: 'testValue1' }, { id: 2, value: 'testValue2' }];
        mockDb.all.mockResolvedValue(expectedResult); // Configure mock result

        // Act
        const result = await databaseService.all(sql, params);

        // Assert
        expect(mockGetDBConnection).toHaveBeenCalledTimes(1);
        expect(mockDb.all).toHaveBeenCalledTimes(1);
        expect(mockDb.all).toHaveBeenCalledWith(sql, params);
        expect(result).toBe(expectedResult);
    });

    it('should return an empty array if db.all finds no rows', async () => {
        // Arrange
        const sql = 'SELECT * FROM test WHERE id = ?';
        const params = [99];
        mockDb.all.mockResolvedValue([]); // Configure mock result (not found)

        // Act
        const result = await databaseService.all(sql, params);

        // Assert
        expect(mockGetDBConnection).toHaveBeenCalledTimes(1);
        expect(mockDb.all).toHaveBeenCalledTimes(1);
        expect(mockDb.all).toHaveBeenCalledWith(sql, params);
        expect(result).toEqual([]);
    });

    it('should throw an error if db.all rejects', async () => {
        // Arrange
        const sql = 'SELECT * FROM test WHERE id = ?';
        const params = [1];
        const expectedError = new Error('Database query failed');
        mockDb.all.mockRejectedValue(expectedError); // Configure mock to reject

        // Act & Assert
        await expect(databaseService.all(sql, params)).rejects.toThrow(expectedError);
        expect(mockGetDBConnection).toHaveBeenCalledTimes(1);
        expect(mockDb.all).toHaveBeenCalledTimes(1);
        expect(mockDb.all).toHaveBeenCalledWith(sql, params);
    });
});