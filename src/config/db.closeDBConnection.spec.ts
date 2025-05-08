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
        } else {
            // If no callback is provided, resolve immediately
             return Promise.resolve();
        }
        return this; // Return the mock instance ('this') to allow method chaining if any.
    });

    // Mock the 'close' method
    mockCloseFn = jest.fn().mockImplementation((callback: (err: Error | null) => void) => {
        // Capture the callback provided to 'close' to control its outcome in tests.
        capturedCloseCallback = callback;

        // Simulate async behavior using process.nextTick (or setTimeout(0))
        process.nextTick(() => {
            if (callback) {
                // Default: Simulate successful close
                callback(null);
            }
        });
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
import { closeDBConnection } from './db';

// Enable Jest's fake timers to control process.nextTick, setTimeout, etc. used in mocks/async operations.
jest.useFakeTimers();


describe('closeDBConnection', () => {
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
    it('should close the active connection successfully', async () => {
        const { getDBConnection } = require('./db');
        // Arrange: Establish a connection first.
        const promiseConnect = getDBConnection();
        process.nextTick(() => capturedConstructorCallback(null));
        await jest.advanceTimersByTimeAsync(0);
        process.nextTick(() => capturedPragmaCallback(null));
        await jest.advanceTimersByTimeAsync(0);
        await promiseConnect; // Ensure connection is established and db instance is set internally

        // Act: Call the function to close the connection.
        const closePromise = closeDBConnection();

        // Assert: The mock database's close method should have been called.
        expect(mockCloseFn).toHaveBeenCalledTimes(1);
        expect(capturedCloseCallback).toBeDefined(); // Ensure the callback was captured.

        // Act: Simulate the close callback succeeding.
        process.nextTick(() => capturedCloseCallback(null));
        await jest.advanceTimersByTimeAsync(0);

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
        await jest.advanceTimersByTimeAsync(0);
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
        const { getDBConnection } = require('./db');
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
        await jest.advanceTimersByTimeAsync(0);

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
        await jest.advanceTimersByTimeAsync(0);
        await connectPromise2;
    });


    it('should reject if closing the underlying database connection fails', async () => {
        const { getDBConnection } = require('./db');
        // Arrange: Establish a connection first.
        const promiseConnect = getDBConnection();
        process.nextTick(() => capturedConstructorCallback(null));
        await jest.advanceTimersByTimeAsync(0);
        process.nextTick(() => capturedPragmaCallback(null));
        await jest.advanceTimersByTimeAsync(0);
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
        await jest.advanceTimersByTimeAsync(0);

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
        await jest.advanceTimersByTimeAsync(0);
        await promiseReconnect;
    });
});
