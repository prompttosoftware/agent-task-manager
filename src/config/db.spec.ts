import { getDBConnection } from './db';
import sqlite3 from 'sqlite3';

jest.mock('sqlite3', () => {
    const mockDatabase = {
        run: jest.fn().mockReturnThis(),
        get: jest.fn(),
        all: jest.fn(),
        close: jest.fn((callback: (err: Error | null) => void) => {
            callback(null);
        }),
    };

    const MockDatabaseConstructor = jest.fn().mockImplementation((filename: string, callback: (err: Error | null) => void) => {
        if (filename === './error.db') {
            callback(new Error('Failed to connect'));
        } else {
            callback(null);
        }
        return mockDatabase;
    });

    return {
        Database: MockDatabaseConstructor,
        OPEN_READWRITE: 1,
        OPEN_CREATE: 2,
    };
});

// Mock the database file path
jest.mock('./db', () => {
    const originalModule = jest.requireActual('./db');

    return {
        ...originalModule,
        __esModule: true,
        getDBConnection: jest.fn(async () => {
            const sqlite3Module = require('sqlite3');
            return new Promise((resolve, reject) => {
                const db = new sqlite3Module.Database('./database.db', (err: Error | null) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(db);
                    }
                });
            });
        }),
    };
});

describe('Database Connection', () => {
    let MockDatabaseConstructor: jest.Mock;
    let mockDatabase: any;
    let getDBConnectionMock: jest.Mock;

    beforeEach(() => {
        const sqlite3Module = sqlite3 as any;
        MockDatabaseConstructor = sqlite3Module.Database as jest.Mock;
        mockDatabase = {
            run: jest.fn().mockReturnThis(),
            get: jest.fn(),
            all: jest.fn(),
            close: jest.fn((callback: (err: Error | null) => void) => {
                callback(null);
            }),
        };

        MockDatabaseConstructor.mockImplementation((filename: string, callback: (err: Error | null) => void) => {
            if (filename === './error.db') {
                callback(new Error('Failed to connect'));
            } else {
                callback(null);
            }
            return mockDatabase;
        });

        getDBConnectionMock = (getDBConnection as jest.Mock);
        getDBConnectionMock.mockClear();
        MockDatabaseConstructor.mockClear();
    });

    it('should establish a database connection successfully', async () => {
        getDBConnectionMock.mockImplementation(async () => {
            return new Promise((resolve) => {
                resolve(mockDatabase);
            });
        });

        const db = await getDBConnection();
        expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
        expect(MockDatabaseConstructor).toHaveBeenCalledWith('./database.db', expect.any(Function));
        expect(db).toBe(mockDatabase);
    });

    it('should return the existing database connection if it already exists', async () => {
        let callCount = 0;
        getDBConnectionMock.mockImplementation(async () => {
            callCount++;
            return new Promise((resolve) => {
                resolve(mockDatabase);
            });
        });
        const db1 = await getDBConnection();
        const db2 = await getDBConnection();

        expect(getDBConnectionMock).toHaveBeenCalledTimes(2);
        expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
        expect(db1).toBe(mockDatabase);
        expect(db2).toBe(mockDatabase);
    });

    it('should handle database connection errors', async () => {
        MockDatabaseConstructor.mockImplementationOnce((filename: string, callback: (err: Error | null) => void) => {
            callback(new Error('Failed to connect to the database'));
            return mockDatabase;
        });

        getDBConnectionMock.mockImplementationOnce(async () => {
            return new Promise((_, reject) => {
                reject(new Error('Failed to connect to the database'));
            });
        });

        await expect(getDBConnection()).rejects.toThrow('Failed to connect to the database');
        expect(MockDatabaseConstructor).toHaveBeenCalledWith('./database.db', expect.any(Function));
    });
});