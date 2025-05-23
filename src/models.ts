import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';

const DB_FILE_PATH = '/usr/src/agent-task-manager/.data/db.json';

// BaseIssue interface
/**
 * Represents the base properties of an issue.
 */
interface BaseIssue {
  id: string; // UUID
  key: string;
  issueType: "Task" | "Story" | "Epic" | "Bug" | "Subtask";
  summary: string;
  description?: string;
  status: "Todo" | "In Progress" | "Done";
  createdAt: string; // ISO8601
  updatedAt: string; // ISO8601
}

// Epic Specifics
/**
 * Represents the specifics of an Epic issue.
 */
interface EpicSpecifics {
  childIssueKeys: string[];
}

// Subtask Specifics
/**
 * Represents the specifics of a Subtask issue.
 */
interface SubtaskSpecifics {
  parentIssueKey: string;
}

// Concrete issue types
/**
 * Represents a Task issue.
 */
interface Task extends BaseIssue {}
/**
 * Represents a Story issue.
 */
interface Story extends BaseIssue {}
/**
 * Represents a Bug issue.
 */
interface Bug extends BaseIssue {}
/**
 * Represents an Epic issue.
 */
interface Epic extends BaseIssue, EpicSpecifics {}
/**
 * Represents a Subtask issue.
 */
interface Subtask extends BaseIssue, SubtaskSpecifics {}

// Union type
/**
 * Represents any type of issue.
 */
type AnyIssue = Task | Story | Epic | Bug | Subtask;

// DbSchema interface
/**
 * Represents the database schema.
 */
interface DbSchema {
  issues: AnyIssue[];
  issueKeyCounter: number;
}

/**
 * Loads the database from a JSON file.
 * @returns {Promise<DbSchema>} The database data.  If the file does not exist or is invalid, it initializes and returns a new database schema.
 */
async function loadDatabase(): Promise<DbSchema> {
  try {
    const dataDir = path.dirname(DB_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true }); // Create .data directory if it doesn't exist
    const data = await fs.readFile(DB_FILE_PATH, 'utf8');
    return JSON.parse(data) as DbSchema;
  } catch (error) {
    // If file doesn't exist or is empty/invalid, initialize with default
    return { issues: [], issueKeyCounter: 0 };
  }
}

/**
 * Saves the database to a JSON file.
 * @param {DbSchema} data - The database data to save.
 * @returns {Promise<void>}
 */
async function saveDatabase(data: DbSchema): Promise<void> {
  try {
    const jsonData = JSON.stringify(data, null, 2);
    await fs.writeFile(DB_FILE_PATH, jsonData);
  } catch (error) {
    console.error('Error saving database:', error);
    throw error; // Re-throw the error to be handled by the caller if needed
  }
}


export { BaseIssue, EpicSpecifics, SubtaskSpecifics, Task, Story, Bug, Epic, Subtask, AnyIssue, DbSchema, loadDatabase, saveDatabase, DB_FILE_PATH };
