import sqlite3 from 'sqlite3'; // Import types for mocking
import path from 'path'; // db.ts uses path
import { createMockDbConnection } from '../mocks/dbconnection.mock';
import { IDatabaseConnection } from './db';

// --- Mocking Dependencies ---

// Store mock instances and control functions accessible within the test scope
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
const MockDatabaseConstructor = jest.fn().mockImplementation(function (this: any, filename: string, callback: (err: Error | null) => void) {
    capturedConstructorCallback = callback;

    // Mock the 'run' method used by db.ts (via SqliteConnection)
    mockRunFn = jest.fn().mockImplementation((sql: string, params: any[], callback?: (this: sqlite3.RunResult, err: Error | null) => void) => {
        // The db.ts wrapper always provides params (defaulting to []).
        // Callback is the last argument.

        // Capture the callback specifically for the PRAGMA command
        if (sql.toUpperCase().startsWith('PRAGMA FOREIGN_KEYS')) {
            capturedPragmaCallback = callback || ((err: Error | null) => { /* no-op */ });
        } else if (callback) {
            // Default success for other 'run' calls
            process.nextTick(() => callback?.call({ lastID: 1, changes: 1 } as sqlite3.RunResult, null));
        }
        // The native 'run' returns the database instance for chaining, although db.ts doesn't use it.
        return this;
    });

    // Mock the 'close' method
    mockCloseFn = jest.fn().mockImplementation((callback: (err: Error | null) => void) => {
        capturedCloseCallback = callback;
        process.nextTick(() => {
            if (callback) {
                callback(null); // Default: Simulate successful close
            }
        });
    });

    // Mock the 'on' method (used for error handling)
    mockOnFn = jest.fn();

    // Assign the mocked methods to the instance being created ('this').
    this.run = mockRunFn;
    this.close = mockCloseFn;
    this.on = mockOnFn;
    // Add mocks for other sqlite3.Database methods (e.g., get, all) if they were used directly by db.ts (they aren't).

    // Store a reference to the created mock instance.
    mockDbInstance = this as jest.Mocked<sqlite3.Database>;

    return this;
});

// Apply the mock to the 'sqlite3' module.
jest.mock('sqlite3', () => {
    return {
        Database: MockDatabaseConstructor,
        verbose: jest.fn(() => ({
            Database: MockDatabaseConstructor,
        })),
    };
});


// --- Test Suite ---

// Import the module *under test* AFTER mocks are defined.
import { getDBConnection } from './db';

// Enable Jest's fake timers.
jest.useFakeTimers();

