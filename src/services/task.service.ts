import { Task, AnyIssue, DbSchema, Subtask } from '../models/issue';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '../db/database';

interface CreateTaskParams {
  title: string;
  description?: string;
  issueType: 'TASK' | 'STOR' | 'EPIC' | 'BUG' | 'SUBT';
  status: 'Todo' | 'In Progress' | 'Done';
  parentIssueKey?: string;
}

export class TaskService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Creates a new task.
   * @param params The parameters for creating a task.
   * @returns The created task.
   */
  async createTask(params: CreateTaskParams): Promise<AnyIssue> {
    const { title, description, issueType, status, parentIssueKey } = params;

    // Generate a unique ID
    const id = uuidv4();

    // Generate a key (This is a simplified version. Will improve later.)
    const issueKeyCounter = this.db.getIssueKeyCounter();
    const key = `TEST-${issueKeyCounter + 1}`; // Simple key generation for now.

    let newTask: AnyIssue;

    if (issueType === 'SUBT') {
        if (!parentIssueKey) {
            throw new Error('parentIssueKey is required for Subtask');
        }
        newTask = {
            id,
            key,
            issueType,
            summary: title,
            description: description,
            status: status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            parentIssueKey: parentIssueKey,
        } as Subtask; // Cast to Subtask
    } else {
        newTask = {
            id,
            key,
            issueType,
            summary: title,
            description: description,
            status: status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    await this.db.addIssue(newTask);
    this.db.incrementIssueKeyCounter(); // Increment the counter.

    return newTask;
  }
}
