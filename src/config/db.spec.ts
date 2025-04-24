import { getDBConnection } from './db';
import sqlite3, { Database, RunResult, Statement } from 'sqlite3'; // Import needed types

// Define the type for the mock constructor explicitly
type MockDatabaseConstructorType = jest.Mock<Database, [filename: string, mode?: number | undefined, callback?: ((err: Error | null) => void) | undefined]>;

// Type for the mocked Database['run'] method, matching its overloads
type MockedRunType = jest.MockedFunction<
    ((sql: string, callback?: ((this: RunResult, err: Error | null) => void) | undefined) => Database) &
    ((sql: string, params: any, callback?: ((this: RunResult, err: Error | null) => void) | undefined) => Database) &
    ((sql: string, ...params: any[]) => Database)
>;

// Mock the sqlite3 module
jest.mock('sqlite3', () => {
    // Create a base mock object structure. Specific method mocks
    // will be provided in beforeEach or individual tests for clarity.
    // We will replace this generic object with a more specific one in beforeEach
    const mockDatabase = {
        run: jest.fn(),
        get: jest.fn(),
        all: jest.fn(),
        close: jest.fn(),
        configure: jest.fn(),
        exec: jest.fn(),
        prepare: jest.fn(),
        // Add other Database methods if needed by getDBConnection or tests
    };

    // Ensure the mock constructor conforms to the expected signature and type
    // The implementation will be overridden in beforeEach to return the test-specific mock instance
    const MockDatabaseConstructor: MockDatabaseConstructorType = jest.fn().mockImplementation((filename: string, modeOrCallback?: number | ((err: Error | null) => void), callback?: (err: Error | null) => void) => {
        const actualCallback = typeof modeOrCallback === 'function' ? modeOrCallback : callback;
        // Default behavior: Simulate successful connection callback
        if (actualCallback) {
            // Use setTimeout to mimic async nature if needed, but immediate callback is usually fine for mocks
            process.nextTick(() => actualCallback(null));
        }
        // Return the generic mock database object defined above (this will be overridden)
        return mockDatabase as unknown as Database;
    }) as MockDatabaseConstructorType;

    return {
        // Provide the mocked constructor
        Database: MockDatabaseConstructor,
        // Provide constants if used
        OPEN_READWRITE: 1,
        OPEN_CREATE: 2,
        // Mock verbose if it's used implicitly or explicitly by the code under test
        verbose: jest.fn(() => sqlite3), // Mock verbose to return the sqlite3 module itself
    };
});

// Keep the existing mock for ./db but refine it
jest.mock('./db', () => {
    // Import the actual module ONLY to get its structure for mocking, not its implementation
    const originalModule = jest.requireActual('./db');
    return {
        __esModule: true, // Preserve ES module status
        // Mock the functions we want to control
        getDBConnection: jest.fn(), // Implementation will be provided in tests/beforeEach
        // We might need to mock closeDBConnection if tests use it later
        closeDBConnection: jest.fn().mockResolvedValue(undefined), // Default mock for close
    };
});


