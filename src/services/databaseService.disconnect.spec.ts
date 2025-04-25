// src/services/databaseService.disconnect.spec.ts

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

describe('DatabaseService.disconnect', () => {
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

    it('should call closeDBConnection during disconnect', async () => {
        // Arrange
        const closeDBConnectionMock = jest.fn().mockResolvedValue(undefined);
        jest.mock('../config/db', () => ({
            ...jest.requireActual('../config/db'),
            getDBConnection: jest.fn().mockResolvedValue(mockDb),
            closeDBConnection: closeDBConnectionMock
        }));

        const { closeDBConnection } = require('../config/db');
        const databaseService = new DatabaseService();
        await databaseService.connect();

        // Act
        await databaseService.disconnect();

        // Assert
        expect(closeDBConnection).toHaveBeenCalledTimes(1);
    });
});