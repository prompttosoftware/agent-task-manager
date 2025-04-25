import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import path from 'path';
import { EventEmitter } from 'events'; // Import EventEmitter for interface compatibility

// Load environment variables from .env file (optional, good for development)
// Create a .env file in your project root with DATABASE_PATH=./your_database_name.db if needed
dotenv.config();

// Get the database file path from environment variables or use a default
const defaultDbPath = './database.db';
// Use || for default value, ensuring an empty string doesn't cause issues
const dbPath = process.env.DATABASE_PATH || defaultDbPath;
// Resolve to an absolute path for clarity in logs and potential relative path issues
const absoluteDbPath = path.resolve(dbPath);

// Enhance logging with sqlite3.verbose()
const verboseSqlite3 = sqlite3.verbose();

// --- Dependency Injection Setup ---

/**
 * Represents the result of a `run` operation.
 */
export interface RunResult {
    /**
     * The row ID of the last row inserted into the database (if the statement was an INSERT).
     * Access using `this.lastID` in the underlying sqlite3 callback.
     */
    lastID: number;
    /**
     * The number of rows affected by the query (if the statement was an UPDATE or DELETE).
     * Access using `this.changes` in the underlying sqlite3 callback.
     */
    changes: number;
}

/**
 * Interface defining the contract for database operations, mirroring the essential
 * asynchronous capabilities of `sqlite3.Database` using Promises and including
 * common methods and event emitter capabilities.
 */
export interface IDatabaseConnection extends EventEmitter {
    /**
     * Executes an SQL query that doesn't return rows (e.g., INSERT, UPDATE, DELETE, CREATE TABLE).
     * @param sql The SQL query string.
     * @param params Optional parameters for the query. Can be an array, object, or single value.
     * @returns A promise that resolves with an object containing `lastID` and `changes`, or rejects on error.
     */
    run(sql: string, ...params: any[]): Promise<RunResult>;
    run(sql: string, params?: any): Promise<RunResult>; // Overload for single param object/array

    /**
     * Executes an SQL query expected to return a single row.
     * @param sql The SQL query string.
     * @param params Optional parameters for the query. Can be an array, object, or single value.
     * @returns A promise that resolves with the first row found (as an object of type T),
     *          or `undefined` if no rows are found. Rejects on error.
     */
    get<T = any>(sql: string, ...params: any[]): Promise<T | undefined>;
    get<T = any>(sql: string, params?: any): Promise<T | undefined>; // Overload for single param object/array

    /**
     * Executes an SQL query expected to return multiple rows.
     * @param sql The SQL query string.
     * @param params Optional parameters for the query. Can be an array, object, or single value.
     * @returns A promise that resolves with an array of all rows found (as objects of type T).
     *          The array will be empty if no rows are found. Rejects on error.
     */
    all<T = any>(sql: string, ...params: any[]): Promise<T[]>;
    all<T = any>(sql: string, params?: any): Promise<T[]>; // Overload for single param object/array

    /**
     * Executes all SQL queries in the supplied string.
     * This function performsStatements sequentially. It will not wrap results using `Promise.all`.
     * If an error occurs, execution stops. No results are returned.
     * @param sql The SQL query string, potentially containing multiple statements separated by semicolons.
     * @returns A promise that resolves when all statements complete successfully, or rejects on the first error.
     */
    exec(sql: string): Promise<void>;

    /**
     * Executes the SQL query with the specified parameters and calls a callback for each result row.
     * Note: This promise resolves *after* all rows have been processed and the optional `complete` callback has run.
     * The original sqlite3 `each` method is callback-based; this adapts it to Promises while still allowing row-by-row processing.
     * @param sql The SQL query string.
     * @param params Optional parameters for the query. Can be an array, object, or single value.
     * @param rowCallback A function called for each row retrieved. If it throws, the promise rejects.
     * @returns A promise that resolves with the total number of rows retrieved after processing all rows, or rejects on error.
     */
    each<T = any>(sql: string, params: any, rowCallback: (row: T) => void): Promise<number>;
    each<T = any>(sql: string, rowCallback: (row: T) => void): Promise<number>; // Overload without params
    each<T = any>(sql: string, ...paramsWithCallback: any[]): Promise<number>; // Overload for spread params

