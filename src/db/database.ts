import { Task as TaskModel } from '../models/issue';

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

  constructor() {
    // Initialize with some dummy data
    this.tasks = [
      {
        id: '1',
        key: 'TASK-001',
        issueType: 'Task',
        summary: 'Learn TypeScript',
        description: 'Understand the basics of TypeScript',
        status: 'Todo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        key: 'TASK-002',
        issueType: 'Task',
        summary: 'Build a REST API',
        description: 'Create endpoints for task management',
        status: 'In Progress',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        key: 'TASK-003',
        issueType: 'Task',
        summary: 'Write Unit Tests',
        description: 'Ensure code quality with tests',
        status: 'Done',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
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
      key: 'TASK-' + (this.tasks.length + 1).toString().padStart(3, '0'),
      issueType: 'Task',
      summary: data.title,
      description: data.description,
      status: 'Todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.push(newTask);
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
    return Promise.resolve({ ...deletedTask });
  }
}
