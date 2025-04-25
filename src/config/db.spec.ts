import sqlite3 from 'sqlite3'; // Import types for mocking
import path from 'path'; // db.ts uses path

// --- Mocking Dependencies ---

// Mock environment variables if needed (optional, can set process.env directly)
// jest.mock('dotenv', () => ({ config: jest.fn() }));

// Store mock instances and control functions accessible within the test scope
// We need these to control the behavior of the mocked sqlite3 instance.
let mockDbInstance: jest.Mocked<sqlite3.Database>;
let capturedConstructorCallback: (err: Error | null) => void;
let capturedPragmaCallback: (err: Error | null) => void;
let capturedCloseCallback: (err: Error | null) => void;
let mockRunFn: jest.Mock;
let mockCloseFn: jest.Mock;
let mockOnFn: jest.Mock;

/**
 * Define the mock implementation for the sqlite3.Database constructor.
 * This function will be called whenever 'new sqlite3.Database()' is executed in db.ts.
 */
const MockDatabaseConstructor = jest.fn().mockImplementation(function(this: any, filename: string, callback: (err: Error | null) => void) {
    // Capture the callback provided to the constructor by db.ts.
    // This allows tests to trigger connection success or failure asynchronously.
    capturedConstructorCallback = callback;

    // Define mock implementations for the database instance methods used by db.ts.
    // These mocks will be attached to the object returned by the constructor ('this').

    // Mock the 'run' method (used for PRAGMA)
    mockRunFn = jest.fn().mockImplementation((sql: string, paramsOrCallback: any, callback?: any) => {
        const actualCallback = typeof paramsOrCallback === 'function' ? paramsOrCallback : callback;

        // Capture the callback specifically for the PRAGMA command to control its outcome in tests.
        if (sql.toUpperCase().startsWith('PRAGMA FOREIGN_KEYS')) {
            capturedPragmaCallback = actualCallback;
        } else if (actualCallback) {
            // Provide a default success behavior for any other 'run' calls if needed.
            // Uses process.nextTick to simulate async behavior.
            process.nextTick(() => actualCallback?.call({ lastID: 1, changes: 1 } as sqlite3.RunResult, null));
        }
        return this; // Return the mock instance ('this') to allow method chaining if any.
    });

    // Mock the 'close' method
    mockCloseFn = jest.fn().mockImplementation((callback: (err: Error | null) => void) => {
        // Capture the callback provided to 'close' to control its outcome in tests.
        capturedCloseCallback = callback;
    });

    // Mock the 'on' method (used for error handling on the db instance)
    mockOnFn = jest.fn();

    // Assign the mocked methods to the instance being created ('this').
    this.run = mockRunFn;
    this.close = mockCloseFn;
    this.on = mockOnFn;
    // Add mocks for other sqlite3.Database methods (e.g., get, all, prepare) if they were used in db.ts.

    // Store a reference to the created mock instance so tests can assert against its methods.
    mockDbInstance = this as jest.Mocked<sqlite3.Database>;

    // The constructor in JS implicitly returns 'this'.
    return this;
});

// Apply the mock to the 'sqlite3' module.
jest.mock('sqlite3', () => {
    // The mock needs to export properties matching the real 'sqlite3' module.
    return {
        // Provide the mock constructor.
        Database: MockDatabaseConstructor,
        // Mock the 'verbose' function. db.ts calls sqlite3.verbose().Database(...).
        // So, verbose() needs to return an object containing the mock constructor.
        verbose: jest.fn(() => ({
            Database: MockDatabaseConstructor,
        })),
        // Define any constants like OPEN_READWRITE if db.ts uses them directly (it doesn't currently).
        // OPEN_READWRITE: jest.fn(),
        // OPEN_CREATE: jest.fn(),
    };
});


// --- Test Suite ---

// Import the module *under test* AFTER mocks are defined.
// We are testing the actual functions from db.ts.
import { getDBConnection, closeDBConnection } from './db';