    /**
     * Prepares an SQL statement for later execution.
     * Note: This returns a Promise resolving to an object mimicking `sqlite3.Statement`.
     * You might want a dedicated `IStatement` interface for stricter typing if using this heavily.
     * @param sql The SQL query string.
     * @param params Optional parameters to bind initially.
     * @returns A promise that resolves with a Statement object, or rejects on error.
     */
    prepare(sql: string, ...params: any[]): Promise<sqlite3.Statement>; // Using sqlite3.Statement for simplicity, could define IStatement
    prepare(sql: string, params?: any): Promise<sqlite3.Statement>; // Overload for single param object/array


    /**
     * Closes the database connection.
     * @returns A promise that resolves when the connection is successfully closed, or rejects on error.
     */
    close(): Promise<void>;

    /**
     * Sets configuration options for the database connection.
     * Example: `configure('busyTimeout', 3000)`
     * @param option The configuration option name (e.g., 'busyTimeout').
     * @param value The value to set for the option.
     * @returns A promise that resolves when configuration is set, or rejects on error (though `configure` itself is synchronous in sqlite3).
     */
    configure(option: string, value: any): Promise<void>;

    /**
     * Serializes database operations. Callbacks passed to `serialize` are executed sequentially.
     * @param callback A function containing database operations to be serialized.
     * @returns A promise that resolves when the callback completes, or rejects if the callback throws an error.
     */
    serialize(callback: () => void | Promise<void>): Promise<void>;

    /**
     * Parallelizes database operations. Callbacks passed to `parallelize` are executed in parallel.
     * @param callback A function containing database operations to be parallelized.
     * @returns A promise that resolves when the callback completes, or rejects if the callback throws an error.
     */
    parallelize(callback: () => void | Promise<void>): Promise<void>;

    /**
     * Provides access to the underlying native `sqlite3.Database` object.
     * Use with caution as it breaks the abstraction provided by the interface.
     * @returns The underlying `sqlite3.Database` instance.
     */
    getNativeDriver(): sqlite3.Database;

    // Inherited from EventEmitter (makes the interface compatible with db instance)
    // on(event: string | symbol, listener: (...args: any[]) => void): this;
    // once(event: string | symbol, listener: (...args: any[]) => void): this;
    // emit(event: string | symbol, ...args: any[]): boolean;
    // etc.
}


/**
 * Concrete implementation of IDatabaseConnection using the node-sqlite3 library.
 * Inherits from EventEmitter to allow proxying events from the underlying db.
 */
class SqliteConnection extends EventEmitter implements IDatabaseConnection {
    // Private holds the actual sqlite3 database instance.
    private readonly db: sqlite3.Database;

    constructor(dbInstance: sqlite3.Database) {
        super(); // Call EventEmitter constructor
        this.db = dbInstance;

        // Proxy common events from the native driver to this wrapper
        this.db.on('open', (...args) => this.emit('open', ...args));
        this.db.on('close', (...args) => this.emit('close', ...args));
        this.db.on('error', (...args) => this.emit('error', ...args));
        // Add other events if needed (e.g., 'profile', 'trace')
    }

    // Helper to handle parameter variations (array, object, single value, spread)
    private normalizeParams(params?: any | any[]): any[] {
        if (params === undefined || params === null) {
            return [];
        }
        // If the first argument after sql is the callback (for 'each'), params are empty
         if (typeof params === 'function') {
             return [];
         }
        // If it's already an array, use it
        if (Array.isArray(params)) {
            return params;
        }
        // If it's an object or a single value, wrap it in an array
        // Note: sqlite3 handles objects for named parameters ($:name)
        return [params];
    }

