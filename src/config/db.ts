import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import path from 'path';

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
 * Interface defining the contract for database operations.
 * This allows decoupling the application logic from the specific database implementation (e.g., sqlite3).
 */
export interface IDatabaseConnection {
    /**
     * Executes an SQL query that doesn't return rows (e.g., INSERT, UPDATE, DELETE, CREATE TABLE).
     * @param sql The SQL query string.
     * @param params Optional parameters for the query.
     * @returns A promise that resolves when the query completes, or rejects on error.
     *          For INSERT operations with `run`, the `this` context inside the promise resolution
     *          (if used traditionally) contains `lastID` and `changes`. To access these,
     *          the underlying implementation might need to expose them differently or
     *          the interface could be expanded. For simplicity, this returns void.
     */
    run(sql: string, params?: any[]): Promise<void>;

    /**
     * Executes an SQL query expected to return a single row.
     * @param sql The SQL query string.
     * @param params Optional parameters for the query.
     * @returns A promise that resolves with the first row found (as an object),
     *          or `undefined` if no rows are found. Rejects on error.
     */
    get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;

    /**
     * Executes an SQL query expected to return multiple rows.
     * @param sql The SQL query string.
     * @param params Optional parameters for the query.
     * @returns A promise that resolves with an array of all rows found (as objects).
     *          The array will be empty if no rows are found. Rejects on error.
     */
    all<T = any>(sql: string, params?: any[]): Promise<T[]>;

    /**
     * Closes the database connection.
     * @returns A promise that resolves when the connection is successfully closed, or rejects on error.
     */
    close(): Promise<void>;

    /**
     * Optional: Provides access to the underlying driver object if needed for specific features.
     * Use with caution as it breaks the abstraction.
     */
    getNativeDriver(): any; // In this case, it would return sqlite3.Database
}

/**
 * Concrete implementation of IDatabaseConnection using the node-sqlite3 library.
 */
class SqliteConnection implements IDatabaseConnection {
    // Private holds the actual sqlite3 database instance.
    private readonly db: sqlite3.Database;

    constructor(dbInstance: sqlite3.Database) {
        this.db = dbInstance;
    }

    run(sql: string, params: any[] = []): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err) { // Use function() to access 'this' if needed later
                if (err) {
                    console.error(`[ERROR] SQL RUN failed: ${sql} | Params: ${params} | Error: ${err.message}`);
                    reject(err);
                } else {
                    // 'this.lastID' and 'this.changes' are available here if needed.
                    // For simplicity, the interface returns void.
                    resolve();
                }
            });
        });
    }

    get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row: T) => {
                if (err) {
                    console.error(`[ERROR] SQL GET failed: ${sql} | Params: ${params} | Error: ${err.message}`);
                    reject(err);
                } else {
                    resolve(row); // row will be undefined if no result
                }
            });
        });
    }

    all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows: T[]) => {
                if (err) {
                    console.error(`[ERROR] SQL ALL failed: ${sql} | Params: ${params} | Error: ${err.message}`);
                    reject(err);
                } else {
                    resolve(rows); // rows will be an empty array if no results
                }
            });
        });
    }

    close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    console.error(`[ERROR] Failed to close database connection:`, err.message);
                    reject(err);
                } else {
                    resolve();
                }
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
                    await connectionWrapper.run('PRAGMA foreign_keys = ON;');
                    console.log("PRAGMA foreign_keys = ON configured successfully.");

                    // await connectionWrapper.run('PRAGMA journal_mode = WAL;');
                    // console.log("PRAGMA journal_mode=WAL configured successfully (improves concurrency).");

                    // Store the successful connection wrapper instance
                    dbInstance = connectionWrapper;
                    resolve(dbInstance);

                } catch (pragmaErr: any) {
                     // Log the error but don't necessarily fail the connection unless critical
                    console.error("[WARN] Failed to apply PRAGMA settings:", pragmaErr.message);
                    // If PRAGMAs are absolutely critical, you might want to close the connection and reject:
                    // await connectionWrapper.close().catch(closeErr => console.error("Error closing DB after PRAGMA failure:", closeErr));
                    // dbInstance = null;
                    // connectionPromise = null;
                    // reject(new Error(`Failed to configure database (PRAGMA): ${pragmaErr.message}`));

                    // Resolve even if non-critical PRAGMA fails, but log the warning.
                    // Storing the instance allows the app to potentially proceed.
                    dbInstance = connectionWrapper;
                    resolve(dbInstance); // Or reject depending on criticality
                }
            }
        });

        // Optional: Handle database-level errors after connection on the native object
        nativeDb.on('error', (error) => {
            console.error('[ERROR] Native database driver emitted error:', error.message);
            // Consider closing the connection or implementing retry logic.
            // If an error occurs here, the dbInstance might be compromised.
            // It might be prudent to nullify dbInstance and connectionPromise and potentially close.
            if (dbInstance) {
                console.log("Attempting to close connection due to database error event...");
                dbInstance.close()
                    .then(() => console.log("Connection closed after error event."))
                    .catch(closeErr => console.error("Error closing connection after error event:", closeErr))
                    .finally(() => {
                        dbInstance = null;
                        connectionPromise = null; // Allow reconnect attempts
                    });
            }
        });
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
 *   use Promises for consistency and better async handling.
 * - **Native Access:** An optional `getNativeDriver()` method is included if direct
 *   access to the underlying `sqlite3.Database` object is strictly necessary,
 *   though using it bypasses the abstraction benefits.
 *
 * This setup provides a good balance between robust SQLite connection management
 * and the benefits of dependency injection for cleaner, more maintainable code.
 */