// Enable Jest's fake timers to control process.nextTick, setTimeout, etc. used in mocks/async operations.
jest.useFakeTimers();

describe('Database Configuration (db.ts)', () => {

    // Calculate the expected default path once.
    const defaultDbPath = './database.db';
    const expectedDefaultDbPath = path.resolve(defaultDbPath);

    beforeEach(() => {
        // --- Test Setup ---
        // 1. Reset all Jest mocks (clears call counts, implementations set by mockImplementationOnce, etc.)
        jest.clearAllMocks();

        // 2. Reset the state of the db.ts module. This is crucial because db.ts uses module-level
        //    variables (db, connectionPromise) to implement the singleton pattern. Resetting ensures
        //    each test starts with a clean slate (db = null, connectionPromise = null).
        jest.resetModules();

        // 3. Reset any manually captured callbacks or variables used for mock control.
        //    Ensures mocks behave predictably based on the current test setup.
        capturedConstructorCallback = (err: Error | null) => { /* no-op */ };
        capturedPragmaCallback = (err: Error | null) => { /* no-op */ };
        capturedCloseCallback = (err: Error | null) => { /* no-op */ };

        // 4. Ensure environment variables are reset or set as needed for the specific test.
        //    The default state is no DATABASE_PATH override.
        delete process.env.DATABASE_PATH;

        // Note: Because of jest.resetModules(), if we needed to re-import db.ts *within* a test
        // (e.g., after changing an env var), we'd use:
        // const { getDBConnection } = require('./db');
        // However, for most tests, the top-level import combined with beforeEach reset is sufficient.
    });

    afterEach(async () => {
        // --- Test Teardown ---
        // 1. Ensure any potentially open connection from a test is closed.
        //    This uses the *actual* closeDBConnection function, which will interact with our mocks.
        //    Import dynamically because resetModules might affect the top-level import if used mid-test.
        //    Using require ensures we get the potentially fresh module instance.
        try {
            const { closeDBConnection: closeAfterTest } = require('./db');
            await closeAfterTest();
        } catch (error) {
             // Ignore errors during cleanup to prevent cascading test failures
             // console.error("Error during afterEach cleanup:", error);
        }

        // 2. Clean up any environment variables set during a test.
        delete process.env.DATABASE_PATH;
    });

    // --- getDBConnection Tests ---
    describe('getDBConnection', () => {
        it('should establish a new connection successfully and configure PRAGMA', async () => {
            // Arrange: Initiate the connection attempt.
            const connectionPromise = getDBConnection();

            // Assert: Check that the sqlite3 constructor was called correctly.
            expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
            expect(MockDatabaseConstructor).toHaveBeenCalledWith(expectedDefaultDbPath, expect.any(Function));
            expect(capturedConstructorCallback).toBeDefined(); // Ensure the callback was captured.

            // Act: Simulate the async constructor callback succeeding. Use process.nextTick
            //      and advanceTimersByTime to ensure the callback runs within the test flow.
            process.nextTick(() => capturedConstructorCallback(null));
            await jest.advanceTimersByTimeAsync(0); // Allow the constructor callback microtask to run

            // Assert: Check that the PRAGMA command was executed after successful connection.
            expect(mockRunFn).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;', expect.any(Function));
            expect(capturedPragmaCallback).toBeDefined(); // Ensure the PRAGMA callback was captured.

            // Act: Simulate the PRAGMA command succeeding.
            process.nextTick(() => capturedPragmaCallback(null));

            // Assert: The main promise returned by getDBConnection should now resolve.
            // Use await to get the resolved value (the db instance).
            const db = await connectionPromise;

            // Assert: Check the resolved value and side effects.
            expect(db).toBeDefined();
            // The resolved db should be the instance created by our mock constructor.
            expect(db).toBe(mockDbInstance);
            // Check that the error handler was attached to the db instance.
            expect(mockOnFn).toHaveBeenCalledWith('error', expect.any(Function));
        });

        it('should use DATABASE_PATH environment variable if set', async () => {
            // Arrange: Set the environment variable and determine the expected path.
            const customPath = './custom/path/test.db';
            const expectedCustomPath = path.resolve(customPath);
            process.env.DATABASE_PATH = customPath;

            // Act: Force module reset so db.ts reads the updated process.env.
            jest.resetModules();
            // Re-import the function to test after resetting the module.
            const { getDBConnection: getConnectionWithCustomPath } = require('./db');
            // Also re-require the mock constructor if its reference might have been affected by resetModules
            const MockDatabaseConstructorReset = require('sqlite3').Database;

            const connectionPromise = getConnectionWithCustomPath();

            // Assert: Verify constructor was called with the custom path.
            expect(MockDatabaseConstructorReset).toHaveBeenCalledTimes(1);
            expect(MockDatabaseConstructorReset).toHaveBeenCalledWith(expectedCustomPath, expect.any(Function));

            // Note: Capturing callbacks after resetModules needs careful handling. Assuming the top-level
            // capture variables still work correctly with Jest's mocking layer here.
            expect(capturedConstructorCallback).toBeDefined();

            // Act: Simulate successful connection and PRAGMA callbacks.
            process.nextTick(() => capturedConstructorCallback(null));
            await jest.advanceTimersByTimeAsync(0);
            expect(mockRunFn).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;', expect.any(Function));
            expect(capturedPragmaCallback).toBeDefined();
            process.nextTick(() => capturedPragmaCallback(null));

            // Assert: The promise should resolve successfully.
            await expect(connectionPromise).resolves.toBeDefined();
        });


        it('should return the existing connection instance on subsequent calls (singleton behavior)', async () => {
            // Arrange: Call getDBConnection once and complete the connection process.
            const promise1 = getDBConnection();
            process.nextTick(() => capturedConstructorCallback(null));
            await jest.advanceTimersByTimeAsync(0);
            process.nextTick(() => capturedPragmaCallback(null));
            const db1 = await promise1; // Wait for the first connection

            // Act: Call getDBConnection again.
            const db2 = await getDBConnection();

            // Assert:
            // 1. The constructor should only have been called once for the first connection.
            expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
            // 2. Both calls should resolve to the exact same instance.
            expect(db2).toBe(db1);
            expect(db2).toBe(mockDbInstance); // Verify it's the instance from our mock.
        });

        it('should handle concurrent connection requests correctly (connection pooling simulation)', async () => {
            // Arrange: Initiate multiple connection requests concurrently without awaiting them yet.
            const promise1 = getDBConnection();
            const promise2 = getDBConnection();
            const promise3 = getDBConnection();

            // Assert: Even with concurrent calls, the constructor should only be invoked once
            //         due to the 'connectionPromise' lock in db.ts.
            expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
            expect(MockDatabaseConstructor).toHaveBeenCalledWith(expectedDefaultDbPath, expect.any(Function));

            // Act: Simulate the single connection attempt succeeding (constructor + PRAGMA).
            process.nextTick(() => capturedConstructorCallback(null));
            await jest.advanceTimersByTimeAsync(0); // Let constructor callback run
            process.nextTick(() => capturedPragmaCallback(null)); // Let PRAGMA callback run

            // Assert: Wait for all concurrent promises to resolve and check their results.
            const [db1, db2, db3] = await Promise.all([promise1, promise2, promise3]);

            expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1); // Verify again constructor only ran once.
            expect(db1).toBe(mockDbInstance); // All should resolve to the same instance.
            expect(db2).toBe(db1);
            expect(db3).toBe(db1);
        });

        it('should reject the promise if the database connection fails', async () => {
            // Arrange: Define the connection error.
            const connectionError = new Error('Disk I/O error');
            // Initiate the connection attempt.
            const promise = getDBConnection();

            // Assert: Constructor was called.
            expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
            expect(capturedConstructorCallback).toBeDefined();

            // Act: Simulate the constructor callback failing with an error.
            process.nextTick(() => capturedConstructorCallback(connectionError));

            // Assert: The promise returned by getDBConnection should reject with a specific error message.
            await expect(promise).rejects.toThrow(`Database connection failed: ${connectionError.message}`);

            // --- Verify Retry Behavior ---
            // Arrange: Attempt to connect again after the failure.
            const promise2 = getDBConnection();

            // Assert: A new connection attempt should be made (constructor called again).
            expect(MockDatabaseConstructor).toHaveBeenCalledTimes(2);

            // Act: Simulate the second attempt succeeding.
            process.nextTick(() => capturedConstructorCallback(null));
            await jest.advanceTimersByTimeAsync(0);
            expect(mockRunFn).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;', expect.any(Function));
            process.nextTick(() => capturedPragmaCallback(null));

            // Assert: The second promise should resolve successfully.
            await expect(promise2).resolves.toBe(mockDbInstance);
        });

        it('should resolve the promise even if PRAGMA command fails (logging a warning)', async () => {
            // Arrange: Define the PRAGMA error and spy on console.error to check logging.
            const pragmaError = new Error('PRAGMA command failed');
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(); // Suppress log during test

            // Act: Initiate connection.
            const promise = getDBConnection();

            // Act: Simulate connection success.
            expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
            process.nextTick(() => capturedConstructorCallback(null));
            await jest.advanceTimersByTimeAsync(0); // Let constructor callback run

            // Assert: PRAGMA command was called.
            expect(mockRunFn).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;', expect.any(Function));
            expect(capturedPragmaCallback).toBeDefined();

            // Act: Simulate the PRAGMA callback failing.
            process.nextTick(() => capturedPragmaCallback(pragmaError));

            // Assert: The main promise should still resolve successfully.
            await expect(promise).resolves.toBe(mockDbInstance);

            // Assert: Check that the warning was logged to the console.
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                "[WARN] Failed to enable PRAGMA foreign_keys:",
                pragmaError.message
            );

            // Cleanup spy
            consoleErrorSpy.mockRestore();
        });
    });

    // --- closeDBConnection Tests ---
    describe('closeDBConnection', () => {
        it('should close the active connection successfully', async () => {
            // Arrange: Establish a connection first.
            const promiseConnect = getDBConnection();
            process.nextTick(() => capturedConstructorCallback(null));
            await jest.advanceTimersByTimeAsync(0);
            process.nextTick(() => capturedPragmaCallback(null));
            await promiseConnect; // Ensure connection is established and db instance is set internally

            // Act: Call the function to close the connection.
            const closePromise = closeDBConnection();

            // Assert: The mock database's close method should have been called.
            expect(mockCloseFn).toHaveBeenCalledTimes(1);
            expect(capturedCloseCallback).toBeDefined(); // Ensure the callback was captured.

            // Act: Simulate the close callback succeeding.
            process.nextTick(() => capturedCloseCallback(null));

            // Assert: The promise returned by closeDBConnection should resolve.
            await expect(closePromise).resolves.toBeUndefined();

            // --- Verify Internal State Reset ---
            // Arrange: Attempt to get a connection again.
            const promiseReconnect = getDBConnection();

            // Assert: The constructor should be called again, indicating the previous instance was cleared.
            expect(MockDatabaseConstructor).toHaveBeenCalledTimes(2);

            // Cleanup: Complete the second connection attempt for isolation.
            process.nextTick(() => capturedConstructorCallback(null));
            await jest.advanceTimersByTimeAsync(0);
            process.nextTick(() => capturedPragmaCallback(null));
            await promiseReconnect;
        });

        it('should do nothing and resolve immediately if no connection is active', async () => {
            // Arrange: Ensure no connection exists (default state after beforeEach).

            // Act: Call closeDBConnection.
            const closePromise = closeDBConnection();

            // Assert: The promise should resolve immediately.
            await expect(closePromise).resolves.toBeUndefined();
            // Assert: Neither the constructor nor the close method should have been called.
            expect(MockDatabaseConstructor).not.toHaveBeenCalled();
            expect(mockCloseFn).not.toHaveBeenCalled();
        });

        it('should resolve immediately if connection attempt is pending but not finished', async () => {
            // Arrange: Start a connection attempt but *do not* trigger its callbacks yet.
            const connectPromise = getDBConnection();
            expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1); // Constructor called, but callback pending

            // Act: Call close while the connection promise (connectionPromise in db.ts) is pending.
            const closePromise = closeDBConnection();

            // Assert: closeDBConnection should resolve quickly because the internal 'db' variable is still null.
            // It should *not* wait for the pending connection, nor call db.close().
            await expect(closePromise).resolves.toBeUndefined();
            expect(mockCloseFn).not.toHaveBeenCalled();

            // --- Verify Subsequent Behavior ---
            // Act: Now, let the original pending connection succeed.
            process.nextTick(() => capturedConstructorCallback(null));
            await jest.advanceTimersByTimeAsync(0);
            process.nextTick(() => capturedPragmaCallback(null));

            // Assert: The original connection promise should eventually resolve.
            await expect(connectPromise).resolves.toBeDefined();

            // Act: Try getting the connection again.
            // Because closeDBConnection was called (and likely nulled the internal 'db' and 'connectionPromise' refs
            // even though the actual db object wasn't ready to close), a new connection attempt should start.
            const connectPromise2 = getDBConnection();

            // Assert: A new connection attempt is made.
            expect(MockDatabaseConstructor).toHaveBeenCalledTimes(2);

            // Cleanup second attempt
            process.nextTick(() => capturedConstructorCallback(null));
            await jest.advanceTimersByTimeAsync(0);
            process.nextTick(() => capturedPragmaCallback(null));
            await connectPromise2;
        });


        it('should reject if closing the underlying database connection fails', async () => {
            // Arrange: Establish a connection first.
            const promiseConnect = getDBConnection();
            process.nextTick(() => capturedConstructorCallback(null));
            await jest.advanceTimersByTimeAsync(0);
            process.nextTick(() => capturedPragmaCallback(null));
            await promiseConnect; // Connection established

            // Arrange: Define the error for the close operation.
            const closeError = new Error('Failed to close DB file handle');

            // Act: Call closeDBConnection.
            const closePromise = closeDBConnection();

            // Assert: The mock close method was called.
            expect(mockCloseFn).toHaveBeenCalledTimes(1);
            expect(capturedCloseCallback).toBeDefined();

            // Act: Simulate the close callback failing with an error.
            process.nextTick(() => capturedCloseCallback(closeError));

            // Assert: The promise returned by closeDBConnection should reject.
            await expect(closePromise).rejects.toThrow(`Failed to close database: ${closeError.message}`);

            // --- Verify Internal State Reset (even on error) ---
             // Arrange: Attempt to get a connection again.
            const promiseReconnect = getDBConnection();

            // Assert: The constructor should be called again, indicating the internal refs were cleared despite the close error.
            expect(MockDatabaseConstructor).toHaveBeenCalledTimes(2);

            // Cleanup: Complete the second connection attempt.
            process.nextTick(() => capturedConstructorCallback(null));
            await jest.advanceTimersByTimeAsync(0);
            process.nextTick(() => capturedPragmaCallback(null));
            await promiseReconnect;
        });
    });

    // Note on Graceful Shutdown:
    // Testing the process.on('SIGINT', ...) handlers is generally considered integration testing
    // as it involves mocking process signals and process.exit. Unit tests typically focus on
    // the exported functions like getDBConnection and closeDBConnection, assuming the signal
    // handlers correctly call closeDBConnection (which is tested here).

});