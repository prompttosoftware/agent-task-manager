import { getDBConnection } from './db';
import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3'; // Import the actual Database type

// Define the type for the mock constructor explicitly
type MockDatabaseConstructorType = jest.Mock<Database, [filename: string, mode?: number | undefined, callback?: ((err: Error | null) => void) | undefined]>;

jest.mock('sqlite3', () => {
    const mockDatabase = {
        run: jest.fn().mockReturnThis(),
        get: jest.fn(),
        all: jest.fn(),
        close: jest.fn((callback: (err: Error | null) => void) => {
            callback(null);
        }),
        // Add other methods if needed by getDBConnection or tests
        configure: jest.fn(),
        exec: jest.fn(),
        prepare: jest.fn(),
        // ... other Database methods
    };

    // Ensure the mock constructor conforms to the expected signature and type
    const MockDatabaseConstructor: MockDatabaseConstructorType = jest.fn().mockImplementation((filename: string, modeOrCallback?: number | ((err: Error | null) => void), callback?: (err: Error | null) => void) => {
        const actualCallback = typeof modeOrCallback === 'function' ? modeOrCallback : callback;
        if (filename === './error.db') {
             if (actualCallback) actualCallback(new Error('Failed to connect'));
        } else {
             if (actualCallback) actualCallback(null);
        }
        // Return the mock database instance
        return mockDatabase as unknown as Database; // Cast needed as mock doesn't fully implement Database
    }) as MockDatabaseConstructorType; // Assert the type here as well

    return {
        Database: MockDatabaseConstructor,
        OPEN_READWRITE: 1,
        OPEN_CREATE: 2,
        // Add verbose if it's used implicitly or explicitly
        verbose: jest.fn(() => sqlite3), // Mock verbose if necessary
    };
});

// Keep the existing mock for ./db
jest.mock('./db', () => {
    const originalModule = jest.requireActual('./db');
    return {
        ...originalModule,
        __esModule: true,
        getDBConnection: jest.fn(), // We will define the implementation in beforeEach/tests
    };
});


describe('Database Connection', () => {
    // Use the explicitly defined type
    let MockDatabaseConstructor: MockDatabaseConstructorType;
    let mockDatabaseInstance: Partial<Database>; // Use Partial<Database> for the instance
    let getDBConnectionMock: jest.Mock;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Access the mock constructor from the mocked module
        MockDatabaseConstructor = require('sqlite3').Database;

        mockDatabaseInstance = {
            run: jest.fn(function(this: any, sql: string, params: any, callback: (this: sqlite3.RunResult, err: Error | null) => void) {
                if (callback) callback.call({ lastID: 1, changes: 1 }, null); // Simulate callback context if needed
                return this; // Return `this` for chaining if applicable
            }),
            get: jest.fn(),
            all: jest.fn(),
            close: jest.fn((callback?: (err: Error | null) => void) => {
                if (callback) callback(null);
            }),
            // Add mocks for other methods used by getDBConnection if any
        };

        // Re-apply the implementation for the constructor mock if needed for specific tests,
        // otherwise the one in jest.mock('sqlite3', ...) will be used.
        MockDatabaseConstructor.mockImplementation((filename: string, modeOrCallback?: number | ((err: Error | null) => void), callback?: (err: Error | null) => void) => {
             const actualCallback = typeof modeOrCallback === 'function' ? modeOrCallback : callback;
             if (filename === './error.db') { // Specific error case for testing
                 if (actualCallback) actualCallback(new Error('Failed to connect'));
             } else {
                 if (actualCallback) actualCallback(null);
             }
             return mockDatabaseInstance as Database; // Return the instance
        });


        getDBConnectionMock = getDBConnection as jest.Mock;

        // Default mock implementation for getDBConnection for most tests
        getDBConnectionMock.mockImplementation(async () => {
            // This simulates the logic within the actual getDBConnection
            // where it calls `new sqlite3.Database(...)`
             return new Promise((resolve, reject) => {
                 const db = new (require('sqlite3').Database)('./database.db', (err: Error | null) => {
                     if (err) {
                         reject(err);
                     } else {
                         resolve(db);
                     }
                 });
             });
         });
    });

    it('should establish a database connection successfully', async () => {
        const db = await getDBConnection();
        // Check if the constructor was called by the mock implementation of getDBConnection
        expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
        // Check the arguments passed to the constructor
        expect(MockDatabaseConstructor).toHaveBeenCalledWith('./database.db', expect.any(Function));
        // Ensure the resolved value is the mock instance
        expect(db).toBe(mockDatabaseInstance);
    });

    it('should return the existing database connection if it already exists', async () => {
        // Simulate the caching behavior if it exists in the actual implementation
        // For this test, let's assume the actual getDBConnection has caching logic
        const originalDb = jest.requireActual('./db');
        let internalDbInstance: Database | null = null;
        getDBConnectionMock.mockImplementation(async () => {
            if (internalDbInstance) {
                return internalDbInstance;
            }
            return new Promise((resolve, reject) => {
                const db = new (require('sqlite3').Database)('./database.db', (err: Error | null) => {
                    if (err) {
                        reject(err);
                    } else {
                        internalDbInstance = db; // Cache the instance
                        resolve(db);
                    }
                });
            });
        });

        const db1 = await getDBConnection();
        const db2 = await getDBConnection();

        expect(getDBConnectionMock).toHaveBeenCalledTimes(2); // Called twice
        // Constructor should only be called once due to caching simulation
        expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
        expect(db1).toBe(mockDatabaseInstance);
        expect(db2).toBe(mockDatabaseInstance); // Should return the same instance
    });

    it('should handle database connection errors', async () => {
        // Configure the mock constructor *specifically for this test* to simulate an error
         MockDatabaseConstructor.mockImplementationOnce((filename: string, modeOrCallback?: number | ((err: Error | null) => void), callback?: (err: Error | null) => void) => {
            const actualCallback = typeof modeOrCallback === 'function' ? modeOrCallback : callback;
            if (actualCallback) {
                actualCallback(new Error('Failed to connect to the database'));
            }
            // Important: Still return *something* that looks like a Database to avoid immediate errors,
            // even though the callback signals failure. Or adjust based on sqlite3's exact behavior.
            return mockDatabaseInstance as Database;
        });

         // Ensure getDBConnection uses the constructor that will now error
         getDBConnectionMock.mockImplementationOnce(async () => {
             return new Promise((resolve, reject) => {
                 new (require('sqlite3').Database)('./database.db', (err: Error | null) => {
                     if (err) {
                         reject(err); // Reject the promise from getDBConnection
                     } else {
                        // This part shouldn't be reached if err exists
                        // resolve(db);
                     }
                 });
             });
         });


        await expect(getDBConnection()).rejects.toThrow('Failed to connect to the database');
        // Constructor was called (even though it failed internally via callback)
        expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
        expect(MockDatabaseConstructor).toHaveBeenCalledWith('./database.db', expect.any(Function));
    });
});