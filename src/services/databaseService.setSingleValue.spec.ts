// src/services/databaseService.setSingleValue.spec.ts

import { DatabaseService } from './databaseService';
import { getDBConnection, IDatabaseConnection } from '../config/db';
import { createMockDbConnection, mockNativeRun } from '../mocks/sqlite3.mock';
import { jest } from '@jest/globals';

// Mock the module that provides the connection
jest.mock('../config/db', () => ({
    ...jest.requireActual('../config/db'), // Keep actual parts if needed
    getDBConnection: jest.fn(), // Mock the function that returns the connection
    closeDBConnection: jest.fn().mockResolvedValue(undefined),
}));

// Type assertion for the mocked function
const mockGetDBConnection = getDBConnection as jest.Mock;

describe('DatabaseService.setSingleValue', () => {
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

    it('should call db.run with the correct SQL and parameters', async () => {
        // Arrange
        const tableName = 'settings';
        const key = 'theme';
        const value = 'dark';
        const expectedSql = `INSERT OR REPLACE INTO ${tableName} (key, value) VALUES (?, ?)`;
        const expectedParams = [key, value];

        // Act
        await databaseService.setSingleValue(tableName, key, value);

        // Assert
        expect(mockGetDBConnection).toHaveBeenCalledTimes(1);
        expect(mockDb.run).toHaveBeenCalledTimes(1);
        expect(mockDb.run).toHaveBeenCalledWith(expectedSql, expectedParams);
    });

    it('should handle errors from db.run', async () => {
        // Arrange
        const tableName = 'settings';
        const key = 'theme';
        const value = 'dark';
        const expectedError = new Error('Database error');
        mockDb.run.mockRejectedValue(expectedError);

        // Act & Assert
        await expect(databaseService.setSingleValue(tableName, key, value)).rejects.toThrow(expectedError);
        expect(mockGetDBConnection).toHaveBeenCalledTimes(1);
        expect(mockDb.run).toHaveBeenCalledTimes(1);
    });

    // Add a test case that mocks the native db object to check for this.changes, since
    // the *current* implementation of DatabaseService.setSingleValue incorrectly relies on it.
    it('should handle changes being zero', async () => {
        const tableName = 'settings';
        const key = 'theme';
        const value = 'dark';


        const mockNativeDb = {
            run: mockNativeRun,
            get: jest.fn(),
            all: jest.fn(),
            close: jest.fn(),
            on: jest.fn(),
        }

        mockNativeRun.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
            // Simulate success, but with changes: 0
            callback.call({ lastID: 1, changes: 0 }, null);
        });

        mockGetDBConnection.mockImplementationOnce(() => {
          return {
            run: jest.fn().mockImplementation((sql: string, params: any[]) => {
                return new Promise<void>((resolve, reject) => {
                    mockNativeDb.run(sql, params, (err: Error | null) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            }),
            get: jest.fn(),
            all: jest.fn(),
            close: jest.fn(),
            getNativeDriver: jest.fn().mockReturnValue(mockNativeDb)
          }
        });

        // Act
        await databaseService.setSingleValue(tableName, key, value);

        // Assert
        expect(mockGetDBConnection).toHaveBeenCalledTimes(1);
        expect(mockNativeRun).toHaveBeenCalledTimes(1);
    });
});