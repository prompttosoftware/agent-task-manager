import fs from 'fs/promises';
import path from 'path';

export interface Issue {
  key: string;
  summary: string;
  description: string;
  status: 'open' | 'in progress' | 'closed';
}

export interface DbSchema {
  issues: Issue[];
  issueKeyCounter: number;
}

const DB_FILE_PATH = "/usr/src/agent-task-manager/.data/db.json";

export async function loadDatabase(): Promise<DbSchema> {
  try {
    const data = await fs.readFile(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, initialize the database
      await initializeDatabase();
      return { issues: [], issueKeyCounter: 0 };
    } else if (error instanceof SyntaxError) {
      console.error("Error parsing JSON in db.json. Initializing an empty database.");
      await initializeDatabase();
      return { issues: [], issueKeyCounter: 0 };
    }
    console.error('Error loading database:', error);
    throw error; // Re-throw to be handled by the caller
  }
}

async function initializeDatabase(): Promise<void> {
  const directoryPath = path.dirname(DB_FILE_PATH);
  try {
    await fs.mkdir(directoryPath, { recursive: true });
  } catch (mkdirError: any) {
    console.error("Error creating directory:", mkdirError);
    throw mkdirError;
  }
  try {
    await fs.writeFile(DB_FILE_PATH, JSON.stringify({ issues: [], issueKeyCounter: 0 }, null, 2), 'utf-8');
  } catch (writeFileError: any) {
    console.error("Error writing to db.json:", writeFileError);
    throw writeFileError;
  }
}

export async function saveDatabase(db: DbSchema): Promise<void> {
  try {
    const jsonString = JSON.stringify(db, null, 2);
    await fs.writeFile(DB_FILE_PATH, jsonString, 'utf-8');
  } catch (error: any) {
    console.error('Error saving database:', error);
    throw error;
  }
}