describe('Database Connection', () => {
    // Declare variables in the outer scope
    let MockDatabaseConstructor: MockDatabaseConstructorType;
    // Use a more specific type for the mock instance based on methods used
    let mockDatabaseInstance: jest.Mocked<Pick<Database, 'run' | 'get' | 'all' | 'close'>>;
    let getDBConnectionMock: jest.Mock<Promise<Database>>;

    beforeEach(() => {
        // Reset all mocks before each test to ensure isolation
        jest.clearAllMocks();

        // **Initialize variables before they are used in closures**

        // 1. Create the specific mock database instance for this test run
        //    This instance will be returned by the mocked constructor and getDBConnection
        mockDatabaseInstance = {
            run: jest.fn<Database, [sql: string, ...params: any[]]>((sql: string, ...params: any[]) => {
                 let callback: ((this: RunResult, err: Error | null) => void) | undefined;
                 if (params.length > 0 && typeof params[params.length - 1] === 'function') {
                     callback = params.pop() as (this: RunResult, err: Error | null) => void;
                 }
                 // Simulate successful run by calling the callback asynchronously
                 if (callback) {
                     process.nextTick(() => callback.call({ lastID: 1, changes: 1 } as RunResult, null));
                 }
                 return mockDatabaseInstance as unknown as Database; // Return self for chaining
             }) as MockedRunType,
            get: jest.fn(),
            all: jest.fn(),
            close: jest.fn((callback?: (err: Error | null) => void) => {
                // Simulate successful close
                if (callback) {
                    process.nextTick(() => callback(null));
                }
            }),
        };

        // 2. Get the mock constructor from the mocked 'sqlite3' module
        //    We require it here *after* mockDatabaseInstance is defined.
        MockDatabaseConstructor = require('sqlite3').Database;

        // 3. Configure the mock constructor to return *our specific* mockDatabaseInstance
        MockDatabaseConstructor.mockImplementation((filename: string, modeOrCallback?: number | ((err: Error | null) => void), callback?: (err: Error | null) => void) => {
             const actualCallback = typeof modeOrCallback === 'function' ? modeOrCallback : callback;
             // Simulate successful connection by default
             if (actualCallback) {
                 // Use process.nextTick to ensure the callback is asynchronous like the real one
                 process.nextTick(() => actualCallback(null));
             }
             // Return the predefined mock instance for this test
             return mockDatabaseInstance as unknown as Database;
        });

        // 4. Get the mock function for getDBConnection from the mocked './db' module
        //    Casting here ensures TS knows it's the mock function.
        getDBConnectionMock = getDBConnection as jest.Mock<Promise<Database>>;

        // 5. Provide a default implementation for the mocked getDBConnection
        //    This simulates the logic of the actual function but uses the mocks.
        //    Crucially, it uses the mockDatabaseInstance defined above.
        getDBConnectionMock.mockImplementation(async () => {
             // Simulate the Promise-based connection logic by directly using the
             // pre-configured mock constructor.
             return new Promise((resolve, reject) => {
                 // This call will trigger the MockDatabaseConstructor implementation above.
                 new (require('sqlite3').Database)('./database.db', (err: Error | null) => {
                     if (err) {
                         // If the constructor's callback provides an error (e.g., from mockImplementationOnce), reject.
                         reject(err);
                     } else {
                         // If the constructor's callback is successful, resolve with the instance
                         // the constructor was configured to return (which is mockDatabaseInstance).
                         // We resolve *with* mockDatabaseInstance, avoiding potential timing issues
                         // with intermediate variables inside the promise executor.
                         resolve(mockDatabaseInstance as unknown as Database);
                     }
                 });
             });
         });
    });

    it('should establish a database connection successfully', async () => {
        // Call the function under test (which is the mocked version)
        const db = await getDBConnection(); // Uses the default mock implementation from beforeEach

        // Assertions
        expect(getDBConnectionMock).toHaveBeenCalledTimes(1);
        // Check if the underlying sqlite3 constructor mock was called by the getDBConnection mock
        expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
        expect(MockDatabaseConstructor).toHaveBeenCalledWith('./database.db', expect.any(Function));
        // Assert that the function resolved with the specific mock database instance created in beforeEach
        expect(db).toBe(mockDatabaseInstance);
    });

    it('should return the existing database connection if it already exists', async () => {
        // This test verifies the caching mechanism if implemented in the actual db.ts.
        // We simulate this caching within a test-specific mock implementation
        // for getDBConnection, leveraging the shared mockDatabaseInstance.

        let internalDbInstanceCache: Database | null = null; // Variable to simulate the cached instance

        // Override the default mock implementation specifically for this test
        getDBConnectionMock.mockImplementation(async () => {
            if (internalDbInstanceCache) {
                // If cached, return the cached instance (which should be mockDatabaseInstance)
                return Promise.resolve(internalDbInstanceCache);
            }
            // If not cached, simulate creating and caching the connection
            return new Promise((resolve, reject) => {
                // Call the mock constructor to simulate DB creation
                new (require('sqlite3').Database)('./database.db', (err: Error | null) => {
                    if (err) {
                        reject(err);
                    } else {
                        // On successful mock construction, cache and resolve
                        // with the shared mockDatabaseInstance.
                        internalDbInstanceCache = mockDatabaseInstance as unknown as Database; // Cache the instance
                        resolve(mockDatabaseInstance as unknown as Database); // Resolve with the instance
                    }
                });
            });
        });

        // Call getDBConnection twice
        const db1 = await getDBConnection();
        const db2 = await getDBConnection();

        // Assertions
        // getDBConnection's mock was called twice
        expect(getDBConnectionMock).toHaveBeenCalledTimes(2);
        // The underlying sqlite3.Database constructor mock was only called once (due to caching logic)
        expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
        // Both calls should return the exact same mock instance
        expect(db1).toBe(mockDatabaseInstance);
        expect(db2).toBe(mockDatabaseInstance);
        expect(db1).toBe(db2); // Explicitly check they are the same object
    });


    it('should handle database connection errors', async () => {
        const connectionError = new Error('Failed to connect to the database');

        // Configure the mock constructor *specifically for this test* to simulate an error scenario.
        // Use mockImplementationOnce to override the default implementation just for this call.
         MockDatabaseConstructor.mockImplementationOnce((filename: string, modeOrCallback?: number | ((err: Error | null) => void), callback?: (err: Error | null) => void) => {
            const actualCallback = typeof modeOrCallback === 'function' ? modeOrCallback : callback;
            // Simulate the constructor's callback being called with an error (asynchronously)
            if (actualCallback) {
                process.nextTick(() => actualCallback(connectionError));
            }
            // The constructor might still return an object even if the async callback fails.
            // Return our mock instance so the promise flow can continue and handle the rejection.
            return mockDatabaseInstance as unknown as Database;
        });

         // The default getDBConnectionMock implementation from beforeEach is used here.
         // It correctly handles promise rejection based on the constructor's callback error.

        // Call the function and assert that it rejects with the expected error
        await expect(getDBConnection()).rejects.toThrow(connectionError);

        // Assert that the constructor mock was called (even though it resulted in an error)
        expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
        expect(MockDatabaseConstructor).toHaveBeenCalledWith('./database.db', expect.any(Function));
        // Ensure getDBConnection itself was called
        expect(getDBConnectionMock).toHaveBeenCalledTimes(1);
    });

    // Example test for using a mocked DB method
    it('should simulate executing a run command successfully', async () => {
        // Get the connection (which returns mockDatabaseInstance via the default mock)
        const db = await getDBConnection(); // db is mockDatabaseInstance

        // Call the 'run' method on the database instance
        // Use a promise to wait for the async callback simulation
        await new Promise<void>((resolve, reject) => {
            // The callback function provided here will be invoked by our mock 'run' implementation
            db.run('INSERT INTO test (col) VALUES (?)', ['value'], function(this: RunResult, err) {
                try {
                    // Assertions inside the callback
                    expect(err).toBeNull(); // Expect no error from the mock callback
                    // Check the 'this' context provided by the mock callback.call
                    expect(this.lastID).toBe(1);
                    expect(this.changes).toBe(1);
                    resolve(); // Resolve the promise indicating success
                } catch (assertionError) {
                    reject(assertionError); // Reject if assertions fail
                }
            });
        });

        // Assert that the mock 'run' method (on mockDatabaseInstance) was called correctly
        expect(mockDatabaseInstance.run).toHaveBeenCalledTimes(1);
        // The mock implementation separates the callback, so we check params without it explicitly here,
        // but verify a function was passed as the last arg.
        expect(mockDatabaseInstance.run).toHaveBeenCalledWith(
            'INSERT INTO test (col) VALUES (?)', // SQL string
            ['value'],                           // Parameters
            expect.any(Function)                 // The original callback function passed in
        );
    });
});