    run(sql: string, ...params: any[]): Promise<RunResult> {
         return new Promise((resolve, reject) => {
            // The actual parameters sent to node-sqlite3 might be the first element
            // if the user passed an array/object as the single 'params' argument,
            // or the whole 'params' array if they used spread syntax.
            // node-sqlite3's signature handles this flexibly.
            this.db.run(sql, params, function (err) { // Use function() to access 'this'
                if (err) {
                    console.error(`[ERROR] SQL RUN failed: ${sql} | Params: ${JSON.stringify(params)} | Error: ${err.message}`);
                    reject(err);
                } else {
                    // 'this' inside the callback refers to the sqlite3 Statement object
                    resolve({ lastID: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get<T = any>(sql: string, ...params: any[]): Promise<T | undefined> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row: T | undefined) => {
                if (err) {
                    console.error(`[ERROR] SQL GET failed: ${sql} | Params: ${JSON.stringify(params)} | Error: ${err.message}`);
                    reject(err);
                } else {
                    resolve(row); // row will be undefined if no result
                }
            });
        });
    }

    all<T = any>(sql: string, ...params: any[]): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows: T[]) => {
                if (err) {
                    console.error(`[ERROR] SQL ALL failed: ${sql} | Params: ${JSON.stringify(params)} | Error: ${err.message}`);
                    reject(err);
                } else {
                    resolve(rows ?? []); // Ensure array, even if undefined/null returned
                }
            });
        });
    }

    exec(sql: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.exec(sql, (err) => {
                if (err) {
                    console.error(`[ERROR] SQL EXEC failed: ${sql} | Error: ${err.message}`);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

     // Implementation needs to handle different parameter patterns for 'each'
     each<T = any>(sql: string, ...paramsWithCallback: any[]): Promise<number> {
        return new Promise((resolve, reject) => {
            const callbackIndex = paramsWithCallback.findIndex(p => typeof p === 'function');
            if (callbackIndex === -1) {
                return reject(new Error("No row callback function provided to each()"));
            }

            const rowCallback = paramsWithCallback[callbackIndex] as (row: T) => void;
            const params = paramsWithCallback.slice(0, callbackIndex);

            let rowCount = 0;
            let callbackError: Error | null = null; // Track errors within rowCallback

            this.db.each(sql, params,
                (err: Error | null, row: T) => { // Row processing callback
                    if (err) {
                        // Error during query execution itself
                        console.error(`[ERROR] SQL EACH (row processing) failed: ${sql} | Params: ${JSON.stringify(params)} | Error: ${err.message}`);
                        // Ensure completion callback isn't called if we reject here
                        callbackError = err; // Store error to reject in completion handler
                        return; // Stop processing rows
                    }
                     if (callbackError) return; // Stop if rowCallback already failed

                    try {
                         // Check if row is valid before calling callback (sometimes sqlite3 might call with undefined on empty results, though less common with each)
                        if (row !== undefined && row !== null) {
                             rowCallback(row);
                             rowCount++;
                        }
                    } catch (e: any) {
                         console.error(`[ERROR] Error inside SQL EACH row callback: ${e.message}`);
                         callbackError = e instanceof Error ? e : new Error(String(e));
                         // Do not reject immediately, let the 'complete' callback handle it
                    }
                },
                (err: Error | null, count: number) => { // Completion callback
                    if (callbackError) { // Prioritize error from rowCallback
                         reject(callbackError);
                    } else if (err) {
                        // Error during the finalization of the 'each' operation
                        console.error(`[ERROR] SQL EACH (completion) failed: ${sql} | Params: ${JSON.stringify(params)} | Error: ${err.message}`);
                        reject(err);
                    } else {
                         // count provided by sqlite3 might differ from rowCount if rowCallback skipped rows
                        resolve(rowCount);
                    }
                }
            );
        });
    }


    prepare(sql: string, ...params: any[]): Promise<sqlite3.Statement> {
        return new Promise((resolve, reject) => {
            // The 'prepare' method in sqlite3 can accept a callback, but it's often
            // used synchronously or chained. We wrap it in a promise.
            // The actual parameters are handled similarly to run/get/all.
            const stmt = this.db.prepare(sql, params, (err) => {
                if (err) {
                    console.error(`[ERROR] SQL PREPARE failed: ${sql} | Params: ${JSON.stringify(params)} | Error: ${err.message}`);
                    reject(err);
                }
                // Note: The callback in prepare is called *after* preparation, potentially
                // indicating an error. If no error, the statement object `stmt` is already created.
                // We resolve with `stmt` outside the callback if no immediate error is thrown by prepare itself.
            });

             // Check if prepare threw an immediate synchronous error (less common but possible)
             // or if the callback was invoked with an error asynchronously.
             // Since the callback handles rejection, we just need to resolve if stmt is valid.
             // A simple way is to check the stmt object itself, though relying on the callback is safer.
             // Let's refine: The callback IS the primary mechanism for async errors here.

             // Correction: The callback passed to prepare IS the error handler.
             // If the callback runs *without* an error, it means preparation succeeded.
             // If prepare itself throws synchronously, the promise constructor will catch it.
             if (!stmt && !params.find(p => typeof p === 'function')) {
                // If stmt is somehow null/undefined AND no callback was provided in params
                // (which we handle inside the promise executor), assume failure.
                // This case is unlikely with standard usage.
                // console.error(`[ERROR] SQL PREPARE failed synchronously: ${sql}`);
                // reject(new Error(`SQL PREPARE failed synchronously for: ${sql}`));
                // Let the callback handle rejection based on `err`. If no callback was passed, errors might be missed.
                // Let's assume the callback *will* be called by sqlite3 even if just with `null`.
             }
             // The promise resolves *only* when the callback runs without error
             const originalCallback = params.find(p => typeof p === 'function');
             if (!originalCallback) {
                 // If no user callback provided, resolve successfully immediately *after* prepare returns,
                 // assuming synchronous errors are caught by Promise constructor.
                 // *However*, prepare errors *are* typically reported via its own callback mechanism.
                 // Safest approach: always rely on the callback we provided.
                 // Re-evaluate: The callback in the above `this.db.prepare` *is* the one determining success/failure.
                 // We need to resolve *inside* the callback if err is null.

                 // Revised Promise structure for prepare:
                 this.db.prepare(sql, params, (err) => { // Re-pass params
                     if (err) {
                         console.error(`[ERROR] SQL PREPARE failed: ${sql} | Params: ${JSON.stringify(params)} | Error: ${err.message}`);
                         reject(err);
                     } else {
                         // stmt should be valid here if no error occurred
                         resolve(stmt);
                     }
                 });

             } else {
                 // If user provided a callback, it's part of 'params'.
                 // We still need our *own* callback wrapper to resolve/reject the promise.
                 // The structure gets complex. Simpler: Let sqlite3 handle the user's callback.
                 // We just need to know if prepare succeeded.
                 const stmt = this.db.prepare(sql, ...params); // Call without our wrapper callback
                 // How to detect async errors now? The user's callback handles it, but doesn't affect our promise.
                 // This suggests `prepare` might not fit a simple Promise model well if user callbacks are involved.

                 // Simplest Promise wrapper: Assume prepare is mostly synchronous or errors immediately.
                 // Let the callback handle the resolution/rejection.
                  return new Promise((resolve, reject) => {
                     const stmt = this.db.prepare(sql, params, (err: Error | null) => {
                         if (err) {
                             console.error(`[ERROR] SQL PREPARE failed: ${sql} | Params: ${JSON.stringify(params)} | Error: ${err.message}`);
                             reject(err);
                         } else {
                             // Resolve with the statement *instance* created by prepare
                             resolve(stmt);
                         }
                     });
                 });

             }

             // Fallback resolve if no callback logic fires and no sync error (less safe)
             // resolve(stmt); // This might resolve too early before async error check
        });
    }

    close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    console.error(`[ERROR] Failed to close database connection:`, err.message);
                    reject(err);
                } else {
                    this.emit('close'); // Emit close event on successful close
                    resolve();
                }
            });
        });
    }

    configure(option: string, value: any): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                // configure is synchronous in node-sqlite3
                this.db.configure(option as any, value); // Use 'as any' to bypass strict typing if needed
                resolve();
            } catch (err: any) {
                 console.error(`[ERROR] Failed to configure option '${option}':`, err.message);
                reject(err);
            }
        });
    }

    // Wrap serialize/parallelize to work with async callbacks potentially
    private async wrapMode(mode: 'serialize' | 'parallelize', callback: () => void | Promise<void>): Promise<void> {
         return new Promise<void>((resolve, reject) => {
            const modeFn = mode === 'serialize' ? this.db.serialize : this.db.parallelize;
            modeFn.call(this.db, async () => { // Ensure the callback context is the db
                try {
                    const result = callback();
                    // If the callback returns a promise, wait for it
                    if (result instanceof Promise) {
                        await result;
                    }
                    // Resolve the outer promise *after* the callback finishes
                     // Note: Resolution happens implicitly when the serialize/parallelize block finishes in sqlite3
                     // We might not need explicit resolve here if errors are caught.
                } catch (error) {
                    // Reject the outer promise if the callback throws
                    console.error(`[ERROR] Error during ${mode} execution:`, error);
                    reject(error);
                }
            });
             // If the callback was synchronous and didn't throw, the block completes.
             // How to signal completion? The serialize/parallelize methods don't provide a direct callback for *their* completion.
             // Let's assume successful completion if no error is thrown from the callback.
             // Refined approach: The promise resolves when the mode block completes naturally,
             // and rejects ONLY if the callback throws an error that we catch.
             // We need a way to signal completion AFTER the block. This is tricky.

             // Alternative: Rely on the fact that operations *within* the callback
             // are awaited if async. The promise resolves when the sync callback completes.
              modeFn.call(this.db, () => {
                 Promise.resolve() // Start a microtask
                     .then(callback) // Execute user callback
                     .then(resolve) // Resolve outer promise if callback succeeds
                     .catch(reject); // Reject outer promise if callback fails
             });

         });
    }

     serialize(callback: () => void | Promise<void>): Promise<void> {
         // Use Promise executor to wrap the call
         return new Promise((resolve, reject) => {
             this.db.serialize(() => {
                 Promise.resolve()
                     .then(callback)
                     .then(resolve) // Resolve outer promise on success
                     .catch(reject); // Reject outer promise on failure
             });
         });
     }

     parallelize(callback: () => void | Promise<void>): Promise<void> {
         // Use Promise executor to wrap the call
         return new Promise((resolve, reject) => {
             this.db.parallelize(() => {
                 Promise.resolve()
                     .then(callback)
                     .then(resolve) // Resolve outer promise on success
                     .catch(reject); // Reject outer promise on failure
             });
         });
     }


    getNativeDriver(): sqlite3.Database {
        return this.db;
    }
}


