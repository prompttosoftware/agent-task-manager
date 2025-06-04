import * as fs from 'fs/promises';
import * as path from 'path';
import { DbSchema } from './DbSchema';
import { AnyIssue } from '../models';

// Define the default database state
const DEFAULT_DB: DbSchema = {
  issues: [],
  issueKeyCounter: 0,
};

// Define the directory and file path for the database.
// Assumes the .data directory is located at the project root,
// which is two levels up from the db/db.ts file.
// Adjust the path accordingly if your project structure is different.
const DATA_DIR = path.join(__dirname, '../../.data');
const DB_FILE_PATH = path.join(DATA_DIR, 'db.json');

/**
 * Loads the database from the db.json file.
 * If the file does not exist or is invalid, initializes with default values
 * and saves the default database to the file.
 * Ensures the .data directory exists before attempting to read/write.
 * @returns A Promise that resolves with the loaded or default database schema.
 * @throws {Error} If there is an unexpected error during file system operations
 *                  other than file not found or JSON parsing errors.
 */
export async function loadDatabase(): Promise<DbSchema> {
  try {
    // Ensure the data directory exists. recursive: true prevents errors if it already exists.
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Attempt to read the database file
    const fileContent = await fs.readFile(DB_FILE_PATH, 'utf8');

    // Attempt to parse the JSON content
    const db = JSON.parse(fileContent);

    // Perform basic validation on the loaded structure
    // Check if essential properties exist and have expected types
    if (typeof db.issueKeyCounter !== 'number' || !Array.isArray(db.issues)) {
        // If the structure is invalid, throw a custom error to trigger the catch block
        // and initialize with the default database.
        throw new Error('Invalid database structure');
    }

    // Return the successfully loaded database
    return db as DbSchema; // Cast to DbSchema type

  } catch (error: any) {
    // If the error is 'file not found' (ENOENT), a JSON parsing error (SyntaxError),
    // or our custom 'Invalid database structure' error, initialize with the default database.
    if (error.code === 'ENOENT' || error instanceof SyntaxError || error.message === 'Invalid database structure') {
      const defaultDb = DEFAULT_DB;

      try {
        // Save the default database to the file, formatted for readability (null, 2)
        await fs.writeFile(DB_FILE_PATH, JSON.stringify(defaultDb, null, 2), 'utf8');
        // Return the default database after saving
        return defaultDb;
      } catch (writeError: any) {
        // If writing the default database fails, log the error and re-throw it
        console.error(`Error saving default database to ${DB_FILE_PATH}:`, writeError);
        throw writeError; // Re-throw the writing error as it indicates a critical issue
      }
    } else {
      // For any other unexpected errors (e.g., permission issues, disk full),
      // log the error and re-throw the original error.
      console.error(`Unexpected error loading database from ${DB_FILE_PATH}:`, error);
      throw error; // Re-throw the original unexpected error
    }
  }
}

/**
 * Saves the provided database schema to the db.json file.
 * Ensures the .data directory exists before attempting to write.
 * @param data The database schema to save.
 * @returns A Promise that resolves when the database is successfully saved.
 * @throws {Error} If there is an unexpected error during file system operations.
 */
export async function saveDatabase(data: DbSchema): Promise<void> {
  try {
    // Ensure the data directory exists.
    await fs.mkdir(DATA_DIR, { recursive: true });

    // Write the database to the file, formatted for readability.
    await fs.writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error: any) {
    console.error(`Error saving database to ${DB_FILE_PATH}:`, error);
    throw error; // Re-throw the error to propagate it to the caller.
  }
}
