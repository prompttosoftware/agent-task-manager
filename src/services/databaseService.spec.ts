import { DatabaseService } from "./databaseService";
import sqlite3 from 'sqlite3';
// Removed unused Mock import: import { Mock } from 'jest-mock';

// Mock the sqlite3 module
jest.mock('sqlite3', () => {
    // Create mock implementations for the Database methods
    const mockDatabase = {
        run: jest.fn(),
        get: jest.fn(),
        all: jest.fn(),
        close: jest.fn(),
        // Add changes property for setSingleValue tests
        changes: 0, // Initialize changes property
    };

    // Create a mock constructor for the Database class
    // Ensure the constructor returns the mockDatabase instance
    const MockDatabaseConstructor = jest.fn(() => mockDatabase);

    // Return the mocked module structure
    return {
        Database: MockDatabaseConstructor,
        OPEN_READWRITE: 1, // Example constants, adjust if needed
        OPEN_CREATE: 2,    // Example constants, adjust if needed
        // Ensure verbose is mocked if your code uses it, e.g., verbose: jest.fn()
    };
});

// Mock the database configuration module
jest.mock('../config/db', () => ({
    getDBConnection: jest.fn(() => {
        // Use the mocked sqlite3 Database constructor
        // Cast to 'any' to handle the complex mock type
        const mockedSqlite3 = require('sqlite3') as any;
        // Return a promise resolving to an instance created by the mock constructor
        // Pass required arguments for the constructor if any (e.g., filename)
        return Promise.resolve(new mockedSqlite3.Database(':memory:'));
    }),
}));