// --- Singleton Connection Management ---

/**
 * Singleton instance of the database connection wrapper.
 * Initially null, set upon successful connection.
 * @type {IDatabaseConnection | null}
 */
let dbInstance: IDatabaseConnection | null = null;

/**
 * A promise that resolves with the database connection wrapper.
 * Used to prevent multiple connection attempts while one is in progress.
 * @type {Promise<IDatabaseConnection> | null}
 */
let connectionPromise: Promise<IDatabaseConnection> | null = null;

/**
 * Establishes and retrieves a singleton connection to the SQLite database,
 * returning an object conforming to the IDatabaseConnection interface.
 * Uses environment variables for the database path. Handles connection errors gracefully.
 * Prevents multiple concurrent connection attempts.
 *
 * @returns {Promise<IDatabaseConnection>} A promise that resolves with the active database connection instance wrapper.
 * @throws {Error} Throws an error if the database connection fails.
 */
export async function getDBConnection(): Promise<IDatabaseConnection> {
    // If the connection instance is already established, return it immediately.
    if (dbInstance) {
        return dbInstance;
    }

    // If a connection attempt is already in progress, return the existing promise.
    if (connectionPromise) {
        return connectionPromise;
    }

    // Start a new connection attempt. Store the promise.
    connectionPromise = new Promise((resolve, reject) => {
        console.log(`Attempting to connect to database at: ${absoluteDbPath}`);

        // Use the verbose version for better debugging if needed
        const nativeDb = new verboseSqlite3.Database(absoluteDbPath, async (err) => { // Make callback async
            if (err) {
                console.error(`[ERROR] Failed to connect to database at ${absoluteDbPath}:`, err.message);
                connectionPromise = null; // Reset promise on failure to allow retry
                reject(new Error(`Database connection failed: ${err.message}`));
            } else {
                console.log(`Successfully connected to the database at ${absoluteDbPath}.`);

                // Wrap the native connection in our interface implementation
                const connectionWrapper = new SqliteConnection(nativeDb);

                try {
                    // --- Database Configuration (using the wrapper) ---
                    // Example using the new configure method
                    await connectionWrapper.configure('busyTimeout', 5000); // Set 5 second busy timeout
                    console.log("Database configured with busyTimeout=5000.");

                    await connectionWrapper.run('PRAGMA foreign_keys = ON;');
                    console.log("PRAGMA foreign_keys = ON configured successfully.");

                    // await connectionWrapper.run('PRAGMA journal_mode = WAL;');
                    // console.log("PRAGMA journal_mode=WAL configured successfully (improves concurrency).");


                    // Store the successful connection wrapper instance
                    dbInstance = connectionWrapper;
                    resolve(dbInstance);

                } catch (pragmaErr: any) {
                     // Log the error but don't necessarily fail the connection unless critical
                    console.error("[WARN] Failed to apply initial database settings (PRAGMA/configure):", pragmaErr.message);
                    // If settings are absolutely critical, you might want to close the connection and reject:
                    // await connectionWrapper.close().catch(closeErr => console.error("Error closing DB after config failure:", closeErr));
                    // dbInstance = null;
                    // connectionPromise = null;
                    // reject(new Error(`Failed to configure database: ${pragmaErr.message}`));

                    // Resolve even if non-critical settings fail, but log the warning.
                    // Storing the instance allows the app to potentially proceed.
                    dbInstance = connectionWrapper;
                    resolve(dbInstance); // Or reject depending on criticality
                }
            }
        });

        // We don't need the separate nativeDb.on('error') handler here anymore,
        // because the SqliteConnection wrapper now proxies the 'error' event.
        // Consumers can listen on the dbInstance itself if needed:
        // getDBConnection().then(conn => conn.on('error', handler));
    });

    return connectionPromise;
}

