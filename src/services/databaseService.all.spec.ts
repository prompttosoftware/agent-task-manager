// src/services/databaseService.all.spec.ts

import { DatabaseService } from './databaseService';
import { IDatabaseConnection } from '../config/db';
import { mockVerbose } from '../mocks/sqlite3.mock';
import { jest } from '@jest/globals';
import { MockedObject } from 'jest-mock';

describe('DatabaseService.all', () => {
    let databaseService: DatabaseService;
    let mockDb: MockedObject<IDatabaseConnection>;

    beforeEach(async () => {
        const mockSqlite3 = mockVerbose();
        const MockNativeDatabase = mockSqlite3.Database;
        mockDb = new MockNativeDatabase(':memory:') as any;

        databaseService = new DatabaseService();
        await databaseService.connect(mockDb); // Inject mockDb

        jest.clearAllMocks();
    });

    it('should call db.all with the provided SQL and params', async () => {
        // Arrange
        const sql = 'SELECT * FROM test';
        const params: any[] = [];
        const expectedResult = [{ id: 1, value: 'testValue1' }, { id: 2, value: 'testValue2' }];

        mockDb.all = jest.fn((sql: string, params: any[], callback: (err: Error | null, rows?: any[]) => void) => {
            callback(null, expectedResult);
        }) as any;

        // Act
        const result = await databaseService.all(sql, params);

        // Assert
        expect(mockDb.all).toHaveBeenCalledTimes(1);
        expect(mockDb.all).toHaveBeenCalledWith(sql, params, expect.any(Function));
        expect(result).toBe(expectedResult);
    });

    it('should return an empty array if db.all finds no rows', async () => {
        // Arrange
        const sql = 'SELECT * FROM test WHERE id = ?';
        const params = [99];
        mockDb.all = jest.fn((sql: string, params: any[], callback: (err: Error | null, rows?: any[]) => void) => {
            callback(null, []);
        }) as any;

        // Act
        const result = await databaseService.all(sql, params);

        // Assert
        expect(mockDb.all).toHaveBeenCalledTimes(1);
        expect(mockDb.all).toHaveBeenCalledWith(sql, params, expect.any(Function));
        expect(result).toEqual([]);
    });

    it('should throw an error if db.all rejects', async () => {
        // Arrange
        const sql = 'SELECT * FROM test WHERE id = ?';
        const params = [1];
        const expectedError = new Error('Database query failed');

        mockDb.all = jest.fn((sql: string, params: any[], callback: (err: Error | null, rows?: any[]) => void) => {
            callback(expectedError, undefined);
        }) as any;

        // Act & Assert
        await expect(databaseService.all(sql, params)).rejects.toThrow(expectedError);
        expect(mockDb.all).toHaveBeenCalledTimes(1);
        expect(mockDb.all).toHaveBeenCalledWith(sql, params, expect.any(Function));
    });
});