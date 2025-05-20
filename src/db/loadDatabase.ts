import fs from 'fs/promises';
import path from 'path';
import { DbSchema } from '../models/DbSchema';
import { DB_FILE_PATH } from './constants';

/**
 * Loads the database from the specified file path.
 * If the file does not exist or contains invalid JSON, it initializes a default empty database.
 * It also ensures the directory structure exists before attempting to read.
 *
 * @returns {Promise<DbSchema>} A promise that resolves with the database schema object.
 * @throws {Error} Throws other errors that occur during file reading (e.g., permissions).
 */
export async function loadDatabase(): Promise<DbSchema> {
  try {
    const data = await fs.readFile(DB_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Handle file not found or invalid JSON
    const dirPath = path.dirname(DB_FILE_PATH);
    // Ensure directory exists before attempting to read (though readFile will fail first)
    // This mkdir call might be redundant here but was present in the original code,
    // and it doesn't hurt to ensure the directory exists before potential write operations later.
    await fs.mkdir(dirPath, { recursive: true });

    if ((error as any).code === 'ENOENT' || error instanceof SyntaxError) {
      // If file doesn't exist or is invalid JSON, return a default structure
      return { issues: [], issueKeyCounter: 0 };
    }
    // Re-throw any other type of error
    throw error;
  }
}
