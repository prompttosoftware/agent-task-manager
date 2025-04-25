import { jest } from '@jest/globals'; // Using @jest/globals for explicit import
import { IDatabaseConnection } from '../config/db'; // Import the interface to be mocked

// --- Native sqlite3 Mock Constants and Functions ---
// Define mock constants based on common usage, actual values don't matter much for mock
export const OPEN_READWRITE = 1 << 1; // Use bit flags similar to real module if needed, or just numbers
export const OPEN_CREATE = 1 << 2;
export const OPEN_READONLY = 1 << 0; // Example

// Shared mock implementations for NATIVE sqlite3.Database methods using jest.fn()
// These are used by the mock Database class below and potentially by getNativeDriver mocks.

/**
 * Mock implementation for NATIVE sqlite3.Database#run
 * Simulates executing SQL that doesn't return rows (INSERT, UPDATE, DELETE, CREATE).
 * Calls the callback with (null) for success by default.
 * Provides dummy `{ lastID: 1, changes: 1 }` in the `this` context of the callback.
 * This is needed to test the *current* implementation of DatabaseService.setSingleValue.
 */
export const mockNativeRun = jest.fn((sql: string, ...args: any[]) => {
    // Extract params and callback, handling different argument orders/types
    let params: any[] = [];
    let callback: ((this: { lastID: number; changes: number }, err: Error | null) => void) | undefined;

    if (args.length > 0) {
        const potentialCallback = args[args.length - 1]; // Callback is typically the last argument

        if (typeof potentialCallback === 'function') {
            callback = potentialCallback;
            if (args.length > 1) {
                 // If there's more than just a callback, assume the args before it are params
                 const potentialParams = args.slice(0, -1);
                 // If a single array was passed as params, use it directly, otherwise treat as varargs
                 if (potentialParams.length === 1 && Array.isArray(potentialParams[0])) {
                     params = potentialParams[0];
                 } else {
                     params = potentialParams;
                 }
            }
        } else {
             // No callback provided, all args are params
             if (args.length === 1 && Array.isArray(args[0])) {
                 params = args[0];
             } else {
                params = args;
             }
        }
    }

    // Simulate async behavior using process.nextTick (or setTimeout(0))
    process.nextTick(() => {
        // console.log(`Mock Native RUN: SQL="${sql}" PARAMS=${JSON.stringify(params)}`); // Optional logging
        if (callback) {
            // Default: Simulate success with standard 'this' context
            try {
                // Provide a default `this` context similar to the real one
                // Tests can override this mock's implementation for specific scenarios (e.g., changes: 0)
                callback.call({ lastID: 1, changes: 1 }, null);
            } catch (e: any) {
                console.error("Error executing mockNativeRun callback:", e);
            }
        }
        // Promise-based usage (like in IDatabaseConnection wrapper) would rely on a different mechanism
    });
});

/**
 * Mock implementation for NATIVE sqlite3.Database#get
 * Simulates fetching a single row.
 * Calls the callback with (null, { id: 1, value: 'mock data' }) for success by default.
 */
export const mockNativeGet = jest.fn((sql: string, ...args: any[]) => {
    // Extract params and callback similarly to mockNativeRun
    let params: any[] = [];
    let callback: ((this: any, err: Error | null, row?: any) => void) | undefined;

     if (args.length > 0) {
        const potentialCallback = args[args.length - 1];

        if (typeof potentialCallback === 'function') {
            callback = potentialCallback;
             if (args.length > 1) {
                 const potentialParams = args.slice(0, -1);
                  if (potentialParams.length === 1 && Array.isArray(potentialParams[0])) {
                     params = potentialParams[0];
                 } else {
                     params = potentialParams;
                 }
             }
        } else {
             if (args.length === 1 && Array.isArray(args[0])) {
                 params = args[0];
             } else {
                 params = args;
             }
        }
    }

    process.nextTick(() => {
        // console.log(`Mock Native GET: SQL="${sql}" PARAMS=${JSON.stringify(params)}`); // Optional logging
        if (callback) {
            // Default: Simulate success with a generic row. Tests can override this.
            callback.call({}, null, { id: 1, value: 'mock data' });
        }
    });
});

/**
 * Mock implementation for NATIVE sqlite3.Database#all
 * Simulates fetching multiple rows.
 * Calls the callback with (null, [{ id: 1, value: 'mock data 1' }, { id: 2, value: 'mock data 2' }]) for success by default.
 */
