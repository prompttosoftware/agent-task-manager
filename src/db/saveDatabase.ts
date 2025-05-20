import fs from 'fs/promises';
import path from 'path';
import { DbSchema } from '../models/DbSchema';
import { DB_FILE_PATH } from './constants';

/**
 * Saves the provided database schema object to the specified file path.
 * The data is written as a pretty-printed JSON string.
 * Ensures the directory structure exists before writing the file.
 *
 * @param {DbSchema} data - The database schema object to save.
 * @returns {Promise<void>} A promise that resolves when the database has been successfully saved.
 * @throws {Error} Throws any error that occurs during the file writing process.
 */
export async function saveDatabase(data: DbSchema): Promise<void> {
  try {
    const dirPath = path.dirname(DB_FILE_PATH);
    await fs.mkdir(dirPath, { recursive: true }); // Ensure directory exists before writing

    await fs.writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    throw error;
  }
}
