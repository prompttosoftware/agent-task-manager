import { Task as TaskModel, DbSchema } from '../models/issue';
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

/**
 * A basic in-memory database implementation for tasks.
 * Currently uses dummy data and simple array operations.
 */
export class Database {
  private tasks: TaskModel[] = []; // In-memory storage
  private issueKeyCounter: number = 0;
  private ready: Promise<void>; // Promise that resolves when the database is loaded

  constructor() {
    this.ready = this.loadDatabase().then(() => {
      console.log('Database loaded');
    }).catch(err => {
      console.error('Failed to load database:', err);
      // Rethrow the error so the 'ready' promise rejects if loading fails
      throw err;
    });
  }

  /**
   * Loads the database state from the file system specified by `DB_FILE_PATH`.
   * If the file does not exist (`ENOENT`), it initializes the database with an empty state ({ issues: [], issueKeyCounter: 0 })
   * and saves it to the file.
   * If the file contains invalid JSON (`SyntaxError`), it also initializes to an empty state and saves it.
   * Any other errors during loading are caught, logged, and re-thrown.
   * @returns A promise that resolves when the database has been successfully loaded or initialized.
   * @throws {Error} If an error other than `ENOENT` or `SyntaxError` occurs during file reading or writing.
   */
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

  /**
   * Saves the provided database state (`DbSchema`) to the file system at `DB_FILE_PATH`.
   * It ensures the directory containing the file exists by creating it recursively if necessary.
   * The data is written as JSON with a 2-space indentation for readability.
   * Errors during directory creation or file writing are caught, logged, and re-thrown.
   * @param data The database schema object (`DbSchema`) representing the current state (issues and issueKeyCounter) to save.
   * @returns A promise that resolves when the database has been successfully saved to the file.
   * @throws {Error} If an error occurs during directory creation or file writing.
   */
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
    await this.ready; // Ensure database is loaded
    // Simulate asynchronous operation
    return Promise.resolve([...this.tasks]);
  }

  /**
   * Retrieves a task by its unique ID.
   * @param id The ID of the task to retrieve.
   * @returns A promise resolving to the task if found, otherwise undefined.
   */
  async getTaskById(id: string): Promise<TaskModel | undefined> {
    await this.ready; // Ensure database is loaded
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
    await this.ready; // Ensure database is loaded
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
    await this.ready; // Ensure database is loaded
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
    await this.ready; // Ensure database is loaded
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