export const mockNativeAll = jest.fn((sql: string, ...args: any[]) => {
    // Extract params and callback similarly to mockNativeRun
    let params: any[] = [];
    let callback: ((this: any, err: Error | null, rows: any[]) => void) | undefined;

     if (args.length > 0) {
        const potentialCallback = args[args.length - 1];

        if (typeof potentialCallback === 'function') {
            callback = potentialCallback;
             if (args.length > 1) {
                 const potentialParams = args.slice(0, -1);
                  if (potentialParams.length === 1 && Array.isArray(potentialParams[0])) {
                     params = potentialParams[0];
                 } else {
                     params = potentialParams;
                 }
             }
        } else {
             if (args.length === 1 && Array.isArray(args[0])) {
                 params = args[0];
             } else {
                 params = args;
             }
        }
    }

    process.nextTick(() => {
        // console.log(`Mock Native ALL: SQL="${sql}" PARAMS=${JSON.stringify(params)}`); // Optional logging
        if (callback) {
            // Default: Simulate success with a generic list of rows. Tests can override this.
            callback.call({}, null, [{ id: 1, value: 'mock data 1' }, { id: 2, value: 'mock data 2' }]);
        }
    });
});

/**
 * Mock implementation for NATIVE sqlite3.Database#close
 * Simulates closing the database connection.
 * Calls the callback with (null) for success by default.
 */
export const mockNativeClose = jest.fn((...args: any[]) => {
    // Callback is the only optional argument
    const callback = args.find(arg => typeof arg === 'function') as ((err: Error | null) => void) | undefined;

    process.nextTick(() => {
        // console.log('Mock Native CLOSE'); // Optional logging
        if (callback) {
            // Default: Simulate successful close
            callback(null);
        }
    });
});

/**
 * Mock implementation for NATIVE sqlite3.Database#on
 * Simulates adding an event listener (e.g., for 'error' or 'open').
 * Required because the db.ts connection logic attaches an 'error' listener.
 */
export const mockNativeOn = jest.fn((event: string, listener: (...args: any[]) => void) => {
    // console.log(`Mock Native ON: Registering listener for event '${event}'`); // Optional logging
    // Store listeners if needed for more complex simulations (e.g., manually triggering 'error')
    // For basic mocking, just recording the call is often enough.
    return this; // Return `this` to allow chaining if the real API does
});

/**
 * Mock Database class mimicking the NATIVE sqlite3.Database interface needed by the application.
 * This is used by `db.ts` when creating the initial connection.
 */
export class MockNativeDatabase {
    // Store constructor args for potential assertions in tests
    public __filename: string;
    public __mode: number | undefined;
    public __callback: ((err: Error | null) => void) | undefined;

    // Assign the shared NATIVE mock functions to instance methods
    run = mockNativeRun;
    get = mockNativeGet;
    all = mockNativeAll;
    close = mockNativeClose;
    on = mockNativeOn; // Include mock 'on' for event handling

    /**
     * Mock constructor for NATIVE sqlite3.Database.
     * Simulates opening a database connection.
     * Calls the callback with (null) for success by default.
     */
    constructor(filename: string, mode?: number | ((err: Error | null) => void), callback?: (err: Error | null) => void) {
        this.__filename = filename;

        // Handle optional 'mode' argument
        if (typeof mode === 'function') {
            this.__callback = mode;
            this.__mode = undefined; // Or assign a default mode if applicable
        } else {
            this.__mode = mode;
            this.__callback = callback;
        }

        // console.log(`Mock Native Database constructor called for: ${filename}, mode: ${this.__mode}`); // Optional logging

        // Simulate successful connection asynchronously
        process.nextTick(() => {
            if (this.__callback) {
                this.__callback(null); // Simulate success
            }
            // Optionally emit an 'open' event if needed by the code under test
            // find the listener attached via `mockOn` and call it.
        });
    }

    // Add other native methods if needed by the application code (e.g., prepare, exec)
    // prepare = jest.fn().mockReturnThis(); // Example for chaining
    // exec = jest.fn((sql, callback) => { process.nextTick(() => callback?.(null)); }); // Example
}

/**
 * Mock implementation for NATIVE sqlite3.verbose()
 * Returns an object containing the mock Native Database constructor,
 * mimicking the structure returned by the real verbose().
 * This is used in `src/config/db.ts`.
 */
export const mockVerbose = jest.fn(() => {
    // console.log('Mock sqlite3.verbose() called'); // Optional logging
    return {
        Database: MockNativeDatabase, // Return the mock Native Database class itself
        // Include other elements returned by verbose() if necessary
    };
});

// Default export to mimic `import sqlite3 from 'sqlite3'`
// This allows the mock to work with `import sqlite3 from 'sqlite3'` syntax.
// const mockSqlite3 = {
//     Database: MockNativeDatabase,
//     OPEN_READWRITE: OPEN_READWRITE,
//     OPEN_CREATE: OPEN_CREATE,
//     OPEN_READONLY: OPEN_READONLY,
//     verbose: mockVerbose, // Provide the mock verbose function
//     // Add other sqlite3 top-level exports if they are directly used by the application
//     // e.g., Statement: class MockStatement {}, RunResult: {}, etc. if needed
// };

// export default mockSqlite3;