/**
 * Closes the existing database connection gracefully using the connection wrapper.
 * Idempotent: Does nothing if the connection is already closed or never established.
 *
 * @returns {Promise<void>} A promise that resolves when the connection is closed,
 *                          or immediately if no connection exists. Rejects on closing error.
 */
export async function closeDBConnection(): Promise<void> {
     // If no active connection or connection attempt is in progress, do nothing.
    if (!dbInstance && !connectionPromise) {
        console.log('No active database connection or pending connection to close.');
        return Promise.resolve();
    }

    // If a connection attempt is in progress but hasn't resolved to dbInstance yet
    if (!dbInstance && connectionPromise) {
        console.log('Database connection is pending; waiting for it to potentially resolve before closing attempt...');
        try {
            // Wait for the pending connection to complete (either succeed or fail)
            await connectionPromise;
            // If it succeeded, dbInstance should now be set. If it failed, dbInstance is still null.
        } catch (error) {
            // Connection attempt failed, nothing to close
            console.log('Pending connection failed, nothing to close.');
            connectionPromise = null; // Clear the failed promise
            return Promise.resolve();
        }
        // Check dbInstance again after waiting
        if (!dbInstance) {
             console.log('Database connection failed to establish; nothing to close.');
             connectionPromise = null; // Ensure promise is cleared if it somehow resolved without setting dbInstance
             return Promise.resolve();
        }
    }

    // At this point, dbInstance should be valid if a connection was successfully made.
    // Clear the global instance and promise immediately to prevent further use/requests.
    const currentDbInstance = dbInstance;
    dbInstance = null;
    connectionPromise = null; // Also clear promise if closing a resolved connection

    if (!currentDbInstance) {
        // Should not happen if logic above is correct, but as a safeguard:
        console.log('No valid database instance found to close.');
        return Promise.resolve();
    }


    console.log(`Closing database connection to ${absoluteDbPath}...`);
    try {
        // Use the close method from our interface implementation
        await currentDbInstance.close();
        console.log(`Database connection to ${absoluteDbPath} closed successfully.`);
    } catch (error: any) {
        console.error(`[ERROR] Failed to close database connection to ${absoluteDbPath}:`, error.message);
        // Reject the promise, indicating cleanup was not fully successful
        throw new Error(`Failed to close database: ${error.message}`); // Re-throw or handle as needed
    }
}

