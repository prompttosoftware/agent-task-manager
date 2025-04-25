// src/services/databaseService.ensureTableExists.spec.ts

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

describe('DatabaseService.ensureTableExists', () => {
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

    it('should call db.run with the provided SQL', async () => {
        // Arrange
        const tableName = 'test_table';
        const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (id INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT)`;

        // Act
        await databaseService.ensureTableExists(tableName, sql);

        // Assert
        expect(mockGetDBConnection).toHaveBeenCalledTimes(1);
        expect(mockDb.run).toHaveBeenCalledTimes(1);
        expect(mockDb.run).toHaveBeenCalledWith(sql);
    });

    it('should not throw an error if table creation fails', async () => {
        // Arrange
        const tableName = 'test_table';
        const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (id INTEGER PRIMARY KEY AUTOINCREMENT, value TEXT)`;
        mockDb.run.mockRejectedValue(new Error('Table creation failed'));

        // Act & Assert
        await expect(databaseService.ensureTableExists(tableName, sql)).resolves.toBeUndefined();
        expect(mockGetDBConnection).toHaveBeenCalledTimes(1);
        expect(mockDb.run).toHaveBeenCalledTimes(1);
        expect(mockDb.run).toHaveBeenCalledWith(sql);
    });
});