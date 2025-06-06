import { Task as TaskModel } from '../models/issue';
import * as fs from 'fs/promises';
import * as path from 'path';

const DB_FILE_PATH = '/usr/src/agent-task-manager/.data/db.json';

/**
 * Represents the data needed to create a new task.
 * Excludes fields typically set by the database (like id, timestamps).
 */
interface CreateTaskData {
  title: string;
  description?: string;
  completed?: boolean; // Allow setting initial completion state
}

/**
 * Represents the data needed to update an existing task.
 * All fields are optional as updates can be partial.
 */
interface UpdateTaskData {
  title?: string;
  description?: string;
  completed?: boolean;
}

interface DbSchema {
  issues: TaskModel[];
  issueKeyCounter: number;
}

/**
 * A basic in-memory database implementation for tasks.
 * Currently uses dummy data and simple array operations.
 */
export class Database {
  private tasks: TaskModel[] = []; // In-memory storage
  private issueKeyCounter: number = 0;

  constructor() {
    this.loadDatabase().then(() => {
      console.log('Database loaded');
    }).catch(err => {
      console.error('Failed to load database:', err);
    });
  }

  async loadDatabase(): Promise<void> {
    try {
      const data = await fs.readFile(DB_FILE_PATH, 'utf-8');
      const dbSchema: DbSchema = JSON.parse(data);
      this.tasks = dbSchema.issues;
      this.issueKeyCounter = dbSchema.issueKeyCounter;
      console.log('Database loaded from file.');
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        // File does not exist, initialize with default values
        await this.saveDatabase({ issues: [], issueKeyCounter: 0 });
        this.tasks = [];
        this.issueKeyCounter = 0;
        console.log('Database initialized.  File not found.');
      } else if (error instanceof SyntaxError) {
        // Handle invalid JSON
        console.error('Invalid JSON in database file.  Initializing to empty.');
        await this.saveDatabase({ issues: [], issueKeyCounter: 0 });
        this.tasks = [];
        this.issueKeyCounter = 0;

      }
      else {
        console.error('Error loading database:', error);
        throw error; // Re-throw to be caught in the constructor
      }
    }
  }

  async saveDatabase(data: DbSchema): Promise<void> {
    try {
      const dirPath = path.dirname(DB_FILE_PATH);
      await fs.mkdir(dirPath, { recursive: true });
      await fs.writeFile(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
      console.log('Database saved to file.');
    } catch (error) {
      console.error('Error saving database:', error);
      throw error;
    }
  }

  /**
   * Retrieves all tasks from the database.
   * @returns A promise resolving to an array of tasks.
   */
  async getAllTasks(): Promise<TaskModel[]> {
    // Simulate asynchronous operation
    return Promise.resolve([...this.tasks]);
  }

  /**
   * Retrieves a task by its unique ID.
   * @param id The ID of the task to retrieve.
   * @returns A promise resolving to the task if found, otherwise undefined.
   */
  async getTaskById(id: string): Promise<TaskModel | undefined> {
    // Simulate asynchronous operation
    const task = this.tasks.find((task) => task.id === id);
    return Promise.resolve(task ? { ...task } : undefined);
  }

  /**
   * Creates a new task in the database.
   * @param data The data for the new task.
   * @returns A promise resolving to the newly created task.
   */
  async createTask(data: CreateTaskData): Promise<TaskModel> {
    // Simulate asynchronous operation and database-like ID generation
    const newTask: TaskModel = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5), // Simple unique ID
      key: 'TASK-' + (++this.issueKeyCounter).toString().padStart(3, '0'),
      issueType: 'Task',
      summary: data.title,
      description: data.description,
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    await this.saveDatabase({ issues: this.tasks, issueKeyCounter: this.issueKeyCounter });
    return Promise.resolve({ ...newTask });
  }

  /**
   * Updates an existing task by its ID.
   * @param id The ID of the task to update.
   * @param data The data to update the task with.
   * @returns A promise resolving to the updated task if found, otherwise undefined.
   */
  async updateTask(id: string, data: UpdateTaskData): Promise<TaskModel | undefined> {
    // Simulate asynchronous operation
    const index = this.tasks.findIndex((task) => task.id === id);

    if (index === -1) {
      return Promise.resolve(undefined);
    }

    const originalTask = this.tasks[index];
    const updatedTask = {
      ...originalTask,
      summary: data.title !== undefined ? data.title : originalTask.summary,
      description: data.description !== undefined ? data.description : originalTask.description,
      updatedAt: new Date().toISOString(), // Update timestamp
    };

    this.tasks[index] = updatedTask;
    await this.saveDatabase({ issues: this.tasks, issueKeyCounter: this.issueKeyCounter });

    return Promise.resolve({ ...updatedTask });
  }

  /**
   * Deletes a task by its ID.
   * @param id The ID of the task to delete.
   * @returns A promise resolving to the deleted task if found, otherwise undefined.
   */
  async deleteTask(id: string): Promise<TaskModel | undefined> {
    // Simulate asynchronous operation
    const index = this.tasks.findIndex((task) => task.id === id);

    if (index === -1) {
      return Promise.resolve(undefined);
    }

    const [deletedTask] = this.tasks.splice(index, 1);
    await this.saveDatabase({ issues: this.tasks, issueKeyCounter: this.issueKeyCounter });
    return Promise.resolve({ ...deletedTask });
  }
}
