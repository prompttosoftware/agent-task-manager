import fs from 'fs/promises';
import path from 'path';

export const DB_FILE_PATH = '/usr/src/agent-task-manager/.data/db.json';

export interface Issue {
  key: string;
  summary: string;
  description?: string;
  status: string;
}

export interface DbSchema {
  issues: Issue[];
  issueKeyCounter: number;
}

export async function loadDatabase(): Promise<DbSchema> {
  try {
    const data = await fs.readFile(DB_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Handle file not found or invalid JSON
    if ((error as any).code === 'ENOENT') {
      // Create the .data directory if it doesn't exist
      const dirPath = path.dirname(DB_FILE_PATH);
      await fs.mkdir(dirPath, { recursive: true });
      return { issues: [], issueKeyCounter: 0 };
    }
    throw error; // Re-throw other errors
  }
}

export async function saveDatabase(data: DbSchema): Promise<void> {
  try {
    await fs.writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Error saving database:", error);
    throw error;
  }
}