describe('DatabaseService', () => {
    let dbService: DatabaseService;
    // Get the mocked sqlite3 module correctly typed (or use 'any' for simplicity)
    // It's often easier to manage the type as 'any' when dealing with complex Jest mock structures
    const mockedSqlite3 = require('sqlite3') as any; // Use 'any' for the module mock itself
    let mockDbInstance: any; // To hold the instance returned by the mock constructor

    beforeEach(async () => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        // Reset mock instances array (important for checking calls on specific instances)
        mockedSqlite3.Database.mock.instances = [];

        dbService = new DatabaseService();
        await dbService.connect(); // Connect should trigger getDBConnection -> new mockedSqlite3.Database()

        // Retrieve the instance created by the mock Database constructor
        // The instance holds the mock methods (run, get, all, close)
        // FIX: Use 'as any' instead of 'as jest.Mock'
        const dbConstructorMock = mockedSqlite3.Database as any;
        if (dbConstructorMock.mock.instances.length > 0) {
            // Reset mockDbInstance state (like 'changes') before each test using it
            mockDbInstance = dbConstructorMock.mock.instances[0];
            mockDbInstance.changes = 0; // Reset changes property specifically for setSingleValue tests
            // Ensure method mocks on the instance are also reset if needed, though jest.clearAllMocks should handle this
            mockDbInstance.run.mockClear();
            mockDbInstance.get.mockClear();
            mockDbInstance.all.mockClear();
            mockDbInstance.close.mockClear();
        } else {
            // This case might happen if connect wasn't called or failed in a way that didn't instantiate
            // For safety, let's re-instantiate or throw an error
            console.warn("Mock Database constructor wasn't called as expected in beforeEach. This might indicate an issue in setup or a preceding test failure.");
            // Attempting to create a new instance here might mask the root cause.
            // Throwing an error might be better for debugging setup issues.
            // For now, we'll try to create one to potentially allow following tests to proceed, but logging a warning.
            mockDbInstance = dbConstructorMock(); // Or throw new Error("Mock DB instance not created");
            mockDbInstance.changes = 0; // Reset changes property
        }
    });

    afterEach(async () => {
        // Ensure disconnect is called, but handle potential null db if connect failed setup
        if (dbService['db']) {
            await dbService.disconnect();
        }
        // Reset instances if necessary, though jest.clearAllMocks usually handles this
        // FIX: Use 'as any' instead of 'as jest.Mock'
        (mockedSqlite3.Database as any).mockClear();
        // Also clear instances array if necessary
        (mockedSqlite3.Database as any).mock.instances = [];
    });

    describe('connect', () => {
        it('should connect to the database by calling the constructor', async () => {
            // beforeEach already calls connect, so we just check if the constructor was called
            expect(mockedSqlite3.Database).toHaveBeenCalled();
            // Optionally check arguments if specific ones are expected
            // The filename might differ based on getDBConnection mock, check that if needed
            expect(mockedSqlite3.Database).toHaveBeenCalledWith(':memory:');
        });

        it('should reject if the connection (constructor/getDBConnection) fails', async () => {
             // Reset mocks to ensure clean state for this specific test
            jest.clearAllMocks();
            mockedSqlite3.Database.mock.instances = []; // Clear instances specifically

             // Mock getDBConnection to return a promise that rejects
             const connectionError = new Error('Connection failed');
             (require('../config/db').getDBConnection as jest.Mock).mockRejectedValueOnce(connectionError);

            const newDbService = new DatabaseService();
             // Expect the connect promise to reject with the thrown error
             await expect(newDbService.connect()).rejects.toThrow('Connection failed');
             // Ensure the Database constructor was not called in this case because getDBConnection failed first
             expect(mockedSqlite3.Database).not.toHaveBeenCalled();
        });
    });

    describe('disconnect', () => {
        it('should disconnect from the database', async () => {
            // Ensure mockDbInstance is valid before setting mock implementation
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");

            // Mock the close method on the instance to succeed
            mockDbInstance.close.mockImplementation((callback: (err: Error | null) => void) => {
                callback(null); // Simulate successful close
            });
            await dbService.disconnect();
            expect(mockDbInstance.close).toHaveBeenCalled();
        });

        it('should handle errors when disconnecting', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            // Mock the close method on the instance to fail
            const closeError = new Error('Disconnection failed');
            mockDbInstance.close.mockImplementation((callback: (err: Error | null) => void) => {
                callback(closeError); // Simulate error during close
            });

            await expect(dbService.disconnect()).rejects.toThrow('Disconnection failed');
        });

        it('should not try to disconnect if not connected', async () => {
             // Create a new instance, don't call connect
            const newDbService = new DatabaseService();
            // Directly set db to null to simulate the "not connected" state
            newDbService['db'] = null;
            await newDbService.disconnect(); // Should not throw and not call close

            // FIX: Check the mock constructor directly, not via potentially non-existent instance
            const dbConstructorMock = mockedSqlite3.Database as any;
             // Ensure close was not called on *any* instance that might have been created (there shouldn't be any here)
             dbConstructorMock.mock.instances.forEach((instance: any) => {
                 expect(instance.close).not.toHaveBeenCalled();
             });
             // If mockDbInstance exists from the beforeEach of a previous test (it shouldn't due to clearing), ensure its close wasn't called either
             if(mockDbInstance && mockDbInstance.close) { // Check if mockDbInstance and its close method exist
                 expect(mockDbInstance.close).not.toHaveBeenCalled();
             }
        });
    });

    describe('run', () => {
        it('should run SQL queries', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            // Mock the run method on the instance to succeed
            // Provide 'this' context if the implementation relies on it (though this mock doesn't)
            mockDbInstance.run.mockImplementation(function(this: any, sql: string, params: any[], callback: (err: Error | null) => void) {
                callback(null); // Simulate success
            });
            await dbService.run('SELECT * FROM users');
            expect(mockDbInstance.run).toHaveBeenCalledWith('SELECT * FROM users', [], expect.any(Function));
        });

        it('should handle errors when running SQL queries', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            // Mock the run method on the instance to fail
            const runError = new Error('Query failed');
            mockDbInstance.run.mockImplementation(function(this: any, sql: string, params: any[], callback: (err: Error | null) => void) {
                callback(runError); // Simulate error
            });

            await expect(dbService.run('SELECT * FROM users')).rejects.toThrow('Query failed');
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null; // Simulate not connected
            await expect(newDbService.run('SELECT * FROM users')).rejects.toThrow('Database not connected. Call connect() first.');
            // FIX: Check the mock constructor directly or ensure instance wasn't created/used
            const dbConstructorMock = mockedSqlite3.Database as any;
            dbConstructorMock.mock.instances.forEach((instance: any) => {
                 expect(instance.run).not.toHaveBeenCalled();
             });
             if(mockDbInstance && mockDbInstance.run) {
                 expect(mockDbInstance.run).not.toHaveBeenCalled();
             }
        });
    });

    describe('get', () => {
        it('should get a single row from the database', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            const mockRow = { id: 1, name: 'Test User' };
            // Mock the get method on the instance to return a row
            mockDbInstance.get.mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
                callback(null, mockRow); // Simulate success with data
            });

            const result = await dbService.get<{ id: number, name: string }>('SELECT * FROM users WHERE id = ?', [1]);
            expect(mockDbInstance.get).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [1], expect.any(Function));
            expect(result).toEqual(mockRow);
        });

        it('should handle errors when getting a single row', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            const getError = new Error('Query failed');
            // Mock the get method on the instance to fail
            mockDbInstance.get.mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
                callback(getError, undefined); // Simulate error, result is undefined
            });

            await expect(dbService.get<{ id: number, name: string }>('SELECT * FROM users WHERE id = ?', [1])).rejects.toThrow('Query failed');
        });

        it('should return undefined if no row is found', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            // Mock the get method on the instance to return no row
            mockDbInstance.get.mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
                callback(null, undefined); // Simulate success but no row found
            });

            const result = await dbService.get<{ id: number, name: string }>('SELECT * FROM users WHERE id = ?', [1]);
            expect(result).toBeUndefined();
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null; // Simulate not connected
            await expect(newDbService.get<{ id: number, name: string }>('SELECT * FROM users WHERE id = ?', [1])).rejects.toThrow('Database not connected. Call connect() first.');
             // FIX: Check the mock constructor directly or ensure instance wasn't created/used
             const dbConstructorMock = mockedSqlite3.Database as any;
             dbConstructorMock.mock.instances.forEach((instance: any) => {
                  expect(instance.get).not.toHaveBeenCalled();
              });
              if(mockDbInstance && mockDbInstance.get) {
                  expect(mockDbInstance.get).not.toHaveBeenCalled();
              }
        });
    });

    describe('all', () => {
        it('should get all rows from the database', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            const mockRows = [{ id: 1, name: 'Test User' }, { id: 2, name: 'Another User' }];
            // Mock the all method on the instance to return rows
            mockDbInstance.all.mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
                callback(null, mockRows); // Simulate success with data
            });

            const result = await dbService.all<{ id: number, name: string }>('SELECT * FROM users');
            expect(mockDbInstance.all).toHaveBeenCalledWith('SELECT * FROM users', [], expect.any(Function));
            expect(result).toEqual(mockRows);
        });

        it('should handle errors when getting all rows', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            const allError = new Error('Query failed');
            // Mock the all method on the instance to fail
            mockDbInstance.all.mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
                // FIX: Pass an empty array `[]` instead of `undefined` for the rows array when error occurs
                callback(allError, []);
            });

            await expect(dbService.all<{ id: number, name: string }>('SELECT * FROM users')).rejects.toThrow('Query failed');
        });

        it('should return an empty array if no rows are found', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            // Mock the all method on the instance to return empty array
            mockDbInstance.all.mockImplementation((sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => {
                callback(null, []); // Simulate success with no rows found
            });

            const result = await dbService.all<{ id: number, name: string }>('SELECT * FROM users');
            expect(result).toEqual([]);
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null; // Simulate not connected
            await expect(newDbService.all<{ id: number, name: string }>('SELECT * FROM users')).rejects.toThrow('Database not connected. Call connect() first.');
             // FIX: Check the mock constructor directly or ensure instance wasn't created/used
             const dbConstructorMock = mockedSqlite3.Database as any;
             dbConstructorMock.mock.instances.forEach((instance: any) => {
                  expect(instance.all).not.toHaveBeenCalled();
              });
              if(mockDbInstance && mockDbInstance.all) {
                  expect(mockDbInstance.all).not.toHaveBeenCalled();
              }
        });
    });

    describe('ensureTableExists', () => {
        it('should ensure a table exists', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            mockDbInstance.run.mockImplementation(function(this: any, sql: string, params: any[], callback: (err: Error | null) => void) {
                callback(null); // Simulate success
            });

            await dbService.ensureTableExists('users', [{ column: 'id', type: 'INTEGER PRIMARY KEY' }, { column: 'name', type: 'TEXT' }]);
            expect(mockDbInstance.run).toHaveBeenCalledWith('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)', [], expect.any(Function));
        });

        it('should handle errors when ensuring a table exists', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            const createTableError = new Error('Query failed');
            mockDbInstance.run.mockImplementation(function(this: any, sql: string, params: any[], callback: (err: Error | null) => void) {
                // Only fail for the CREATE TABLE statement
                if (sql.startsWith('CREATE TABLE')) {
                   callback(createTableError); // Simulate error
                } else {
                   callback(null);
                }
            });

            await expect(dbService.ensureTableExists('users', [{ column: 'id', type: 'INTEGER PRIMARY KEY' }, { column: 'name', type: 'TEXT' }])).rejects.toThrow('Query failed');
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null; // Simulate not connected
            await expect(newDbService.ensureTableExists('users', [{ column: 'id', type: 'INTEGER PRIMARY KEY' }, { column: 'name', type: 'TEXT' }])).rejects.toThrow('Database not connected. Call connect() first.');
             // FIX: Check the mock constructor directly or ensure instance wasn't created/used
             const dbConstructorMock = mockedSqlite3.Database as any;
             dbConstructorMock.mock.instances.forEach((instance: any) => {
                  expect(instance.run).not.toHaveBeenCalled();
              });
              if(mockDbInstance && mockDbInstance.run) {
                  expect(mockDbInstance.run).not.toHaveBeenCalled();
              }
        });
    });

    describe('getSingleValue', () => {
        it('should get a single value from a table', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            mockDbInstance.get.mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
                callback(null, { value: 'test_value' }); // Simulate success returning the row { value: T }
            });

            const result = await dbService.getSingleValue<string>('settings', 'test_key');
            expect(mockDbInstance.get).toHaveBeenCalledWith('SELECT value FROM settings WHERE key = ?', ['test_key'], expect.any(Function));
            expect(result).toBe('test_value');
        });

        it('should return undefined if no value is found', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            mockDbInstance.get.mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
                callback(null, undefined); // Simulate success but no row found
            });

            const result = await dbService.getSingleValue<string>('settings', 'test_key');
            expect(result).toBeUndefined();
        });

        it('should handle errors when getting a single value', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            const getError = new Error('Query failed');
            mockDbInstance.get.mockImplementation((sql: string, params: any[], callback: (err: Error | null, row: any) => void) => {
                callback(getError, undefined); // Simulate error
            });

            await expect(dbService.getSingleValue<string>('settings', 'test_key')).rejects.toThrow('Query failed');
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null; // Simulate not connected
            await expect(newDbService.getSingleValue<string>('settings', 'test_key')).rejects.toThrow('Database not connected. Call connect() first.');
             // FIX: Check the mock constructor directly or ensure instance wasn't created/used
             const dbConstructorMock = mockedSqlite3.Database as any;
             dbConstructorMock.mock.instances.forEach((instance: any) => {
                  expect(instance.get).not.toHaveBeenCalled();
              });
              if(mockDbInstance && mockDbInstance.get) {
                  expect(mockDbInstance.get).not.toHaveBeenCalled();
              }
        });
    });

    // Note: Testing setSingleValue requires careful mocking of 'run'
    // because the implementation uses 'this.changes' which isn't standard on jest mocks.
    // We need to provide a mock implementation that sets 'mockDbInstance.changes'.
    // The mock instance `mockDbInstance` needs to have the `changes` property.
    describe('setSingleValue', () => {
        beforeEach(() => {
            // Ensure mockDbInstance is valid and reset changes before each setSingleValue test
             if (!mockDbInstance) throw new Error("mockDbInstance is not initialized for setSingleValue tests");
             mockDbInstance.changes = 0;
        });

        it('should update an existing value', async () => {
            // Mock 'run' to simulate an update (changes > 0)
            mockDbInstance.run.mockImplementation(function (this: any, sql: string, params: any[], callback: (err: Error | null) => void) {
                if (sql.startsWith('UPDATE')) {
                    // Simulate 1 row updated by setting changes on the mock instance
                    mockDbInstance.changes = 1; // Use the instance captured in the outer scope
                    callback(null);
                } else {
                    // Should not reach INSERT in this test case
                    callback(new Error('Should have updated, not inserted'));
                }
            });


            await dbService.setSingleValue<string>('settings', 'test_key', 'new_test_value');

            // Check that UPDATE was called
            expect(mockDbInstance.run).toHaveBeenCalledWith(
                'UPDATE settings SET value = ? WHERE key = ?',
                ['new_test_value', 'test_key'],
                expect.any(Function)
            );
             // Verify INSERT was *not* called
             // Check calls excluding the first one (which was UPDATE)
             const insertCalls = mockDbInstance.run.mock.calls.filter((call: any[]) => call[0].startsWith('INSERT'));
             expect(insertCalls.length).toBe(0);
             expect(mockDbInstance.run).toHaveBeenCalledTimes(1); // Only UPDATE should be called
        });

        it('should insert a new value if it does not exist', async () => {
            // Mock 'run' to simulate no update (changes === 0), then handle INSERT
             let updateCalled = false;
             mockDbInstance.run.mockImplementation(function (this: any, sql: string, params: any[], callback: (err: Error | null) => void) {
                 if (sql.startsWith('UPDATE')) {
                     // Simulate 0 rows updated
                     mockDbInstance.changes = 0; // Use the instance captured in the outer scope
                     updateCalled = true;
                     callback(null);
                 } else if (sql.startsWith('INSERT')) {
                     // Ensure UPDATE was called before INSERT
                     expect(updateCalled).toBe(true);
                     callback(null); // Simulate successful insert
                 } else {
                     callback(new Error('Unexpected SQL query'));
                 }
             });

            await dbService.setSingleValue<string>('settings', 'new_key', 'test_value');

             // Check that UPDATE was called first
            expect(mockDbInstance.run).toHaveBeenCalledWith(
                'UPDATE settings SET value = ? WHERE key = ?',
                ['test_value', 'new_key'],
                expect.any(Function)
            );
             // Check that INSERT was called afterwards
            expect(mockDbInstance.run).toHaveBeenCalledWith(
                'INSERT INTO settings (key, value) VALUES (?, ?)',
                ['new_key', 'test_value'],
                expect.any(Function)
            );
            expect(mockDbInstance.run).toHaveBeenCalledTimes(2); // Ensure both UPDATE and INSERT were attempted
        });

        it('should handle errors during the update attempt', async () => {
            const updateError = new Error('Update failed');
             // Mock 'run' to throw an error on UPDATE
             mockDbInstance.run.mockImplementation(function (this: any, sql: string, params: any[], callback: (err: Error | null) => void) {
                 if (sql.startsWith('UPDATE')) {
                     callback(updateError); // Simulate error during update
                 } else {
                    // Don't error here, let the rejection handle it.
                    // Important: do not call callback(null) as that would imply success for other calls.
                 }
             });

            await expect(dbService.setSingleValue<string>('settings', 'test_key', 'value')).rejects.toThrow('Update failed');
            // Ensure UPDATE was called
            expect(mockDbInstance.run).toHaveBeenCalledWith(
                'UPDATE settings SET value = ? WHERE key = ?',
                ['value', 'test_key'],
                expect.any(Function)
            );
            // Ensure INSERT was not called after failed UPDATE
             const insertCalls = mockDbInstance.run.mock.calls.filter((call: any[]) => call[0].startsWith('INSERT'));
             expect(insertCalls.length).toBe(0);
             expect(mockDbInstance.run).toHaveBeenCalledTimes(1); // Only UPDATE should be called
        });

        it('should handle errors during the insert attempt', async () => {
            const insertError = new Error('Insert failed');
             // Mock 'run' for UPDATE (0 changes) and INSERT (error)
             mockDbInstance.run.mockImplementation(function (this: any, sql: string, params: any[], callback: (err: Error | null) => void) {
                 if (sql.startsWith('UPDATE')) {
                     mockDbInstance.changes = 0; // Simulate no update occurred
                     callback(null);
                 } else if (sql.startsWith('INSERT')) {
                     callback(insertError); // Simulate error during insert
                 } else {
                      // Don't error here
                 }
             });


            await expect(dbService.setSingleValue<string>('settings', 'new_key', 'value')).rejects.toThrow('Insert failed');
             // Ensure UPDATE was called
             expect(mockDbInstance.run).toHaveBeenCalledWith(
                 'UPDATE settings SET value = ? WHERE key = ?',
                 ['value', 'new_key'],
                 expect.any(Function)
             );
             // Ensure INSERT was called
             expect(mockDbInstance.run).toHaveBeenCalledWith(
                 'INSERT INTO settings (key, value) VALUES (?, ?)',
                 ['new_key', 'value'],
                 expect.any(Function)
             );
             expect(mockDbInstance.run).toHaveBeenCalledTimes(2); // Both should have been attempted
        });


        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null; // Simulate not connected
            await expect(newDbService.setSingleValue<string>('settings', 'test_key', 'new_test_value')).rejects.toThrow('Database not connected. Call connect() first.');
             // FIX: Check the mock constructor directly or ensure instance wasn't created/used
             const dbConstructorMock = mockedSqlite3.Database as any;
             dbConstructorMock.mock.instances.forEach((instance: any) => {
                  expect(instance.run).not.toHaveBeenCalled();
              });
              if(mockDbInstance && mockDbInstance.run) {
                  expect(mockDbInstance.run).not.toHaveBeenCalled();
              }
        });
    });

    describe('beginTransaction', () => {
        it('should begin a transaction', async () => {
             if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            mockDbInstance.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                expect(sql).toBe('BEGIN TRANSACTION');
                expect(params).toEqual([]);
                callback(null); // Simulate success
            });

            await dbService.beginTransaction();
            expect(mockDbInstance.run).toHaveBeenCalledWith('BEGIN TRANSACTION', [], expect.any(Function));
        });

        it('should handle errors when beginning a transaction', async () => {
             if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            const beginError = new Error('Query failed');
            mockDbInstance.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                if (sql === 'BEGIN TRANSACTION') {
                    callback(beginError); // Simulate error
                } else {
                    callback(null);
                }
            });

            await expect(dbService.beginTransaction()).rejects.toThrow('Query failed');
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null; // Simulate not connected
            await expect(newDbService.beginTransaction()).rejects.toThrow('Database not connected. Call connect() first.');
             // FIX: Check the mock constructor directly or ensure instance wasn't created/used
             const dbConstructorMock = mockedSqlite3.Database as any;
             dbConstructorMock.mock.instances.forEach((instance: any) => {
                  expect(instance.run).not.toHaveBeenCalled();
              });
              if(mockDbInstance && mockDbInstance.run) {
                  expect(mockDbInstance.run).not.toHaveBeenCalled();
              }
        });
    });

    describe('commitTransaction', () => {
        it('should commit a transaction', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
             mockDbInstance.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                expect(sql).toBe('COMMIT TRANSACTION');
                expect(params).toEqual([]);
                callback(null); // Simulate success
            });
            await dbService.commitTransaction();
            expect(mockDbInstance.run).toHaveBeenCalledWith('COMMIT TRANSACTION', [], expect.any(Function));
        });

        it('should handle errors when committing a transaction', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            const commitError = new Error('Query failed');
            mockDbInstance.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                 if (sql === 'COMMIT TRANSACTION') {
                    callback(commitError); // Simulate error
                } else {
                    callback(null);
                }
            });
            await expect(dbService.commitTransaction()).rejects.toThrow('Query failed');
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null; // Simulate not connected
            await expect(newDbService.commitTransaction()).rejects.toThrow('Database not connected. Call connect() first.');
             // FIX: Check the mock constructor directly or ensure instance wasn't created/used
             const dbConstructorMock = mockedSqlite3.Database as any;
             dbConstructorMock.mock.instances.forEach((instance: any) => {
                  expect(instance.run).not.toHaveBeenCalled();
              });
              if(mockDbInstance && mockDbInstance.run) {
                  expect(mockDbInstance.run).not.toHaveBeenCalled();
              }
        });
    });

    describe('rollbackTransaction', () => {
        it('should rollback a transaction', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
             mockDbInstance.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                expect(sql).toBe('ROLLBACK TRANSACTION');
                expect(params).toEqual([]);
                callback(null); // Simulate success
            });
            await dbService.rollbackTransaction();
            expect(mockDbInstance.run).toHaveBeenCalledWith('ROLLBACK TRANSACTION', [], expect.any(Function));
        });

        it('should handle errors when rolling back a transaction', async () => {
            if (!mockDbInstance) throw new Error("mockDbInstance is not initialized");
            const rollbackError = new Error('Query failed');
             mockDbInstance.run.mockImplementation((sql: string, params: any[], callback: (err: Error | null) => void) => {
                 if (sql === 'ROLLBACK TRANSACTION') {
                    callback(rollbackError); // Simulate error
                } else {
                    callback(null);
                }
            });
            await expect(dbService.rollbackTransaction()).rejects.toThrow('Query failed');
        });

        it('should throw an error if the database is not connected', async () => {
            const newDbService = new DatabaseService();
            newDbService['db'] = null; // Simulate not connected
            await expect(newDbService.rollbackTransaction()).rejects.toThrow('Database not connected. Call connect() first.');
             // FIX: Check the mock constructor directly or ensure instance wasn't created/used
             const dbConstructorMock = mockedSqlite3.Database as any;
             dbConstructorMock.mock.instances.forEach((instance: any) => {
                  expect(instance.run).not.toHaveBeenCalled();
              });
              if(mockDbInstance && mockDbInstance.run) {
                  expect(mockDbInstance.run).not.toHaveBeenCalled();
              }
        });
    });
});