// src/dataStore.ts

import { DbSchema, AnyIssue } from './models';
import * as fs from 'fs/promises';
import * as path from 'path';

const DB_FILE_PATH = '/usr/src/agent-task-manager/.data/db.json';

/**
 * Saves the database to a JSON file.
 * @param db The database schema to save.
 */
async function saveDatabase(db: DbSchema): Promise<void> {
  const jsonData = JSON.stringify(db);
  await fs.mkdir(path.dirname(DB_FILE_PATH), { recursive: true }); // Ensure directory exists
  await fs.writeFile(DB_FILE_PATH, jsonData, 'utf8');
}

/**
 * Loads the database from a JSON file.
 * If the file doesn't exist or is invalid, initializes with default values.
 * @returns A promise that resolves with the database schema.
 */
async function loadDatabase(): Promise<DbSchema> {
  try {
    // Check if file exists before attempting to read
    await fs.access(DB_FILE_PATH, fs.constants.F_OK);
    const data = await fs.readFile(DB_FILE_PATH, 'utf8');
    const parsedData: DbSchema = JSON.parse(data);
    return parsedData;
  } catch (error) {
    // If file doesn't exist (handled by fs.access throwing ENOENT)
    // or JSON is invalid (handled by JSON.parse throwing a SyntaxError)
    // Initialize with default values, ensure directory exists, and save the default.
    const defaultData: DbSchema = { issues: [], issueKeyCounter: 0 };
    await fs.mkdir(path.dirname(DB_FILE_PATH), { recursive: true }); // Create .data directory if it doesn't exist
    await saveDatabase(defaultData); // Save the default data to the file
    return defaultData;
  }
}

export { loadDatabase, saveDatabase, DB_FILE_PATH };
