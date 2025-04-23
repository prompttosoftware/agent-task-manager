import { DatabaseService } from "./databaseService";
import sqlite3 from 'sqlite3';
import { Mock } from 'jest-mock';

jest.mock('sqlite3', () => {
    const mockDatabase = {
        run: jest.fn(),
        get: jest.fn(),
        all: jest.fn(),
        close: jest.fn(),
    };

    return {
        Database: jest.fn(() => mockDatabase),
        OPEN_READWRITE: 1,
        OPEN_CREATE: 2,
    };
});

jest.mock('../config/db', () => ({
    getDBConnection: jest.fn(() => {
        const mockedSqlite3 = sqlite3 as jest.Mocked<typeof sqlite3>;
        return Promise.resolve(new mockedSqlite3.Database(':memory:'));
    }),
}));

describe('DatabaseService', () => {
    let dbService: DatabaseService;
    const mockedSqlite3 = sqlite3 as jest.Mocked<typeof sqlite3>;
    let mockDb: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        dbService = new DatabaseService();
        await dbService.connect();
        mockDb = ((mockedSqlite3.Database as unknown) as Mock<any>).mock.instances[0];
    });

    afterEach(async () => {
        await dbService.disconnect();
    });

    describe('connect', () => {
        it('should connect to the database', async () => {
            expect(mockedSqlite3.Database).toHaveBeenCalled();
        });

        it('should reject if the connection fails', async () => {
            (mockedSqlite3.Database as jest.Mock).mockImplementationOnce(() => {
                throw new Error('Connection failed');
            });

            const newDbService = new DatabaseService();
            await expect(newDbService.connect()).rejects.toThrow('Connection failed');
        });
    });

    describe('disconnect', () => {
        it('should disconnect from the database', async () => {
            mockDb.close.mockImplementation((callback: (err: Error | null) => void) => {
                callback(null);
            });
            await dbService.disconnect();
            expect(mockDb.close).toHaveBeenCalled();
        });

        it('should handle errors when disconnecting', async () => {
            mockDb.close.mockImplementation((callback: (err: Error | null) => void) => {
                callback(new Error('Disconnection failed'));
            });

            await expect(dbService.disconnect()).rejects.toThrow('Disconnection failed');
        });

        it('should not try to disconnect if not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null; // Simulate not connected
            await newDbService.disconnect();
            expect(mockDb.close).not.toHaveBeenCalled();
        });
    });

    describe('run', () => {
        it('should run SQL queries', async () => {
            mockDb.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                callback(null);
            });
            await dbService.run('SELECT * FROM users');
            expect(mockDb.run).toHaveBeenCalledWith('SELECT * FROM users', [], expect.any(Function));
        });

        it('should handle errors when running SQL queries', async () => {
            mockDb.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                callback(new Error('Query failed'));
            });

            await expect(dbService.run('SELECT * FROM users')).rejects.toThrow('Query failed');
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null;
            await expect(newDbService.run('SELECT * FROM users')).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('get', () => {
        it('should get a single row from the database', async () => {
            const mockRow = { id: 1, name: 'Test User' };
            mockDb.get.mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
                callback(null, mockRow);
            });

            const result = await dbService.get<{ id: number, name: string }>('SELECT * FROM users WHERE id = ?', [1]);
            expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [1], expect.any(Function));
            expect(result).toEqual(mockRow);
        });

        it('should handle errors when getting a single row', async () => {
            mockDb.get.mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
                callback(new Error('Query failed'), null);
            });

            await expect(dbService.get<{ id: number, name: string }>('SELECT * FROM users WHERE id = ?', [1])).rejects.toThrow('Query failed');
        });

        it('should return undefined if no row is found', async () => {
            mockDb.get.mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
                callback(null, undefined);
            });

            const result = await dbService.get<{ id: number, name: string }>('SELECT * FROM users WHERE id = ?', [1]);
            expect(result).toBeUndefined();
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null;
            await expect(newDbService.get<{ id: number, name: string }>('SELECT * FROM users WHERE id = ?', [1])).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('all', () => {
        it('should get all rows from the database', async () => {
            const mockRows = [{ id: 1, name: 'Test User' }, { id: 2, name: 'Another User' }];
            mockDb.all.mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
                callback(null, mockRows);
            });

            const result = await dbService.all<{ id: number, name: string }>('SELECT * FROM users');
            expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM users', [], expect.any(Function));
            expect(result).toEqual(mockRows);
        });

        it('should handle errors when getting all rows', async () => {
            mockDb.all.mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
                callback(new Error('Query failed'), null);
            });

            await expect(dbService.all<{ id: number, name: string }>('SELECT * FROM users')).rejects.toThrow('Query failed');
        });

        it('should return an empty array if no rows are found', async () => {
            mockDb.all.mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
                callback(null, []);
            });

            const result = await dbService.all<{ id: number, name: string }>('SELECT * FROM users');
            expect(result).toEqual([]);
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null;
            await expect(newDbService.all<{ id: number, name: string }>('SELECT * FROM users')).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('ensureTableExists', () => {
        it('should ensure a table exists', async () => {
            mockDb.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                callback(null);
            });

            await dbService.ensureTableExists('users', [{ column: 'id', type: 'INTEGER PRIMARY KEY' }, { column: 'name', type: 'TEXT' }]);
            expect(mockDb.run).toHaveBeenCalledWith('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)', [], expect.any(Function));
        });

        it('should handle errors when ensuring a table exists', async () => {
            mockDb.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                callback(new Error('Query failed'));
            });

            await expect(dbService.ensureTableExists('users', [{ column: 'id', type: 'INTEGER PRIMARY KEY' }, { column: 'name', type: 'TEXT' }])).rejects.toThrow('Query failed');
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null;
            await expect(newDbService.ensureTableExists('users', [{ column: 'id', type: 'INTEGER PRIMARY KEY' }, { column: 'name', type: 'TEXT' }])).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('getSingleValue', () => {
        it('should get a single value from a table', async () => {
            mockDb.get.mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
                callback(null, { value: 'test_value' });
            });

            const result = await dbService.getSingleValue<string>('settings', 'test_key');
            expect(mockDb.get).toHaveBeenCalledWith('SELECT value FROM settings WHERE key = ?', ['test_key'], expect.any(Function));
            expect(result).toBe('test_value');
        });

        it('should return undefined if no value is found', async () => {
            mockDb.get.mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
                callback(null, undefined);
            });

            const result = await dbService.getSingleValue<string>('settings', 'test_key');
            expect(result).toBeUndefined();
        });

        it('should handle errors when getting a single value', async () => {
            mockDb.get.mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
                callback(new Error('Query failed'), null);
            });

            await expect(dbService.getSingleValue<string>('settings', 'test_key')).rejects.toThrow('Query failed');
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null;
            await expect(newDbService.getSingleValue<string>('settings', 'test_key')).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('setSingleValue', () => {
        it('should update an existing value', async () => {
            mockDb.run.mockImplementation(function(this: any, sql: string, params: any[], callback: (err: Error | null) => void) {
                (this as any).changes = 1; // Simulate an update
                callback(null);
            });

            await dbService.setSingleValue<string>('settings', 'test_key', 'new_test_value');

            expect(mockDb.run).toHaveBeenCalledWith('UPDATE settings SET value = ? WHERE key = ?', ['new_test_value', 'test_key'], expect.any(Function));
            expect(mockDb.run).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO'), expect.anything(), expect.any(Function));
        });

        it('should insert a new value if it does not exist', async () => {
            mockDb.run.mockImplementation(function(this: any, sql: string, params: any[], callback: (err: Error | null) => void) {
                (this as any).changes = 0; // Simulate no update
                callback(null);
            });

            await dbService.setSingleValue<string>('settings', 'test_key', 'new_test_value');

            expect(mockDb.run).toHaveBeenCalledWith('UPDATE settings SET value = ? WHERE key = ?', ['new_test_value', 'test_key'], expect.any(Function));
            expect(mockDb.run).toHaveBeenCalledWith('INSERT INTO settings (key, value) VALUES (?, ?)', ['test_key', 'new_test_value'], expect.any(Function));
        });

        it('should handle errors when updating or inserting a value', async () => {
            mockDb.run.mockImplementation(function(this: any, sql: string, params: any[], callback: (err: Error | null) => void) {
                callback(new Error('Query failed'));
            });

            await expect(dbService.setSingleValue<string>('settings', 'test_key', 'new_test_value')).rejects.toThrow('Query failed');
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null;
            await expect(newDbService.setSingleValue<string>('settings', 'test_key', 'new_test_value')).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('beginTransaction', () => {
        it('should begin a transaction', async () => {
            mockDb.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                callback(null);
            });

            await dbService.beginTransaction();
            expect(mockDb.run).toHaveBeenCalledWith('BEGIN TRANSACTION', [], expect.any(Function));
        });

        it('should handle errors when beginning a transaction', async () => {
            mockDb.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                callback(new Error('Query failed'));
            });

            await expect(dbService.beginTransaction()).rejects.toThrow('Query failed');
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null;
            await expect(newDbService.beginTransaction()).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('commitTransaction', () => {
        it('should commit a transaction', async () => {
            mockDb.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                callback(null);
            });

            await dbService.commitTransaction();
            expect(mockDb.run).toHaveBeenCalledWith('COMMIT TRANSACTION', [], expect.any(Function));
        });

        it('should handle errors when committing a transaction', async () => {
            mockDb.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                callback(new Error('Query failed'));
            });

            await expect(dbService.commitTransaction()).rejects.toThrow('Query failed');
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null;
            await expect(newDbService.commitTransaction()).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });

    describe('rollbackTransaction', () => {
        it('should rollback a transaction', async () => {
            mockDb.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                callback(null);
            });

            await dbService.rollbackTransaction();
            expect(mockDb.run).toHaveBeenCalledWith('ROLLBACK TRANSACTION', [], expect.any(Function));
        });

        it('should handle errors when rolling back a transaction', async () => {
            mockDb.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                callback(new Error('Query failed'));
            });

            await expect(dbService.rollbackTransaction()).rejects.toThrow('Query failed');
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null;
            await expect(newDbService.rollbackTransaction()).rejects.toThrow('Database not connected. Call connect() first.');
        });
    });
});