describe('getDBConnection', () => {

    const defaultDbPath = './database.db';
    const expectedDefaultDbPath = path.resolve(defaultDbPath);

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules(); // Reset module state (dbInstance, connectionPromise)
        capturedConstructorCallback = (err: Error | null) => { /* no-op */ };
        capturedPragmaCallback = (err: Error | null) => { /* no-op */ };
        capturedCloseCallback = (err: Error | null) => { /* no-op */ };
        delete process.env.DATABASE_PATH;
        // Re-import necessary components after resetModules if needed within tests
    });

    afterEach(() => {
        delete process.env.DATABASE_PATH;
        // jest.useRealTimers(); // Restore real timers if needed, but usually kept fake for suite
    });

    it('should establish a new connection successfully and configure PRAGMA', async () => {
        // Arrange
        const connectionPromise = getDBConnection();

        // Assert: Constructor called
        expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
        expect(MockDatabaseConstructor).toHaveBeenCalledWith(expectedDefaultDbPath, expect.any(Function));
        expect(capturedConstructorCallback).toBeDefined();

        // Act: Simulate constructor success
        process.nextTick(() => capturedConstructorCallback(null));
        await jest.advanceTimersByTimeAsync(0);

        // Assert: PRAGMA run called correctly (with empty params array)
        expect(mockRunFn).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;', [], expect.any(Function));
        expect(capturedPragmaCallback).toBeDefined();

        // Act: Simulate PRAGMA success
        process.nextTick(() => capturedPragmaCallback(null));
        await jest.advanceTimersByTimeAsync(0);

        // Assert: Promise resolved with the DB instance
        const db = await connectionPromise;
        expect(db).toBeDefined();
        expect(db).toBeInstanceOf(Object); // Check if it's the wrapper
        expect(db.getNativeDriver()).toBe(mockDbInstance); // Check if the wrapper holds the native mock
        expect(mockOnFn).toHaveBeenCalledWith('error', expect.any(Function)); // Error handler attached
    });

    it('should use DATABASE_PATH environment variable if set', async () => {
        // Arrange
        const customPath = './custom/path/test.db';
        const expectedCustomPath = path.resolve(customPath);
        process.env.DATABASE_PATH = customPath;

        // Re-import is needed because db.ts reads env vars at module load time
        const { getDBConnection: getConnectionWithCustomPath } = require('./db');
        const MockDatabaseConstructorReset = require('sqlite3').Database; // Re-require mock too

        // Act
        const connectionPromise = getConnectionWithCustomPath();

        // Assert: Constructor called with custom path
        expect(MockDatabaseConstructorReset).toHaveBeenCalledTimes(1);
        expect(MockDatabaseConstructorReset).toHaveBeenCalledWith(expectedCustomPath, expect.any(Function));
        expect(capturedConstructorCallback).toBeDefined();

        // Act: Simulate successful connection and PRAGMA
        process.nextTick(() => capturedConstructorCallback(null));
        await jest.advanceTimersByTimeAsync(0);
        // Need to check mockRunFn attached to the *newly required* module's instance
        // Accessing the top-level mockRunFn might not reflect the call in this context
        // However, since the *mock implementation* is shared, the call *should* be registered on the top-level mock.
        expect(mockRunFn).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;', [], expect.any(Function));
        expect(capturedPragmaCallback).toBeDefined();
        process.nextTick(() => capturedPragmaCallback(null));
        await jest.advanceTimersByTimeAsync(0);

        // Assert: Promise resolves
        await expect(connectionPromise).resolves.toBeDefined();
    });


    it('should return the existing connection instance on subsequent calls (singleton behavior)', async () => {
        // Arrange: First call and complete connection
        const promise1 = getDBConnection();
        process.nextTick(() => capturedConstructorCallback(null));
        await jest.advanceTimersByTimeAsync(0);
        process.nextTick(() => capturedPragmaCallback(null));
        await jest.advanceTimersByTimeAsync(0);
        const db1 = await promise1;

        // Act: Second call
        const promise2 = getDBConnection();
        const db2 = await promise2;

        // Assert
        expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1); // Constructor only called once
        expect(db2).toBe(db1); // Same instance returned
        expect(db2.getNativeDriver()).toBe(mockDbInstance);
    });

    it('should handle concurrent connection requests correctly (connection pooling simulation)', async () => {
        // Arrange: Initiate concurrent calls
        const promise1 = getDBConnection();
        const promise2 = getDBConnection();
        const promise3 = getDBConnection();

        // Assert: Constructor should be called almost immediately by the first request
        // Use runOnlyPendingTimers or advanceTimersByTime(0) if needed, but it should be synchronous enough here.
        expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
        expect(MockDatabaseConstructor).toHaveBeenCalledWith(expectedDefaultDbPath, expect.any(Function));

        // Act: Simulate the single connection succeeding
        process.nextTick(() => capturedConstructorCallback(null));
        await jest.advanceTimersByTimeAsync(0);
        process.nextTick(() => capturedPragmaCallback(null));
        await jest.advanceTimersByTimeAsync(0);

        // Assert: All promises resolve to the same instance
        const [db1, db2, db3] = await Promise.all([promise1, promise2, promise3]);

        expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1); // Verify again
        expect(db1.getNativeDriver()).toBe(mockDbInstance);
        expect(db2).toBe(db1);
        expect(db3).toBe(db1);
    });

    it('should reject the promise if the database connection fails', async () => {
        // Arrange
        const connectionError = new Error('Disk I/O error');
        const promise = getDBConnection();

        // Assert: Constructor called
        expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);
        expect(capturedConstructorCallback).toBeDefined();

        // Act: Simulate constructor failure
        process.nextTick(() => capturedConstructorCallback(connectionError));
        await jest.advanceTimersByTimeAsync(0);

        // Assert: Promise rejected with specific error
        await expect(promise).rejects.toThrow(`Database connection failed: ${connectionError.message}`);

        // --- Verify Retry Behavior ---
        // Arrange: Attempt again
        const promise2 = getDBConnection();

        // Assert: New attempt made
        expect(MockDatabaseConstructor).toHaveBeenCalledTimes(2); // Second call to constructor

        // Act: Simulate second attempt succeeding
        process.nextTick(() => capturedConstructorCallback(null));
        await jest.advanceTimersByTimeAsync(0);
        expect(mockRunFn).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;', [], expect.any(Function));
        process.nextTick(() => capturedPragmaCallback(null));
        await jest.advanceTimersByTimeAsync(0);

        // Assert: Second promise resolves
        await expect(promise2).resolves.toBeDefined();
        const db2 = await promise2;
        expect(db2.getNativeDriver()).toBe(mockDbInstance); // Check it resolved to the correct instance
    });

    it('should resolve the promise even if PRAGMA command fails (logging a warning)', async () => {
        // Arrange
        const pragmaError = new Error('PRAGMA command failed');
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

        // Act
        const promise = getDBConnection();

        // Assert: Constructor called
        expect(MockDatabaseConstructor).toHaveBeenCalledTimes(1);

        // Act: Simulate connection success
        process.nextTick(() => capturedConstructorCallback(null));
        await jest.advanceTimersByTimeAsync(0);

        // Assert: PRAGMA called
        expect(mockRunFn).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;', [], expect.any(Function));
        expect(capturedPragmaCallback).toBeDefined();

        // Act: Simulate PRAGMA failure
        process.nextTick(() => capturedPragmaCallback(pragmaError));
        await jest.advanceTimersByTimeAsync(0);

        // Assert: Promise still resolves
        await expect(promise).resolves.toBeDefined();
        const db = await promise;
        expect(db.getNativeDriver()).toBe(mockDbInstance);

        // Assert: Warning logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
            '[WARN] Failed to apply PRAGMA settings:',
            pragmaError.message
        );

        consoleErrorSpy.mockRestore();
    });

    // Test kept from previous iteration - verifying the mock helper works
    it('should mock the IDatabaseConnection', async () => {
        const mockDbConnection = createMockDbConnection();

        // Temporarily mock getDBConnection *within this test only*
        // Note: This overrides the module-level mock for this specific 'it' block
        jest.doMock('./db', () => ({
            ...jest.requireActual('./db'), // Keep other exports real if needed
            getDBConnection: jest.fn().mockResolvedValue(mockDbConnection),
            // closeDBConnection: jest.fn().mockResolvedValue(undefined) // Mock close if used
        }));

        // Need to re-require after jest.doMock
        const { getDBConnection: getDBConnectionMocked } = require('./db');

        const db = await getDBConnectionMocked();

        expect(db).toBe(mockDbConnection);
        expect(getDBConnectionMocked).toHaveBeenCalled();

        // Undoes the mock for subsequent tests
        jest.dontMock('./db');
    });
});