// --- Graceful Shutdown Handling ---

// Flag to prevent multiple shutdowns
let isShuttingDown = false;

/**
 * Handles graceful shutdown procedures, primarily closing the database connection.
 * @param {string} signal - The signal received (e.g., 'SIGINT', 'SIGTERM').
 */
async function gracefulShutdown(signal: string) {
    if (isShuttingDown) {
        console.log('Shutdown already in progress...');
        return;
    }
    isShuttingDown = true;
    console.log(`Received ${signal}. Initiating graceful shutdown...`);

    try {
        await closeDBConnection();
        console.log('Graceful shutdown completed.');
        process.exit(0); // Exit normally
    } catch (error) {
        console.error('[ERROR] Error during graceful shutdown:', error);
        process.exit(1); // Exit with an error code
    }
}

// Listen for termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));

// Optional: Handle unhandled promise rejections or uncaught exceptions
// process.on('uncaughtException', (error) => {
//   console.error('Uncaught Exception:', error);
//   gracefulShutdown('uncaughtException').finally(() => process.exit(1));
// });
// process.on('unhandledRejection', (reason, promise) => {
//   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
//   gracefulShutdown('unhandledRejection').finally(() => process.exit(1));
// });

/*
 * Note on Dependency Injection and SQLite:
 * This refactoring introduces an `IDatabaseConnection` interface and an
 * `SqliteConnection` implementation.
 * - **Decoupling:** Your application code (services, repositories) can now depend
 *   on the `IDatabaseConnection` interface instead of the concrete `sqlite3.Database`.
 *   This makes your code more testable (you can mock the interface) and potentially
 *   easier to migrate to a different database system in the future.
 * - **Singleton Management:** The singleton pattern for managing the connection
 *   is maintained but now manages an instance conforming to `IDatabaseConnection`.
 * - **Interface Methods:** The interface methods (`run`, `get`, `all`, `close`)
 *   use Promises for consistency and better async handling. More methods like `exec`,
 *   `each`, `prepare`, `configure`, `serialize`, `parallelize` have been added to
 *   more closely match sqlite3 capabilities, adapted for Promises where appropriate.
 * - **Event Emitter:** The interface and implementation now extend EventEmitter, allowing
 *   consumers to listen for 'open', 'close', 'error' events proxied from the native driver.
 * - **Native Access:** An optional `getNativeDriver()` method is included if direct
 *   access to the underlying `sqlite3.Database` object is strictly necessary,
 *   though using it bypasses the abstraction benefits.
 *
 * This setup provides a good balance between robust SQLite connection management
 * and the benefits of dependency injection for cleaner, more maintainable code.
 */