import { Task as TaskModel } from '../models/issue';
import { Database } from '../db/database';

export class TaskService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async getAllTasks(): Promise<TaskModel[]> {
    return this.db.getAllTasks();
  }

  async getTaskById(id: string): Promise<TaskModel | undefined> {
    return this.db.getTaskById(id);
  }

  async createTask(task: {title: string, description?: string}): Promise<TaskModel> {
    // Setting default values for createTask
    const newTask = {
        ...task,
        key: this.generateIssueKey('TASK',1),
        issueType: 'Task',
        status: 'Todo',
        id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    return this.db.createTask(newTask);
  }

  async updateTask(id: string, updates: Partial<Omit<TaskModel, 'id' | 'key' | 'issueType' | 'createdAt' | 'updatedAt' | 'status'>>): Promise<TaskModel | undefined> {
    return this.db.updateTask(id, updates);
  }

  async deleteTask(id: string): Promise<TaskModel | undefined> {
    return this.db.deleteTask(id);
  }

  /**
   * Generates a unique issue key based on the issue type and counter.
   * @param issueType The type of the issue (e.g., 'TASK', 'STOR', 'EPIC', 'BUG', 'SUBT').
   * @param counter A counter for the issue type.
   * @returns The generated issue key string (e.g., 'TASK-001').
   * @throws {Error} If the issueType is unknown.
   */
  generateIssueKey(issueType: string, counter: number): string {
    const prefixes: { [key: string]: string } = {
      'TASK': 'TASK',
      'STOR': 'STOR',
      'EPIC': 'EPIC',
      'BUG': 'BUG',
      'SUBT': 'SUBT',
    };

    const prefix = prefixes[issueType];

    if (!prefix) {
      throw new Error(`Unknown issue type: ${issueType}`);
    }

    // Pad the counter with leading zeros to ensure it's 3 digits
    const paddedCounter = String(counter).padStart(3, '0');

    return `${prefix}-${paddedCounter}`;
  }
}
