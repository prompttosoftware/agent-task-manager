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

/**
 * Singleton instance of the database connection.
 * Initially null, set upon successful connection.
 * @type {sqlite3.Database | null}
 */
let db: sqlite3.Database | null = null;

/**
 * A promise that resolves with the database connection.
 * Used to prevent multiple connection attempts while one is in progress.
 * @type {Promise<sqlite3.Database> | null}
 */
let connectionPromise: Promise<sqlite3.Database> | null = null;

/**
 * Establishes and retrieves a singleton connection to the SQLite database.
 * Uses environment variables for the database path. Handles connection errors gracefully.
 * Prevents multiple concurrent connection attempts.
 *
 * @returns {Promise<sqlite3.Database>} A promise that resolves with the active database connection instance.
 * @throws {Error} Throws an error if the database connection fails.
 */
export async function getDBConnection(): Promise<sqlite3.Database> {
    // If the connection is already established, return it immediately.
    if (db) {
        return db;
    }

    // If a connection attempt is already in progress, return the existing promise.
    // This prevents race conditions when multiple parts of the app request a connection simultaneously.
    if (connectionPromise) {
        return connectionPromise;
    }

    // Start a new connection attempt. Store the promise.
    connectionPromise = new Promise((resolve, reject) => {
        console.log(`Attempting to connect to database at: ${absoluteDbPath}`);

        // Use the verbose version for better debugging if needed
        const newDb = new verboseSqlite3.Database(absoluteDbPath, (err) => {
            if (err) {
                console.error(`[ERROR] Failed to connect to database at ${absoluteDbPath}:`, err.message);
                connectionPromise = null; // Reset promise on failure to allow retry
                // Explicitly reject with a detailed error message
                reject(new Error(`Database connection failed: ${err.message}`));
            } else {
                console.log(`Successfully connected to the database at ${absoluteDbPath}.`);
                db = newDb; // Store the successful connection instance

                // --- Database Configuration ---
                // It's good practice to configure the connection upon opening.
                // Example: Enable Foreign Key constraint enforcement (recommended for relational integrity)
                db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
                   if (pragmaErr) {
                        // Log the error but don't necessarily fail the connection unless critical
                        console.error("[WARN] Failed to enable PRAGMA foreign_keys:", pragmaErr.message);
                        // If Foreign Keys are absolutely critical, you might want to close the connection and reject:
                        // db?.close();
                        // db = null;
                        // connectionPromise = null;
                        // reject(new Error(`Failed to configure database (foreign_keys): ${pragmaErr.message}`));
                   } else {
                       console.log("PRAGMA foreign_keys = ON configured successfully.");
                   }
                   // Resolve the main connection promise regardless of non-critical pragma errors
                   resolve(db as sqlite3.Database);
                });

                 // Example: Set WAL mode for better concurrency (highly recommended for web applications)
                 /*
                 db.run('PRAGMA journal_mode = WAL;', (pragmaErr) => {
                    if (pragmaErr) {
                        console.error("[WARN] Failed to set PRAGMA journal_mode=WAL:", pragmaErr.message);
                    } else {
                        console.log("PRAGMA journal_mode=WAL configured successfully (improves concurrency).");
                    }
                    // If this were the only configuration, resolve here.
                    // Since we have FK config above, the resolve happens there.
                 });
                 */
            }
        });

        // Optional: Handle database-level errors after connection
        newDb.on('error', (error) => {
            console.error('[ERROR] Database emitted error:', error.message);
            // Depending on the error, you might want to attempt to close the connection
            // or implement retry logic. For now, just logging.
        });
    });

    return connectionPromise;
}

/**
 * Closes the existing database connection gracefully.
 * Idempotent: Does nothing if the connection is already closed or never established.
 *
 * @returns {Promise<void>} A promise that resolves when the connection is closed,
 *                          or immediately if no connection exists. Rejects on closing error.
 */
export async function closeDBConnection(): Promise<void> {
    // If no active connection or connection attempt is in progress, do nothing.
    if (!db && !connectionPromise) {
        console.log('No active database connection or pending connection to close.');
        return Promise.resolve();
    }

    // If a connection attempt is in progress, wait for it to resolve/reject first
    // However, the primary goal is to close the established 'db' instance.
    // If connectionPromise exists but db is null, it means connection failed or is pending.
    // Closing is primarily for the 'db' instance.

    if (!db) {
        console.log('Database connection was pending or failed; nothing to close.');
        // Ensure connectionPromise is cleared if it hasn't resolved yet
        connectionPromise = null;
        return Promise.resolve();
    }

    // Clear the global instance and promise immediately to prevent further use/requests.
    const currentDb = db;
    db = null;
    connectionPromise = null;

    return new Promise((resolve, reject) => {
        console.log(`Closing database connection to ${absoluteDbPath}...`);
        currentDb.close((err) => {
            if (err) {
                console.error(`[ERROR] Failed to close database connection to ${absoluteDbPath}:`, err.message);
                // Reject the promise, indicating cleanup was not fully successful
                reject(new Error(`Failed to close database: ${err.message}`));
            } else {
                console.log(`Database connection to ${absoluteDbPath} closed successfully.`);
                resolve();
            }
        });
    });
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

// Listen for termination signals commonly used
process.on('SIGINT', () => gracefulShutdown('SIGINT')); // Interrupt from keyboard (Ctrl+C)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')); // Termination signal (e.g., from Docker, systemd)
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT')); // Quit from keyboard (Ctrl+\)

// Optional: Handle unhandled promise rejections or uncaught exceptions
// These might indicate issues that require stopping the application
// process.on('uncaughtException', (error) => {
//   console.error('Uncaught Exception:', error);
//   // Consider attempting graceful shutdown here as well, but be cautious
//   // as the application state might be unstable.
//   gracefulShutdown('uncaughtException').finally(() => process.exit(1));
// });

// process.on('unhandledRejection', (reason, promise) => {
//   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
//   // Consider attempting graceful shutdown
//   gracefulShutdown('unhandledRejection').finally(() => process.exit(1));
// });


/*
 * Note on Connection Pooling for SQLite:
 * SQLite is an embedded database, operating directly on a single file.
 * Traditional connection pooling (managing multiple network connections to a server)
 * isn't directly applicable. The `sqlite3` library manages file access.
 *
 * This implementation uses a singleton pattern for the database connection:
 * 1. **Efficiency:** Avoids the overhead of opening/closing the DB file repeatedly.
 * 2. **Standard Practice:** This is the common way to use `sqlite3` in Node.js.
 * 3. **Concurrency:** SQLite handles concurrency via file locking. For better
 *    read/write concurrency, consider enabling WAL mode (`PRAGMA journal_mode = WAL;`),
 *    which allows multiple readers to operate concurrently with a single writer.
 *    This is often beneficial for web applications. (Example included in connection setup).
 *
 * This refactored code provides robust management of the single SQLite connection,
 * leverages environment variables for configuration, includes enhanced error handling,
 * and ensures resources are released on application shutdown.
 */